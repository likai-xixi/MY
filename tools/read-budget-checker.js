import { ensure, finish, isCli, readJson } from './common.js';

const DEFAULT_MAX_FILES = 25;
const FORBIDDEN_BULK_PATHS = new Set([
  '.',
  './',
  'ai/changes',
  'ai/changes/',
  'ai/reviews',
  'ai/reviews/',
  'features',
  'features/'
]);

export function validateReadBudget({
  jsonFile = 'ai/context/current-context.json',
  maxFiles = DEFAULT_MAX_FILES,
  readJsonFile = readJson
} = {}) {
  const errors = [];
  let data;
  try {
    data = readJsonFile(jsonFile);
  } catch (error) {
    return [`${jsonFile} could not be read as JSON: ${error.message}`];
  }

  ensure(Array.isArray(data.mustReadFiles), `${jsonFile} mustReadFiles must be an array.`, errors);
  if (!Array.isArray(data.mustReadFiles)) {
    return errors;
  }

  ensure(data.mustReadFiles.length <= maxFiles || typeof data.mustReadOverflowReason === 'string', `${jsonFile} lists ${data.mustReadFiles.length} must-read files; max is ${maxFiles} unless mustReadOverflowReason is set.`, errors);

  const seen = new Set();
  for (const [index, entry] of data.mustReadFiles.entries()) {
    const file = String(entry.path || '').replace(/\\/g, '/').replace(/^\.\/+/, '');
    ensure(file.length > 0, `${jsonFile} mustReadFiles[${index}] missing path.`, errors);
    ensure(typeof entry.reason === 'string' && entry.reason.trim().length > 0, `${jsonFile} mustReadFiles[${index}] missing reason.`, errors);
    ensure(!FORBIDDEN_BULK_PATHS.has(file), `${jsonFile} mustReadFiles[${index}] uses forbidden bulk path ${file}.`, errors);
    ensure(!seen.has(file), `${jsonFile} duplicate must-read file ${file}.`, errors);
    seen.add(file);
  }

  return errors;
}

if (isCli(import.meta.url)) {
  finish('check:read-budget', validateReadBudget());
}
