import {
  ensure,
  fileExists,
  finish,
  isCli,
  readJson
} from './common.js';

const LIFECYCLE_STATUSES = new Set([
  'draft',
  'published',
  'deprecated',
  'superseded',
  'archived'
]);

const BLOCKING_MODES = new Set([
  'off',
  'warning',
  'blocking',
  'runtime-bound',
  'release-bound'
]);

const REQUIRED_FIELDS = [
  'id',
  'name',
  'objectType',
  'ownerFeature',
  'lifecycleStatus',
  'version',
  'blockingMode',
  'sourceContracts',
  'ownedFiles',
  'tests',
  'immutableFields',
  'changePolicy',
  'deletePolicy',
  'snapshotPolicy',
  'supersedes',
  'supersededBy',
  'createdByChange',
  'updatedByChange',
  'notes'
];

const ARRAY_FIELDS = [
  'sourceContracts',
  'ownedFiles',
  'tests',
  'immutableFields',
  'supersedes',
  'supersededBy'
];

const FEATURE_OWNERSHIP_KEYS = [
  'backend',
  'frontend',
  'api',
  'ui',
  'database',
  'permissions',
  'menus',
  'components',
  'tests',
  'docs',
  'apiClients',
  'controllers',
  'services',
  'mappers',
  'domainObjects'
];

function isBlank(value) {
  if (value === undefined || value === null) {
    return true;
  }
  if (typeof value === 'string') {
    return value.trim().length === 0;
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  if (typeof value === 'object') {
    return Object.keys(value).length === 0;
  }
  return false;
}

function hasOwn(object, field) {
  return Object.prototype.hasOwnProperty.call(object || {}, field);
}

function readRegistry(readJsonFile, file, errors) {
  try {
    return readJsonFile(file);
  } catch (error) {
    errors.push(`${file} is missing or invalid JSON: ${error.message}`);
    return null;
  }
}

function activeFeaturesById(readJsonFile, errors) {
  const data = readRegistry(readJsonFile, 'ai/registry/features.json', errors);
  if (!data || !Array.isArray(data.features)) {
    errors.push('ai/registry/features.json features must be an array.');
    return new Map();
  }
  return new Map(data.features
    .filter((feature) => feature.status !== 'removed')
    .filter((feature) => feature.id)
    .map((feature) => [feature.id, feature]));
}

function requireArray(object, field, label, errors) {
  if (!Array.isArray(object[field])) {
    errors.push(`${label}.${field} must be an array.`);
    return [];
  }
  return object[field];
}

function validateExistingFiles({ object, field, exists, file, errors }) {
  for (const referencedFile of object[field] || []) {
    ensure(
      exists(referencedFile),
      `${file} object ${object.id || '<missing>'} ${field} references missing file ${referencedFile}.`,
      errors
    );
  }
}

function normalizePath(value = '') {
  return String(value || '').replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/+$/g, '');
}

function ownedPathMatches(file, ownedPath) {
  const normalizedFile = normalizePath(file);
  const normalizedOwnedPath = normalizePath(ownedPath);
  if (!normalizedFile || !normalizedOwnedPath) {
    return false;
  }
  return normalizedFile === normalizedOwnedPath || normalizedFile.startsWith(`${normalizedOwnedPath}/`);
}

function featureOwnershipValues(feature) {
  const ownership = feature?.ownership || {};
  return FEATURE_OWNERSHIP_KEYS.flatMap((key) => Array.isArray(ownership[key]) ? ownership[key] : []);
}

function ownershipExceptionMap(object, label, errors) {
  if (!hasOwn(object, 'ownershipExceptions')) {
    return new Map();
  }
  if (!Array.isArray(object.ownershipExceptions)) {
    errors.push(`${label}.ownershipExceptions must be an array when present.`);
    return new Map();
  }

  const exceptions = new Map();
  for (const [index, exception] of object.ownershipExceptions.entries()) {
    const exceptionLabel = `${label}.ownershipExceptions[${index}]`;
    if (!exception || typeof exception !== 'object' || Array.isArray(exception)) {
      errors.push(`${exceptionLabel} must be an object with file and reason.`);
      continue;
    }
    ensure(!isBlank(exception.file), `${exceptionLabel}.file must not be empty.`, errors);
    ensure(!isBlank(exception.reason), `${exceptionLabel}.reason must not be empty.`, errors);
    if (exception.file && exception.reason) {
      exceptions.set(normalizePath(exception.file), exception.reason);
    }
  }
  return exceptions;
}

function validateChangeRecordReference({ object, field, file, exists, errors }) {
  const id = object[field];
  if (!id) {
    return;
  }
  const changePath = `ai/changes/${id}`;
  ensure(exists(changePath), `${file} object ${object.id || '<missing>'} ${field} references missing change record ${changePath}.`, errors);
}

function validateOwnedFilesBelongToOwner({ object, ownerFeature, label, file, errors }) {
  const ownershipValues = featureOwnershipValues(ownerFeature);
  const exceptions = ownershipExceptionMap(object, label, errors);
  for (const ownedFile of object.ownedFiles || []) {
    const normalized = normalizePath(ownedFile);
    if (ownershipValues.some((ownedPath) => ownedPathMatches(normalized, ownedPath))) {
      continue;
    }
    if (exceptions.has(normalized)) {
      continue;
    }
    errors.push(`${file} object ${object.id || label} ownedFiles item ${ownedFile} is not in ownerFeature ${object.ownerFeature || '<missing>'} ownership and has no explicit ownershipExceptions entry.`);
  }
}

function validateRequiredFields(object, label, errors) {
  for (const field of REQUIRED_FIELDS) {
    ensure(hasOwn(object, field), `${label} missing required field ${field}.`, errors);
  }
  for (const field of ['id', 'name', 'objectType', 'ownerFeature', 'lifecycleStatus', 'blockingMode', 'createdByChange', 'updatedByChange', 'notes']) {
    ensure(!isBlank(object[field]), `${label}.${field} must not be empty.`, errors);
  }
}

function validateSupersedeLinks({ objectsById, object, file, errors }) {
  for (const targetId of object.supersedes || []) {
    const target = objectsById.get(targetId);
    ensure(Boolean(target), `${file} object ${object.id} supersedes unknown object ${targetId}.`, errors);
    if (target) {
      ensure((target.supersededBy || []).includes(object.id), `${file} supersede relationship must be bidirectional: ${object.id}.supersedes includes ${targetId}, but ${targetId}.supersededBy does not include ${object.id}.`, errors);
    }
  }

  for (const targetId of object.supersededBy || []) {
    const target = objectsById.get(targetId);
    ensure(Boolean(target), `${file} object ${object.id} supersededBy references unknown object ${targetId}.`, errors);
    if (target) {
      ensure((target.supersedes || []).includes(object.id), `${file} supersede relationship must be bidirectional: ${object.id}.supersededBy includes ${targetId}, but ${targetId}.supersedes does not include ${object.id}.`, errors);
    }
  }
}

export function validateRuleObjects({
  file = 'ai/registry/rule-objects.json',
  readJsonFile = readJson,
  exists = fileExists
} = {}) {
  const errors = [];
  const data = readRegistry(readJsonFile, file, errors);
  if (!data) {
    return errors;
  }

  ensure(data.schemaVersion === 1, `${file} schemaVersion must be 1.`, errors);
  ensure(Array.isArray(data.objects), `${file} objects must be an array.`, errors);
  if (!Array.isArray(data.objects)) {
    return errors;
  }

  const features = activeFeaturesById(readJsonFile, errors);
  const ids = new Set();
  const objectsById = new Map();

  for (const [index, object] of data.objects.entries()) {
    const label = `${file} objects[${index}]`;
    validateRequiredFields(object, label, errors);
    if (object.id) {
      ensure(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(object.id), `${label}.id must use lowercase ASCII kebab-case.`, errors);
      ensure(!ids.has(object.id), `${file} has duplicate object id ${object.id}.`, errors);
      ids.add(object.id);
      objectsById.set(object.id, object);
    }

    for (const field of ARRAY_FIELDS) {
      requireArray(object, field, label, errors);
    }
    for (const field of ['sourceContracts', 'ownedFiles', 'tests']) {
      ensure(Array.isArray(object[field]) && object[field].length > 0, `${label}.${field} must not be empty.`, errors);
    }

    const ownerFeature = features.get(object.ownerFeature);
    ensure(Boolean(ownerFeature), `${file} object ${object.id || label} ownerFeature ${object.ownerFeature || '<missing>'} does not exist in ai/registry/features.json.`, errors);
    ensure(LIFECYCLE_STATUSES.has(object.lifecycleStatus), `${file} object ${object.id || label} has invalid lifecycleStatus ${object.lifecycleStatus || '<missing>'}.`, errors);
    ensure(BLOCKING_MODES.has(object.blockingMode), `${file} object ${object.id || label} has invalid blockingMode ${object.blockingMode || '<missing>'}.`, errors);
    if (object.lifecycleStatus === 'published') {
      ensure(!isBlank(object.version), `${file} published object ${object.id || label} must include version.`, errors);
      ensure(!isBlank(object.changePolicy), `${file} published object ${object.id || label} must include changePolicy.`, errors);
    }

    validateExistingFiles({ object, field: 'sourceContracts', exists, file, errors });
    validateExistingFiles({ object, field: 'ownedFiles', exists, file, errors });
    validateExistingFiles({ object, field: 'tests', exists, file, errors });
    validateChangeRecordReference({ object, field: 'createdByChange', file, exists, errors });
    validateChangeRecordReference({ object, field: 'updatedByChange', file, exists, errors });
    if (ownerFeature) {
      validateOwnedFilesBelongToOwner({ object, ownerFeature, label, file, errors });
    }
  }

  for (const object of data.objects) {
    validateSupersedeLinks({ objectsById, object, file, errors });
  }

  return [...new Set(errors)];
}

if (isCli(import.meta.url)) {
  finish('check:rule-objects', validateRuleObjects());
}
