import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export const GENERATED_DIRS = new Set([
  '.git',
  '.vite',
  'build',
  'coverage',
  'dist',
  'node_modules',
  'target',
  'tmp'
]);

export function parseRootArg(args = process.argv.slice(2)) {
  const rootIndex = args.indexOf('--root');
  const root = rootIndex === -1 ? process.cwd() : args[rootIndex + 1] || process.cwd();
  return path.resolve(root);
}

export function toPosix(value) {
  return String(value || '').replace(/\\/g, '/');
}

export function normalizePath(value) {
  return toPosix(value).replace(/^\.\//, '').replace(/^\/+/, '');
}

export function resolveInside(root, relativePath) {
  const resolved = path.resolve(root, relativePath);
  const normalizedRoot = path.resolve(root);
  if (resolved !== normalizedRoot && !resolved.startsWith(`${normalizedRoot}${path.sep}`)) {
    throw new Error(`Path escapes root: ${relativePath}`);
  }
  return resolved;
}

export function pathExists(root, relativePath) {
  return fs.existsSync(resolveInside(root, relativePath));
}

export function readText(root, relativePath) {
  return fs.readFileSync(resolveInside(root, relativePath), 'utf8');
}

export function readJson(root, relativePath) {
  return JSON.parse(readText(root, relativePath));
}

export function writeJsonStable(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function isGeneratedPath(relativePath) {
  return normalizePath(relativePath).split('/').some((part) => GENERATED_DIRS.has(part));
}

export function listFiles(root, relativeDir, predicate = () => true) {
  const base = resolveInside(root, relativeDir);
  if (!fs.existsSync(base)) {
    return [];
  }
  const out = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      const rel = normalizePath(path.relative(root, full));
      if (entry.isDirectory()) {
        if (!isGeneratedPath(rel)) {
          walk(full);
        }
      } else if (predicate(rel)) {
        out.push(rel);
      }
    }
  };
  walk(base);
  return out.sort((a, b) => a.localeCompare(b));
}

export function currentChangeId(root) {
  try {
    return readJson(root, 'ai/changes/CURRENT_CHANGE.json').current || '';
  } catch {
    return '';
  }
}

export function currentFeatureId(root) {
  try {
    const context = readJson(root, 'ai/context/current-context.json');
    if (context.currentFeature) {
      return context.currentFeature;
    }
  } catch {
    // fall through
  }
  try {
    const registry = readJson(root, 'ai/registry/features.json');
    const feature = (registry.features || []).find((item) => item.status === 'active');
    return feature?.id || '';
  } catch {
    return '';
  }
}

export function registeredFeatures(root) {
  try {
    const registry = readJson(root, 'ai/registry/features.json');
    return (registry.features || [])
      .filter((feature) => ['active', 'registered'].includes(feature.status))
      .sort((a, b) => String(a.id).localeCompare(String(b.id)));
  } catch {
    return [];
  }
}

export function dictionaryAliases(root) {
  try {
    const dictionary = readJson(root, 'ai/registry/feature-id-dictionary.json');
    return new Map((dictionary.aliases || []).map((entry) => [entry.id, entry.aliases || []]));
  } catch {
    return new Map();
  }
}

export function currentDocTargets(root) {
  const targets = [
    {
      file: 'memory/HANDOVER.md',
      headings: ['Summary', 'Impact', 'Commands', 'Verification', 'Risks', 'Next Actions']
    },
    {
      file: 'memory/PROJECT_STATE.md',
      headings: ['Current Goal', 'Status', 'Active Features', 'Active Task', 'Latest Session', 'Next Actions', 'Last Verification']
    },
    {
      file: 'ai/context/current-context.md',
      headings: ['Allowed Edit Roots', 'Must Read Files', 'Must Not Break', 'Roadmap Blockers', 'beforeSalesOrder Gate', 'Verification Commands', 'Planned Verification Commands', 'Next Steps']
    },
    {
      file: 'README.md',
      headings: ['Current project status', 'Governance Pre-Review And Current Context']
    }
  ];
  for (const feature of registeredFeatures(root)) {
    const featureFile = feature.featureBrief || `features/${feature.id}.md`;
    targets.push({
      file: featureFile,
      headings: ['Identity', 'Current change', 'Current scope', 'Status']
    });
  }
  return targets;
}

function normalizeHeading(value) {
  return String(value || '').trim().replace(/`/g, '').toLowerCase();
}

function matchesHeading(title, targets) {
  const normalizedTitle = normalizeHeading(title);
  return targets.some((target) => {
    const normalizedTarget = normalizeHeading(target);
    return normalizedTitle === normalizedTarget || normalizedTitle.includes(normalizedTarget);
  });
}

export function sectionLineRecords(text, headings = null) {
  const lines = String(text || '').split(/\r?\n/);
  if (!headings || headings.length === 0) {
    return lines.map((textLine, index) => ({ line: index + 1, text: textLine, heading: '' }));
  }

  const records = [];
  let active = false;
  let activeLevel = 0;
  let activeHeading = '';
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const match = line.match(/^(#{1,6})\s+(.+?)\s*$/);
    if (match) {
      const level = match[1].length;
      const title = match[2].trim();
      if (matchesHeading(title, headings)) {
        active = true;
        activeLevel = level;
        activeHeading = title;
      } else if (active && level <= activeLevel) {
        active = false;
        activeHeading = '';
      }
    }
    if (active) {
      records.push({ line: index + 1, text: line, heading: activeHeading });
    }
  }
  return records;
}

export function issue({ file, line = 0, code, message, detail = '' }) {
  return {
    file: normalizePath(file),
    line,
    code,
    message,
    detail
  };
}

export function sortIssues(items) {
  return [...items].sort((a, b) => (
    a.file.localeCompare(b.file)
    || (a.line || 0) - (b.line || 0)
    || String(a.code || '').localeCompare(String(b.code || ''))
    || String(a.message || '').localeCompare(String(b.message || ''))
  ));
}

export function emptyResult() {
  return { failures: [], warnings: [] };
}

export function mergeResults(...results) {
  return {
    failures: results.flatMap((result) => result.failures || []),
    warnings: results.flatMap((result) => result.warnings || [])
  };
}

export function printIssues(name, result) {
  const warnings = sortIssues(result.warnings || []);
  const failures = sortIssues(result.failures || []);

  if (warnings.length > 0) {
    console.log(`${name}: warnings`);
    for (const warning of warnings) {
      const location = warning.line ? `${warning.file}:${warning.line}` : warning.file;
      console.log(`- ${location} [${warning.code}] ${warning.message}${warning.detail ? ` (${warning.detail})` : ''}`);
    }
  }
  if (failures.length > 0) {
    console.error(`${name}: failures`);
    for (const failure of failures) {
      const location = failure.line ? `${failure.file}:${failure.line}` : failure.file;
      console.error(`- ${location} [${failure.code}] ${failure.message}${failure.detail ? ` (${failure.detail})` : ''}`);
    }
    process.exitCode = 1;
    return false;
  }
  console.log(`${name}: ok`);
  return true;
}

export function workflowFiles(root) {
  return listFiles(root, '.github/workflows', (file) => /\.(ya?ml)$/i.test(file));
}

export function workflowText(root) {
  return workflowFiles(root).map((file) => readText(root, file)).join('\n');
}

export function workflowContains(root, pattern) {
  return pattern.test(workflowText(root));
}

export function runGit(root, args) {
  try {
    return {
      status: 0,
      stdout: execFileSync('git', ['-c', 'core.quotepath=false', ...args], {
        cwd: root,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe']
      }).trim()
    };
  } catch (error) {
    return {
      status: error.status ?? 1,
      stdout: String(error.stdout || '').trim(),
      stderr: String(error.stderr || '').trim()
    };
  }
}
