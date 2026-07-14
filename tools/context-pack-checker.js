import fs from 'node:fs';
import path from 'node:path';
import { buildMarkdown, buildMustReadFiles } from '../scripts/context-build.js';
import { ensure, finish, isCli, projectPath, readJson, readText } from './common.js';
import { validateContextOverrideReview } from './review-checker.js';

const REQUIRED_JSON_FIELDS = [
  'currentFeature',
  'currentChange',
  'repositoryProfile',
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

function normalizeList(items) {
  return [...new Set((Array.isArray(items) ? items : [])
    .map((item) => String(item || '').replace(/\\/g, '/').replace(/\/$/, ''))
    .filter(Boolean))]
    .sort();
}

function sameList(left, right) {
  return JSON.stringify(normalizeList(left)) === JSON.stringify(normalizeList(right));
}

function impactFeatureId(impact) {
  return typeof impact?.feature === 'object' ? impact.feature.id || '' : impact?.feature || '';
}

function isAbsoluteLike(value) {
  const file = String(value || '').trim();
  return path.posix.isAbsolute(file)
    || path.win32.isAbsolute(file)
    || /^[a-z]:[\\/]/i.test(file)
    || /^\\\\/.test(file);
}

function repositoryFileExists(file) {
  try {
    return fs.statSync(projectPath(file)).isFile();
  } catch {
    return false;
  }
}

function registeredFeatureIds(readJsonFile) {
  try {
    return new Set((readJsonFile('ai/registry/features.json').features || [])
      .filter((feature) => feature.status !== 'removed')
      .map((feature) => feature.id));
  } catch {
    return new Set();
  }
}

export function validateContextBinding({
  data,
  readJsonFile = readJson,
  contextOverrideValidation = {},
  validateContextOverrideReviewFn = validateContextOverrideReview
} = {}) {
  const errors = [];
  let current = '';
  let impact = {};
  try {
    current = readJsonFile('ai/changes/CURRENT_CHANGE.json').current || '';
    impact = current ? readJsonFile(`ai/changes/${current}/impact.json`) : {};
  } catch (error) {
    return [`Active change context could not be read: ${error.message}`];
  }
  ensure(Boolean(current), 'ai/changes/CURRENT_CHANGE.json must identify the active change.', errors);
  ensure(data.currentChange === current, `current-context currentChange must equal active change ${current}.`, errors);

  const activeFeature = impactFeatureId(impact);
  const override = impact?.contextFeatureOverride;
  const requestedFeature = String(data.currentFeature || '').trim();
  let overrideErrors = [];
  if (requestedFeature && requestedFeature !== activeFeature) {
    overrideErrors = validateContextOverrideReviewFn({
      impact,
      requestedFeature,
      readJsonFile,
      ...contextOverrideValidation
    });
    errors.push(...overrideErrors);
  }
  const overrideAllowed = String(override?.feature || '').trim() === requestedFeature
    && String(override?.reason || '').trim().length > 0
    && overrideErrors.length === 0;
  ensure(
    data.currentFeature === activeFeature || overrideAllowed,
    `current-context currentFeature must equal impact.feature.id ${activeFeature} or use impact.contextFeatureOverride with a reason.`,
    errors
  );
  const registeredFeatures = registeredFeatureIds(readJsonFile);
  ensure(registeredFeatures.has(data.currentFeature), `current-context currentFeature ${data.currentFeature} must be an active registered feature.`, errors);
  ensure(sameList(data.allowedEditRoots, impact.allowedEditRoots), 'current-context allowedEditRoots must exactly match active impact.allowedEditRoots.', errors);
  ensure(sameList(data.forbiddenEditRoots, impact.forbiddenEditRoots), 'current-context forbiddenEditRoots must exactly match active impact.forbiddenEditRoots.', errors);
  return errors;
}

export function validateContextPack({
  markdownFile = 'ai/context/current-context.md',
  jsonFile = 'ai/context/current-context.json',
  readFile = readText,
  readJsonFile = readJson,
  bindActiveContext = true,
  fileIsFile = repositoryFileExists,
  contextOverrideValidation = {},
  validateContextOverrideReviewFn = validateContextOverrideReview
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
  try {
    const expectedMarkdown = buildMarkdown(data).replace(/\r\n/g, '\n');
    ensure(
      markdown.replace(/\r\n/g, '\n') === expectedMarkdown,
      `${markdownFile} must exactly match current-context.json generated facts.`,
      errors
    );
  } catch (error) {
    errors.push(`${markdownFile} could not be regenerated from ${jsonFile}: ${error.message}`);
  }
  ensure(Array.isArray(data.mustReadFiles), `${jsonFile} mustReadFiles must be an array.`, errors);
  if (Array.isArray(data.mustReadFiles)) {
    const expectedMustReadFiles = buildMustReadFiles({
      feature: data.currentFeature,
      changeId: data.currentChange
    });
    ensure(
      JSON.stringify(data.mustReadFiles) === JSON.stringify(expectedMustReadFiles),
      `${jsonFile} mustReadFiles must match the generated current context for ${data.currentFeature}/${data.currentChange}.`,
      errors
    );
    ensure(data.mustReadFiles.length <= 25 || typeof data.mustReadOverflowReason === 'string', `${jsonFile} mustReadFiles exceeds 25 without mustReadOverflowReason.`, errors);
    for (const [index, entry] of data.mustReadFiles.entries()) {
      ensure(typeof entry.path === 'string' && entry.path.trim().length > 0, `${jsonFile} mustReadFiles[${index}] missing path.`, errors);
      ensure(typeof entry.reason === 'string' && entry.reason.trim().length > 0, `${jsonFile} mustReadFiles[${index}] missing reason.`, errors);
      ensure(!isBulkReadPath(entry.path), `${jsonFile} mustReadFiles[${index}] uses bulk-read path ${entry.path}.`, errors);
      ensure(!isAbsoluteLike(entry.path), `${jsonFile} mustReadFiles[${index}] must use a repository-relative path, not ${entry.path}.`, errors);
      ensure(fileIsFile(entry.path), `${jsonFile} mustReadFiles[${index}] references a missing or non-file path ${entry.path}.`, errors);
    }
  }

  for (const file of featureContextFiles()) {
    const count = lineCount(readFile(file));
    ensure(count <= 500, `${file} must be 500 lines or fewer.`, errors);
  }

  ensure(!/read all (changes|reviews|features|code)/i.test(markdown), `${markdownFile} must not instruct full-history/full-code reads.`, errors);
  const workspace = path.resolve('.');
  const workspaceVariants = [workspace, workspace.replace(/\\/g, '/'), workspace.replace(/\//g, '\\')]
    .map((value) => value.toLowerCase());
  const lowerMarkdown = markdown.toLowerCase();
  ensure(
    !workspaceVariants.some((value) => lowerMarkdown.includes(value))
      && !/(?:^|[\s`("'=])(?:[a-z]:[\\/]|\\\\)[^\s`"')]+/im.test(markdown),
    `${markdownFile} must not embed local absolute workspace paths.`,
    errors
  );

  if (bindActiveContext) {
    errors.push(...validateContextBinding({
      data,
      readJsonFile,
      contextOverrideValidation,
      validateContextOverrideReviewFn
    }));
  }

  return errors;
}

if (isCli(import.meta.url)) {
  finish('check:context-pack', validateContextPack());
}
