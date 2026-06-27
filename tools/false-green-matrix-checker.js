import {
  fileExists,
  finish,
  isCli,
  readJson
} from './common.js';

export const MATRIX_PATH = 'ai/governance/false-green-regression-matrix.json';

export const REQUIRED_FALSE_GREEN_IDS = [
  'package-script-anti-theater',
  'false-green-matrix-covered-requires-test',
  'ci-green-not-release-green',
  'runtime-acceptance-not-local-green',
  'before-sales-order-runtime-bypass',
  'high-risk-permission-source-closure',
  'validation-sql-real-table-dependency',
  'ui-graph-real-source-only',
  'api-graph-permission-source',
  'forbidden-edit-roots-override-allowed',
  'ruoyi-business-permission-feature-mapping',
  'rule-object-explicit-preflight-id'
];

const REQUIRED_FIELDS = [
  'id',
  'title',
  'gate',
  'risk',
  'mustFailWhen',
  'coveredByTests',
  'sourceFiles',
  'status',
  'owner',
  'lastVerifiedByChange'
];

const ALLOWED_STATUSES = new Set(['covered', 'blocked', 'deferred']);
const VAGUE_REASON = /\b(todo|later|tbd)\b|以后再说|待定|回头/i;

function hasOwn(object, field) {
  return Object.prototype.hasOwnProperty.call(object || {}, field);
}

function isBlank(value) {
  if (value === undefined || value === null) {
    return true;
  }
  if (typeof value === 'string') {
    return value.trim().length === 0;
  }
  if (Array.isArray(value)) {
    return value.length === 0 || value.every((item) => isBlank(item));
  }
  if (typeof value === 'object') {
    return Object.keys(value).length === 0;
  }
  return false;
}

function arrayValue(value) {
  return Array.isArray(value) ? value : [];
}

function loadJson(readJsonFile, file, errors) {
  try {
    return readJsonFile(file);
  } catch (error) {
    errors.push(`${file} is missing or invalid JSON: ${error.message}`);
    return null;
  }
}

function validateRequiredFields(item, label, errors) {
  for (const field of REQUIRED_FIELDS) {
    if (!hasOwn(item, field)) {
      errors.push(`${label} missing required field ${field}.`);
      continue;
    }
    if (field === 'coveredByTests' && item.status !== 'covered') {
      continue;
    }
    if (isBlank(item[field])) {
      errors.push(`${label}.${field} must not be empty.`);
    }
  }
}

function validateGate({ item, label, scripts, exists, errors }) {
  const gate = String(item.gate || '').trim();
  if (!gate) {
    return;
  }
  if (scripts[gate]) {
    return;
  }
  if (/^(tools|scripts)\//.test(gate) && exists(gate)) {
    return;
  }
  if (arrayValue(item.sourceFiles).includes(gate) && exists(gate)) {
    return;
  }
  errors.push(`${label}.gate ${gate} must match a package.json script or an existing checker source file.`);
}

function validateFiles({ files, label, field, exists, errors, testFiles = false }) {
  if (!Array.isArray(files)) {
    errors.push(`${label}.${field} must be an array.`);
    return;
  }
  for (const file of files) {
    if (typeof file !== 'string' || !file.trim()) {
      errors.push(`${label}.${field} contains an empty file path.`);
      continue;
    }
    if (testFiles && !/^tests\/.+\.test\.js$/.test(file)) {
      errors.push(`${label}.${field} entry ${file} must be a tests/*.test.js file.`);
    }
    if (!exists(file)) {
      errors.push(`${label}.${field} references missing file ${file}.`);
    }
  }
}

function validateBlockedOrDeferred(item, label, errors) {
  if (!['blocked', 'deferred'].includes(item.status)) {
    return;
  }
  for (const field of ['owner', 'trigger', 'expiresAtPhase', 'reason']) {
    if (isBlank(item[field])) {
      errors.push(`${label}.${field} must not be empty when status is ${item.status}.`);
    }
  }
  if (!isBlank(item.reason) && VAGUE_REASON.test(String(item.reason))) {
    errors.push(`${label}.reason must not use vague placeholders such as todo, later, TBD, or以后再说.`);
  }
}

export function validateFalseGreenMatrix({
  matrix,
  packageScripts,
  readJsonFile = readJson,
  exists = fileExists
} = {}) {
  const errors = [];
  const data = matrix || loadJson(readJsonFile, MATRIX_PATH, errors);
  const pkg = packageScripts ? { scripts: packageScripts } : loadJson(readJsonFile, 'package.json', errors);
  const scripts = pkg?.scripts || {};

  if (!scripts['check:false-green-matrix']) {
    errors.push('package.json scripts.check:false-green-matrix must exist.');
  }
  if (!String(scripts.check || '').includes('check:false-green-matrix')) {
    errors.push('package.json scripts.check must include npm run check:false-green-matrix.');
  }

  if (!data) {
    return [...new Set(errors)];
  }
  if (data.schemaVersion !== 1) {
    errors.push(`${MATRIX_PATH} schemaVersion must be 1.`);
  }
  if (!Array.isArray(data.items)) {
    errors.push(`${MATRIX_PATH} items must be an array.`);
    return [...new Set(errors)];
  }

  const ids = new Set();
  for (const [index, item] of data.items.entries()) {
    const label = `${MATRIX_PATH} items[${index}]`;
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      errors.push(`${label} must be an object.`);
      continue;
    }
    validateRequiredFields(item, label, errors);
    if (item.id) {
      if (ids.has(item.id)) {
        errors.push(`${MATRIX_PATH} has duplicate id ${item.id}.`);
      }
      ids.add(item.id);
    }
    if (!ALLOWED_STATUSES.has(item.status)) {
      errors.push(`${label}.status must be covered, blocked, or deferred.`);
    }
    if (item.status === 'covered' && isBlank(item.coveredByTests)) {
      errors.push(`${label}.coveredByTests must not be empty when status is covered.`);
    }
    validateFiles({
      files: arrayValue(item.coveredByTests),
      label,
      field: 'coveredByTests',
      exists,
      errors,
      testFiles: true
    });
    validateFiles({
      files: arrayValue(item.sourceFiles),
      label,
      field: 'sourceFiles',
      exists,
      errors
    });
    validateGate({ item, label, scripts, exists, errors });
    validateBlockedOrDeferred(item, label, errors);
  }

  for (const id of REQUIRED_FALSE_GREEN_IDS) {
    if (!ids.has(id)) {
      errors.push(`${MATRIX_PATH} must include required id ${id}.`);
    }
  }

  return [...new Set(errors)];
}

if (isCli(import.meta.url)) {
  finish('check:false-green-matrix', validateFalseGreenMatrix());
}
