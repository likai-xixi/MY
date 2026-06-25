import fs from 'node:fs';
import { ensure, finish, isCli, projectPath, readJson, readText } from './common.js';
import { collectChangedFiles } from './diff-checker.js';

const THRESHOLDS = [
  {
    name: 'Vue file',
    matches: (file) => file.endsWith('.vue'),
    maxLines: 1600
  },
  {
    name: 'Java Service',
    matches: (file) => /Service(?:Impl)?\.java$/.test(file),
    maxLines: 1200
  },
  {
    name: 'Mapper XML',
    matches: (file) => /Mapper\.xml$/.test(file),
    maxLines: 900
  }
];

function currentChangeId(readJsonFile = readJson) {
  try {
    return readJsonFile('ai/changes/CURRENT_CHANGE.json').current || '';
  } catch {
    return '';
  }
}

function lineCount(text) {
  return text.length === 0 ? 0 : text.split(/\r?\n/).length;
}

function hasWeightJustification(id) {
  if (!id) {
    return false;
  }
  return fs.existsSync(projectPath(`ai/changes/${id}/split-plan.md`))
    || fs.existsSync(projectPath(`ai/changes/${id}/weight-exception.md`));
}

function statChangedFile(file) {
  return fs.statSync(projectPath(file));
}

function changedRegularFiles(changedFiles, errors, warnings, statFile = statChangedFile) {
  const files = [];
  const seen = new Set();
  for (const item of changedFiles) {
    const file = String(item || '').replace(/\\/g, '/');
    if (!file || seen.has(file)) {
      continue;
    }
    seen.add(file);

    let stats;
    try {
      stats = statFile(file);
    } catch (error) {
      if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
        continue;
      }
      errors.push(`Cannot inspect ${file}: ${error.message}`);
      continue;
    }

    if (stats.isDirectory()) {
      warnings.push(`${file} is a directory listed as changed; file-weight check skips directories.`);
      continue;
    }
    if (!stats.isFile()) {
      errors.push(`${file} is not a regular file; file-weight check only reads files.`);
      continue;
    }
    files.push(file);
  }
  return files;
}

function methodLengthWarnings(file, text) {
  const warnings = [];
  const lines = text.split(/\r?\n/);
  let current = null;
  let depth = 0;
  const startPattern = /^\s*(?:public|private|protected|async|function|const|let|var|export|static|\w+\s+\w+[\s<>,\[\]]*)[\w\s<>,\[\]]*\([^;]*\)\s*(?:=>\s*)?\{/;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!current && startPattern.test(line)) {
      current = { start: index + 1 };
      depth = 0;
    }
    if (current) {
      depth += (line.match(/\{/g) || []).length;
      depth -= (line.match(/\}/g) || []).length;
      if (depth <= 0) {
        const length = index + 1 - current.start + 1;
        if (length > 120) {
          warnings.push(`${file}:${current.start} method/function is ${length} lines; consider splitting.`);
        }
        current = null;
      }
    }
  }
  return warnings;
}

export function validateFileWeight({
  changedFiles = collectChangedFiles(),
  readJsonFile = readJson,
  readTextFile = readText,
  statFile = statChangedFile
} = {}) {
  const errors = [];
  const warnings = [];
  const id = currentChangeId(readJsonFile);
  const justified = hasWeightJustification(id);

  for (const file of changedRegularFiles(changedFiles, errors, warnings, statFile)) {
    const threshold = THRESHOLDS.find((item) => item.matches(file));
    const text = readTextFile(file);
    if (threshold) {
      const lines = lineCount(text);
      ensure(lines <= threshold.maxLines || justified, `${file} is a changed ${threshold.name} with ${lines} lines; add ai/changes/${id}/split-plan.md or weight-exception.md.`, errors);
    }
    if (/\.(java|js|ts|vue)$/.test(file)) {
      warnings.push(...methodLengthWarnings(file, text));
    }
  }

  return { errors, warnings };
}

if (isCli(import.meta.url)) {
  const { errors, warnings } = validateFileWeight();
  for (const warning of warnings) {
    console.warn(`warning: ${warning}`);
  }
  finish('check:file-weight', errors);
}
