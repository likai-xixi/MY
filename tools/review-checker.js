import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ensure, finish, isCli, projectPath, readJson, readText } from './common.js';
import {
  collectChangedFiles,
  isAllowedByRoot,
  isCanonicalRepositoryRoot,
  validateBaseRevision,
  validateRevisionAncestry
} from './diff-checker.js';

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

const BUSINESS_RUNTIME_ROOTS = [
  'backend/',
  'frontend/',
  'ruoyi-ui/'
];

const RUOYI_RUNTIME_ROOT = /^ruoyi-[^/]+\/src\/(?:main|test)\//;
const GENERATED_RUNTIME_ROOTS = [
  'backend/dist',
  'backend/node_modules',
  'frontend/dist',
  'frontend/node_modules',
  'ruoyi-ui/dist',
  'ruoyi-ui/node_modules'
];

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
  return /^\s*Decision:\s*Allow Implementation\s*$/mi.test(text);
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

function isSqlImplementationFile(file) {
  const normalized = normalizeFile(file);
  return normalized.startsWith('sql/') && extensionOf(normalized) === '.sql';
}

function isGeneratedRuntimePath(file) {
  const normalized = normalizeFile(file);
  return GENERATED_RUNTIME_ROOTS.some((root) => normalized === root || normalized.startsWith(`${root}/`));
}

export function isBusinessImplementationPath(file) {
  const normalized = normalizeFile(file);
  if (isSqlOwnershipFile(normalized) || isSqlImplementationFile(normalized)) {
    return true;
  }
  const inGenericRuntimeRoot = BUSINESS_RUNTIME_ROOTS.some((root) => normalized.startsWith(root));
  const inRuoyiRuntimeRoot = RUOYI_RUNTIME_ROOT.test(normalized);
  if (!inGenericRuntimeRoot && !inRuoyiRuntimeRoot) {
    return false;
  }
  if (inGenericRuntimeRoot && isGeneratedRuntimePath(normalized)) {
    return false;
  }
  return extensionOf(normalized) !== '.md';
}

function runGitResult(args) {
  try {
    return {
      status: 0,
      stdout: execFileSync('git', ['-c', 'core.quotepath=false', ...args], {
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

export function validateReviewCommittedAtBase({ reviewId, baseRevision, runGitResultFn = runGitResult } = {}) {
  const errors = [];
  for (const file of REQUIRED_REVIEW_FILES) {
    const repositoryPath = `ai/reviews/${reviewId}/${file}`;
    const result = runGitResultFn(['cat-file', '-e', `${baseRevision}:${repositoryPath}`]);
    ensure(
      result.status === 0,
      `${repositoryPath} must already exist in impact.baseRevision ${baseRevision}; implementation cannot self-approve a review in the same change.`,
      errors
    );
  }
  return errors;
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
      if (requireAllow) {
        ensure(String(data.baseRevision || '').trim().length > 0, `${label}/review.json baseRevision is required.`, errors);
        ensure(data.status === 'approved', `${label}/review.json status must be approved.`, errors);
        ensure(data.decision?.allowImplementation === true, `${label}/review.json decision.allowImplementation must be true.`, errors);
        ensure(Array.isArray(data.approvedFeatures) && data.approvedFeatures.length > 0, `${label}/review.json approvedFeatures must be a non-empty array.`, errors);
        ensure(Array.isArray(data.approvedEditRoots) && data.approvedEditRoots.length > 0, `${label}/review.json approvedEditRoots must be a non-empty array.`, errors);
        ensure(String(data.approvedEditRootsReason || '').trim().length > 0, `${label}/review.json approvedEditRootsReason is required.`, errors);
        for (const root of data.approvedEditRoots || []) {
          ensure(isCanonicalRepositoryRoot(root), `${label}/review.json approvedEditRoots entry ${JSON.stringify(root)} must be a canonical repository-relative path.`, errors);
        }
      }
    } catch (error) {
      errors.push(`${label}/review.json could not be read as JSON: ${error.message}`);
    }
  }

  return errors;
}

function featureIdFromImpact(impact) {
  return typeof impact?.feature === 'object' ? impact.feature.id || '' : impact?.feature || '';
}

function validReviewId(reviewId) {
  return path.basename(reviewId) === reviewId && reviewId.startsWith('RV-');
}

export function validateContextOverrideReview({
  impact = {},
  requestedFeature = '',
  changedFiles = null,
  reviewsRootPath = projectPath('ai/reviews'),
  readJsonFile = readJson,
  validateBaseRevisionFn = validateBaseRevision,
  validateRevisionBindingFn = validateRevisionAncestry,
  validateReviewBaseFn = validateReviewCommittedAtBase,
  validateReviewPackageFn = validateReviewDirectory
} = {}) {
  const errors = [];
  const activeFeature = featureIdFromImpact(impact);
  const candidate = String(requestedFeature || '').trim();
  const override = impact?.contextFeatureOverride;
  const reviewId = String(impact?.reviewId || '').trim();
  ensure(Boolean(candidate) && candidate !== activeFeature, 'Context feature override must target a different non-empty feature.', errors);
  ensure(candidate === String(override?.feature || '').trim(), 'Context feature override must match impact.contextFeatureOverride.feature.', errors);
  ensure(String(override?.reason || '').trim().length > 0, 'Context feature override requires impact.contextFeatureOverride.reason.', errors);
  ensure(Boolean(reviewId), 'Context feature override requires impact.reviewId.', errors);
  ensure(validReviewId(reviewId), `impact.reviewId ${reviewId} is invalid.`, errors);
  if (!reviewId || !validReviewId(reviewId)) {
    return errors;
  }

  const baseErrors = validateBaseRevisionFn(impact?.baseRevision);
  errors.push(...baseErrors);
  if (baseErrors.length > 0) {
    return errors;
  }
  const reviewRoot = `ai/reviews/${reviewId}/`;
  const resolvedChangedFiles = changedFiles === null
    ? collectChangedFiles({ baseRevision: impact.baseRevision })
    : changedFiles.map(normalizeFile);
  ensure(
    !resolvedChangedFiles.some((file) => file.startsWith(reviewRoot)),
    `${reviewRoot} must not change in the same Git range as a context feature override.`,
    errors
  );
  errors.push(...validateReviewBaseFn({ reviewId, baseRevision: impact.baseRevision }));
  errors.push(...validateReviewPackageFn({
    directory: path.join(resolveRoot(reviewsRootPath), reviewId),
    requireAllow: true
  }));

  let data;
  try {
    data = readJsonFile(`${reviewRoot}review.json`);
  } catch (error) {
    errors.push(`${reviewRoot}review.json could not be read: ${error.message}`);
    return errors;
  }
  ensure(data.id === reviewId, `${reviewRoot}review.json id must equal impact.reviewId ${reviewId}.`, errors);
  errors.push(...validateRevisionBindingFn(data.baseRevision, impact.baseRevision));
  ensure(data.status === 'approved', `${reviewRoot}review.json status must be approved.`, errors);
  ensure(data.decision?.allowImplementation === true, `${reviewRoot}review.json decision.allowImplementation must be true.`, errors);
  const approvedFeatures = Array.isArray(data.approvedFeatures) ? data.approvedFeatures : [];
  ensure(approvedFeatures.includes(activeFeature), `${reviewRoot}review.json approvedFeatures must include ${activeFeature}.`, errors);
  ensure(approvedFeatures.includes(candidate), `${reviewRoot}review.json approvedFeatures must include ${candidate}.`, errors);
  return errors;
}

function validateReferencedReview({
  rootPath,
  impact,
  changedFiles,
  validateBaseRevisionFn,
  validateRevisionBindingFn,
  validateReviewBaseFn
}) {
  const errors = [];
  const reviewId = String(impact?.reviewId || '').trim();
  ensure(Boolean(reviewId), 'Complex business implementation requires impact.reviewId.', errors);
  errors.push(...validateBaseRevisionFn(impact?.baseRevision));
  if (!reviewId) {
    return errors;
  }
  const reviewIdIsValid = validReviewId(reviewId);
  ensure(reviewIdIsValid, `impact.reviewId ${reviewId} is invalid.`, errors);
  if (!reviewIdIsValid) {
    return errors;
  }
  const directory = path.join(rootPath, reviewId);
  ensure(fs.existsSync(directory) && fs.statSync(directory).isDirectory(), `impact.reviewId ${reviewId} does not resolve to an ai/reviews package.`, errors);
  if (!fs.existsSync(directory) || !fs.statSync(directory).isDirectory()) {
    return errors;
  }

  const reviewRoot = `ai/reviews/${reviewId}/`;
  ensure(
    !changedFiles.map(normalizeFile).some((file) => file.startsWith(reviewRoot)),
    `${reviewRoot} must not change in the same Git range as business implementation.`,
    errors
  );
  errors.push(...validateReviewBaseFn({ reviewId, baseRevision: impact.baseRevision }));

  errors.push(...validateReviewDirectory({ directory, requireAllow: true }));
  const label = directory.replace(/\\/g, '/');
  let data = {};
  try {
    data = readJsonAny(path.join(directory, 'review.json'));
  } catch {
    return errors;
  }
  ensure(data.id === reviewId, `${label}/review.json id must equal impact.reviewId ${reviewId}.`, errors);
  errors.push(...validateRevisionBindingFn(data.baseRevision, impact.baseRevision));
  const featureId = featureIdFromImpact(impact);
  ensure(Boolean(featureId), 'Complex business implementation requires impact.feature.id.', errors);
  ensure((data.approvedFeatures || []).includes(featureId), `${label}/review.json approvedFeatures must include ${featureId}.`, errors);

  const approvedRoots = Array.isArray(data.approvedEditRoots) ? data.approvedEditRoots : [];
  for (const file of changedFiles.map(normalizeFile).filter(isBusinessImplementationPath)) {
    ensure(
      approvedRoots.some((root) => isAllowedByRoot(file, root)),
      `${file} is outside ${label}/review.json approvedEditRoots.`,
      errors
    );
  }
  return errors;
}

export function validateReviews({
  root = 'ai/reviews',
  requireAllow = false,
  changedFiles = collectChangedFiles(),
  impact = currentImpact(readJson),
  validateBaseRevisionFn = validateBaseRevision,
  validateRevisionBindingFn = validateRevisionAncestry,
  validateReviewBaseFn = validateReviewCommittedAtBase
} = {}) {
  const errors = [];
  const rootPath = resolveRoot(root);
  const directories = reviewDirs(rootPath);
  const needsImplementationReview = requireAllow && implementationReviewRequired({ impact, changedFiles });

  for (const directory of directories) {
    errors.push(...validateReviewDirectory({ directory, requireAllow: false }));
  }

  if (needsImplementationReview) {
    ensure(directories.length > 0, 'Complex business implementation requires an ai/reviews/RV-* review package.', errors);
    errors.push(...validateReferencedReview({
      rootPath,
      impact,
      changedFiles,
      validateBaseRevisionFn,
      validateRevisionBindingFn,
      validateReviewBaseFn
    }));
    ensure(
      !errors.some((error) => error.includes('missing Allow Implementation')),
      'Complex business implementation requires review decision.md to contain Allow Implementation.',
      errors
    );
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
