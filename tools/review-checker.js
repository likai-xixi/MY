import fs from 'node:fs';
import path from 'node:path';
import { ensure, finish, isCli, projectPath, readJson, readText } from './common.js';
import { collectChangedFiles } from './diff-checker.js';

export const REQUIRED_REVIEW_FILES = [
  'request.md',
  'context.md',
  'product-review.md',
  'architecture-review.md',
  'backend-review.md',
  'frontend-review.md',
  'qa-review.md',
  'risk-register.md',
  'decision.md',
  'review.json'
];

const REQUIRED_REVIEW_JSON_FIELDS = [
  'id',
  'request',
  'mode',
  'feature',
  'createdAt',
  'status',
  'decision',
  'requiredFiles'
];

const BUSINESS_IMPLEMENTATION_ROOTS = [
  'backend/modules/',
  'frontend/src/modules/',
  'ruoyi-business/src/main/java/com/ruoyi/business/',
  'ruoyi-business/src/main/resources/mapper/',
  'ruoyi-admin/src/main/java/com/ruoyi/web/controller/business/',
  'ruoyi-ui/src/views/',
  'ruoyi-ui/src/api/'
];

const IMPLEMENTATION_EXTENSIONS = new Set([
  '.java',
  '.js',
  '.ts',
  '.tsx',
  '.vue',
  '.xml',
  '.sql'
]);

function resolveRoot(root) {
  return path.isAbsolute(root) ? root : projectPath(root);
}

function readTextAny(file) {
  return fs.readFileSync(file, 'utf8');
}

function readJsonAny(file) {
  return JSON.parse(readTextAny(file));
}

function reviewDirs(rootPath) {
  if (!fs.existsSync(rootPath)) {
    return [];
  }
  return fs.readdirSync(rootPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('RV-'))
    .map((entry) => path.join(rootPath, entry.name))
    .sort();
}

function hasAllowImplementation(text) {
  return /\bAllow Implementation\b/.test(text);
}

function normalizeFile(file) {
  return String(file || '').replace(/\\/g, '/').replace(/^\.\/+/, '');
}

function extensionOf(file) {
  const base = path.posix.basename(file);
  const index = base.lastIndexOf('.');
  return index === -1 ? '' : base.slice(index).toLowerCase();
}

function isSqlOwnershipFile(file) {
  const normalized = normalizeFile(file);
  return normalized.startsWith('sql/') && normalized.endsWith('.ownership.md');
}

export function isBusinessImplementationPath(file) {
  const normalized = normalizeFile(file);
  if (isSqlOwnershipFile(normalized)) {
    return true;
  }
  if (!BUSINESS_IMPLEMENTATION_ROOTS.some((root) => normalized.startsWith(root))) {
    return false;
  }
  return IMPLEMENTATION_EXTENSIONS.has(extensionOf(normalized));
}

function currentChangeId(readJsonFile) {
  try {
    return readJsonFile('ai/changes/CURRENT_CHANGE.json').current || '';
  } catch {
    return '';
  }
}

function currentImpact(readJsonFile) {
  const id = currentChangeId(readJsonFile);
  if (!id) {
    return {};
  }
  try {
    return readJsonFile(`ai/changes/${id}/impact.json`);
  } catch {
    return {};
  }
}

export function implementationReviewRequired({ impact = {}, changedFiles = [] } = {}) {
  const changed = changedFiles.map(normalizeFile);
  if (changed.some(isBusinessImplementationPath)) {
    return true;
  }
  return false;
}

export function validateReviewDirectory({ directory, requireAllow = false }) {
  const errors = [];
  const label = directory.replace(/\\/g, '/');

  for (const file of REQUIRED_REVIEW_FILES) {
    const absolute = path.join(directory, file);
    ensure(fs.existsSync(absolute), `${label}/${file} is missing.`, errors);
    if (fs.existsSync(absolute)) {
      ensure(readTextAny(absolute).trim().length > 0, `${label}/${file} must not be empty.`, errors);
    }
  }

  const decisionPath = path.join(directory, 'decision.md');
  if (fs.existsSync(decisionPath)) {
    const decision = readTextAny(decisionPath);
    ensure(!requireAllow || hasAllowImplementation(decision), `${label}/decision.md is missing Allow Implementation.`, errors);
  }

  const jsonPath = path.join(directory, 'review.json');
  if (fs.existsSync(jsonPath)) {
    try {
      const data = readJsonAny(jsonPath);
      for (const field of REQUIRED_REVIEW_JSON_FIELDS) {
        ensure(data[field] !== undefined && data[field] !== '', `${label}/review.json missing ${field}.`, errors);
      }
      ensure(Array.isArray(data.requiredFiles), `${label}/review.json requiredFiles must be an array.`, errors);
    } catch (error) {
      errors.push(`${label}/review.json could not be read as JSON: ${error.message}`);
    }
  }

  return errors;
}

export function validateReviews({
  root = 'ai/reviews',
  requireAllow = false,
  changedFiles = collectChangedFiles(),
  impact = currentImpact(readJson)
} = {}) {
  const errors = [];
  const rootPath = resolveRoot(root);
  const directories = reviewDirs(rootPath);
  const needsImplementationReview = requireAllow && implementationReviewRequired({ impact, changedFiles });

  for (const directory of directories) {
    errors.push(...validateReviewDirectory({ directory, requireAllow: needsImplementationReview }));
  }

  if (needsImplementationReview) {
    ensure(directories.length > 0, 'Complex business implementation requires an ai/reviews/RV-* review package.', errors);
    const hasApprovedReview = directories.some((directory) => {
      const decisionPath = path.join(directory, 'decision.md');
      return fs.existsSync(decisionPath) && hasAllowImplementation(readTextAny(decisionPath));
    });
    ensure(hasApprovedReview, 'Complex business implementation requires review decision.md to contain Allow Implementation.', errors);
  }
  return errors;
}

function parseArgs(args) {
  const parsed = { root: 'ai/reviews', requireAllow: false };
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === '--root') {
      parsed.root = args[index + 1] || parsed.root;
      index += 1;
    } else if (args[index] === '--require-allow') {
      parsed.requireAllow = true;
    }
  }
  return parsed;
}

if (isCli(import.meta.url)) {
  finish('check:review', validateReviews(parseArgs(process.argv.slice(2))));
}
