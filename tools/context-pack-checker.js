import fs from 'node:fs';
import path from 'node:path';
import { ensure, finish, isCli, projectPath, readJson, readText } from './common.js';

const REQUIRED_JSON_FIELDS = [
  'currentFeature',
  'currentChange',
  'allowedEditRoots',
  'forbiddenEditRoots',
  'mustReadFiles',
  'mustNotBreak',
  'roadmapBlockers',
  'phaseGates',
  'refactorDebt',
  'verificationCommands',
  'nextSteps'
];

const BULK_READ_PATTERNS = [
  /^ai\/changes\/?$/,
  /^ai\/reviews\/?$/,
  /^features\/?$/,
  /^\.$/,
  /^ruoyi-/,
  /^backend\/?$/,
  /^frontend\/?$/
];

function lineCount(text) {
  return text.length === 0 ? 0 : text.split(/\r?\n/).length;
}

function featureContextFiles() {
  const dir = projectPath('ai/context/features');
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs.readdirSync(dir)
    .filter((file) => file.endsWith('.md'))
    .map((file) => `ai/context/features/${file}`);
}

function isBulkReadPath(file) {
  const normalized = String(file || '').replace(/\\/g, '/').replace(/^\.\/+/, '');
  return BULK_READ_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function validateContextPack({
  markdownFile = 'ai/context/current-context.md',
  jsonFile = 'ai/context/current-context.json',
  readFile = readText,
  readJsonFile = readJson
} = {}) {
  const errors = [];
  let markdown = '';
  let data;
  try {
    markdown = readFile(markdownFile);
  } catch (error) {
    errors.push(`${markdownFile} could not be read: ${error.message}`);
  }
  try {
    data = readJsonFile(jsonFile);
  } catch (error) {
    errors.push(`${jsonFile} could not be read as JSON: ${error.message}`);
  }
  if (errors.length > 0) {
    return errors;
  }

  ensure(lineCount(markdown) <= 700, `${markdownFile} must be 700 lines or fewer.`, errors);
  for (const field of REQUIRED_JSON_FIELDS) {
    ensure(data[field] !== undefined, `${jsonFile} missing ${field}.`, errors);
  }
  ensure(Array.isArray(data.mustReadFiles), `${jsonFile} mustReadFiles must be an array.`, errors);
  if (Array.isArray(data.mustReadFiles)) {
    ensure(data.mustReadFiles.length <= 25 || typeof data.mustReadOverflowReason === 'string', `${jsonFile} mustReadFiles exceeds 25 without mustReadOverflowReason.`, errors);
    for (const [index, entry] of data.mustReadFiles.entries()) {
      ensure(typeof entry.path === 'string' && entry.path.trim().length > 0, `${jsonFile} mustReadFiles[${index}] missing path.`, errors);
      ensure(typeof entry.reason === 'string' && entry.reason.trim().length > 0, `${jsonFile} mustReadFiles[${index}] missing reason.`, errors);
      ensure(!isBulkReadPath(entry.path), `${jsonFile} mustReadFiles[${index}] uses bulk-read path ${entry.path}.`, errors);
    }
  }

  for (const file of featureContextFiles()) {
    const count = lineCount(readFile(file));
    ensure(count <= 500, `${file} must be 500 lines or fewer.`, errors);
  }

  ensure(!/read all (changes|reviews|features|code)/i.test(markdown), `${markdownFile} must not instruct full-history/full-code reads.`, errors);
  ensure(!markdown.includes(path.resolve('.')), `${markdownFile} must not embed local absolute workspace paths.`, errors);

  return errors;
}

if (isCli(import.meta.url)) {
  finish('check:context-pack', validateContextPack());
}
