import { ensure, finish, isCli, readJson } from './common.js';

const REQUIRED_BACKLOG_IDS = [
  'multi-role-review',
  'current-context',
  'context-pack',
  'doc-size',
  'read-budget',
  'file-weight',
  'roadmap-check',
  'phase-gate-check',
  'refactor-debt-check',
  'code-index',
  'context-select',
  'feature-coverage',
  'module-dependencies',
  'snapshot-contract',
  'state-machine-contract',
  'fund-boundary-contract',
  'db-migrations-seeds-invariants',
  'api-integration-test',
  'ui-smoke-test',
  'github-actions'
];

const REQUIRED_FIELDS = [
  'id',
  'title',
  'category',
  'status',
  'requiredBefore',
  'reason',
  'guard',
  'evidence',
  'futureAction'
];

function nonEmpty(value) {
  return typeof value === 'string' ? value.trim().length > 0 : Boolean(value);
}

export function validateRoadmap({ file = 'ai/roadmap/enhancement-backlog.json', readJsonFile = readJson } = {}) {
  const errors = [];
  let data;
  try {
    data = readJsonFile(file);
  } catch (error) {
    return [`${file} could not be read as JSON: ${error.message}`];
  }

  ensure(data.schemaVersion === 1, `${file} schemaVersion must be 1.`, errors);
  ensure(Array.isArray(data.items), `${file} items must be an array.`, errors);
  if (!Array.isArray(data.items)) {
    return errors;
  }

  const ids = new Set();
  for (const [index, item] of data.items.entries()) {
    for (const field of REQUIRED_FIELDS) {
      ensure(nonEmpty(item[field]) || (field === 'requiredBefore' && Array.isArray(item[field])), `${file} items[${index}] missing ${field}.`, errors);
    }
    ensure(Array.isArray(item.requiredBefore), `${file} item ${item.id || index} requiredBefore must be an array.`, errors);
    if (item.id) {
      ensure(!ids.has(item.id), `${file} duplicate item id ${item.id}.`, errors);
      ids.add(item.id);
    }
  }

  for (const id of REQUIRED_BACKLOG_IDS) {
    ensure(ids.has(id), `${file} must include backlog item ${id}.`, errors);
  }

  return errors;
}

if (isCli(import.meta.url)) {
  finish('check:roadmap', validateRoadmap());
}
