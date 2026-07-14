import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {
  isAlias,
  isMap,
  isSeq,
  LineCounter,
  parseDocument
} from 'yaml';

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

export function listFiles(root, relativeDir, predicate = () => true, {
  shouldTraverseDirectory = (relativePath) => !isGeneratedPath(relativePath)
} = {}) {
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
        if (shouldTraverseDirectory(rel)) {
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

function resolveYamlNode(document, node) {
  let current = node;
  const seen = new Set();
  while (isAlias(current)) {
    if (seen.has(current)) {
      return null;
    }
    seen.add(current);
    current = current.resolve(document);
  }
  return current;
}

function yamlNodeValue(document, node) {
  const resolved = resolveYamlNode(document, node);
  if (resolved === null || resolved === undefined) {
    return undefined;
  }
  if ('value' in resolved) {
    return resolved.value;
  }
  return resolved.toJSON?.() ?? undefined;
}

function yamlMapPair(document, node, key) {
  const map = resolveYamlNode(document, node);
  if (!isMap(map)) {
    return null;
  }
  return map.items.find((pair) => String(yamlNodeValue(document, pair.key)) === key) || null;
}

function yamlMapNode(document, node, key) {
  return resolveYamlNode(document, yamlMapPair(document, node, key)?.value);
}

function yamlString(document, node) {
  const value = yamlNodeValue(document, node);
  return value === null || value === undefined ? '' : String(value);
}

function yamlLine(lineCounter, node) {
  const offset = node?.range?.[0];
  return Number.isInteger(offset) ? lineCounter.linePos(offset).line : 0;
}

function parsedWorkflowDocuments(root) {
  return workflowFiles(root).map((file) => {
    const lineCounter = new LineCounter();
    const document = parseDocument(readText(root, file), {
      lineCounter,
      prettyErrors: false,
      uniqueKeys: true
    });
    return { file, document, lineCounter };
  });
}

function workflowJobs(entry) {
  if (entry.document.errors.length > 0) {
    return [];
  }
  const jobs = yamlMapNode(entry.document, entry.document.contents, 'jobs');
  if (!isMap(jobs)) {
    return [];
  }
  return jobs.items.flatMap((pair) => {
    const job = resolveYamlNode(entry.document, pair.value);
    return isMap(job) ? [{ id: yamlString(entry.document, pair.key), node: job }] : [];
  });
}

function explicitFalse(document, pair) {
  return Boolean(pair) && yamlNodeValue(document, pair.value) === false;
}

function defaultRunPair(document, node, key) {
  const defaults = yamlMapNode(document, node, 'defaults');
  const run = yamlMapNode(document, defaults, 'run');
  return yamlMapPair(document, run, key);
}

function defaultWorkingDirectory(document, node) {
  return yamlString(document, defaultRunPair(document, node, 'working-directory')?.value);
}

function yamlScalarMap(document, node, key) {
  const map = yamlMapNode(document, node, key);
  if (!isMap(map)) {
    return {};
  }
  return Object.fromEntries(map.items.map((pair) => [
    yamlString(document, pair.key),
    yamlString(document, pair.value)
  ]));
}

function workflowStepRecords(entry) {
  const records = [];
  const workflowDefault = defaultWorkingDirectory(entry.document, entry.document.contents);
  const workflowDefaultShell = defaultRunPair(entry.document, entry.document.contents, 'shell');
  const workflowEnvironment = yamlScalarMap(entry.document, entry.document.contents, 'env');
  for (const job of workflowJobs(entry)) {
    const steps = yamlMapNode(entry.document, job.node, 'steps');
    if (!isSeq(steps)) {
      continue;
    }
    const jobCondition = yamlMapPair(entry.document, job.node, 'if');
    const jobContinueOnError = yamlMapPair(entry.document, job.node, 'continue-on-error');
    const jobNeeds = yamlMapPair(entry.document, job.node, 'needs');
    const jobDefault = defaultWorkingDirectory(entry.document, job.node) || workflowDefault;
    const jobDefaultShell = defaultRunPair(entry.document, job.node, 'shell') || workflowDefaultShell;
    const jobContainer = yamlMapNode(entry.document, job.node, 'container');
    const jobEnvironment = {
      ...workflowEnvironment,
      ...yamlScalarMap(entry.document, jobContainer, 'env'),
      ...yamlScalarMap(entry.document, job.node, 'env')
    };
    steps.items.forEach((item, stepIndex) => {
      const step = resolveYamlNode(entry.document, item);
      if (!isMap(step)) {
        return;
      }
      const condition = yamlMapPair(entry.document, step, 'if');
      const continueOnError = yamlMapPair(entry.document, step, 'continue-on-error');
      const workingDirectory = yamlMapPair(entry.document, step, 'working-directory');
      const shell = yamlMapPair(entry.document, step, 'shell') || jobDefaultShell;
      records.push({
        file: entry.file,
        document: entry.document,
        lineCounter: entry.lineCounter,
        jobId: job.id,
        stepIndex,
        node: step,
        workingDirectory: workingDirectory
          ? yamlString(entry.document, workingDirectory.value)
          : jobDefault,
        environment: {
          ...jobEnvironment,
          ...yamlScalarMap(entry.document, step, 'env')
        },
        conditionSpecified: Boolean(condition),
        condition: yamlString(entry.document, condition?.value),
        jobConditionSpecified: Boolean(jobCondition),
        jobCondition: yamlString(entry.document, jobCondition?.value),
        jobNeedsSpecified: Boolean(jobNeeds),
        shellSpecified: Boolean(shell),
        shell: yamlString(entry.document, shell?.value),
        continueOnErrorSpecified: Boolean(continueOnError),
        continueOnErrorExplicitFalse: explicitFalse(entry.document, continueOnError),
        continueOnErrorLine: yamlLine(entry.lineCounter, continueOnError?.key),
        jobContinueOnErrorSpecified: Boolean(jobContinueOnError),
        jobContinueOnErrorExplicitFalse: explicitFalse(entry.document, jobContinueOnError),
        jobContinueOnErrorLine: yamlLine(entry.lineCounter, jobContinueOnError?.key)
      });
    });
  }
  return records;
}

export function workflowYamlDiagnostics(root) {
  return parsedWorkflowDocuments(root).flatMap((entry) => entry.document.errors.map((error) => ({
    file: entry.file,
    line: Number.isInteger(error.pos?.[0])
      ? entry.lineCounter.linePos(error.pos[0]).line
      : Number(error.linePos?.[0]?.line || 0),
    message: error.message
  })));
}

export function workflowContinueOnErrorSettings(root) {
  const settings = [];
  for (const entry of parsedWorkflowDocuments(root)) {
    for (const job of workflowJobs(entry)) {
      const jobSetting = yamlMapPair(entry.document, job.node, 'continue-on-error');
      if (jobSetting) {
        settings.push({
          file: entry.file,
          line: yamlLine(entry.lineCounter, jobSetting.key),
          kind: 'job',
          explicitFalse: explicitFalse(entry.document, jobSetting)
        });
      }
      const steps = yamlMapNode(entry.document, job.node, 'steps');
      if (!isSeq(steps)) {
        continue;
      }
      for (const item of steps.items) {
        const step = resolveYamlNode(entry.document, item);
        const stepSetting = yamlMapPair(entry.document, step, 'continue-on-error');
        if (stepSetting) {
          settings.push({
            file: entry.file,
            line: yamlLine(entry.lineCounter, stepSetting.key),
            kind: 'step',
            explicitFalse: explicitFalse(entry.document, stepSetting)
          });
        }
      }
    }
  }
  return settings;
}

export function workflowRunSteps(root) {
  const steps = [];
  for (const entry of parsedWorkflowDocuments(root)) {
    for (const step of workflowStepRecords(entry)) {
      const run = yamlMapPair(entry.document, step.node, 'run');
      const command = yamlString(entry.document, run?.value).trim();
      if (!run || !command) {
        continue;
      }
      steps.push({
        file: step.file,
        line: yamlLine(entry.lineCounter, run.key),
        command,
        workingDirectory: step.workingDirectory,
        environment: step.environment,
        conditionSpecified: step.conditionSpecified,
        condition: step.condition,
        jobConditionSpecified: step.jobConditionSpecified,
        jobCondition: step.jobCondition,
        jobNeedsSpecified: step.jobNeedsSpecified,
        shellSpecified: step.shellSpecified,
        shell: step.shell,
        continueOnErrorSpecified: step.continueOnErrorSpecified,
        continueOnErrorExplicitFalse: step.continueOnErrorExplicitFalse,
        jobContinueOnErrorSpecified: step.jobContinueOnErrorSpecified,
        jobContinueOnErrorExplicitFalse: step.jobContinueOnErrorExplicitFalse
      });
    }
  }
  return steps;
}

function workflowStepInputs(entry, step) {
  const inputs = {};
  const withNode = yamlMapNode(entry.document, step, 'with');
  if (!isMap(withNode)) {
    return inputs;
  }
  for (const pair of withNode.items) {
    inputs[yamlString(entry.document, pair.key)] = yamlString(entry.document, pair.value);
  }
  return inputs;
}

export function workflowUses(root) {
  const uses = [];
  for (const entry of parsedWorkflowDocuments(root)) {
    for (const job of workflowJobs(entry)) {
      const jobUse = yamlMapPair(entry.document, job.node, 'uses');
      if (jobUse) {
        uses.push({
          file: entry.file,
          line: yamlLine(entry.lineCounter, jobUse.key),
          target: yamlString(entry.document, jobUse.value),
          kind: 'job',
          inputs: {}
        });
      }
    }
    for (const step of workflowStepRecords(entry)) {
      const stepUse = yamlMapPair(entry.document, step.node, 'uses');
      if (!stepUse) {
        continue;
      }
      uses.push({
        file: entry.file,
        line: yamlLine(entry.lineCounter, stepUse.key),
        target: yamlString(entry.document, stepUse.value),
        kind: 'step',
        inputs: workflowStepInputs(entry, step.node)
      });
    }
  }
  return uses;
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
