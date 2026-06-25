import { ensure, finish, isCli, readJson } from './common.js';

const REQUIRED_FIELDS = [
  'id',
  'title',
  'risk',
  'decision',
  'status',
  'guard',
  'futureAction'
];

const REQUIRED_DEBT_IDS = [
  'customer-contact-address-reinsert',
  'customer-put-full-update',
  'database-direction-mysql',
  'change-salesman-mode-residue',
  'reserved-fund-adjust-permission'
];

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function validateRefactorDebt({ file = 'ai/roadmap/refactor-debt.json', readJsonFile = readJson } = {}) {
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
      ensure(hasText(item[field]), `${file} items[${index}] missing ${field}.`, errors);
    }
    if (item.id) {
      ensure(!ids.has(item.id), `${file} duplicate debt id ${item.id}.`, errors);
      ids.add(item.id);
    }
  }

  for (const id of REQUIRED_DEBT_IDS) {
    ensure(ids.has(id), `${file} must include debt ${id}.`, errors);
  }

  return errors;
}

if (isCli(import.meta.url)) {
  finish('check:refactor-debt', validateRefactorDebt());
}
