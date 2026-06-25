import {
  dictionaryAliases,
  emptyResult,
  issue,
  listFiles,
  parseRootArg,
  pathExists,
  printIssues,
  readJson,
  registeredFeatures
} from './governance-checker-utils.js';

const VALID_EXCEPTION_TYPES = new Set([
  'governance-test',
  'shared-test',
  'cross-feature-contract-test'
]);

function normalize(value) {
  return String(value || '').toLowerCase().replace(/\\/g, '/');
}

function asciiBoundaryMatch(haystack, token) {
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i').test(haystack);
}

function aliasMatches(file, alias) {
  const normalizedFile = normalize(file);
  const normalizedAlias = normalize(alias).trim();
  if (!normalizedAlias) {
    return false;
  }
  if (/^[a-z0-9-]+$/i.test(normalizedAlias)) {
    return asciiBoundaryMatch(normalizedFile, normalizedAlias);
  }
  return normalizedFile.includes(normalizedAlias);
}

function featureAliases(root, features) {
  const dictionary = dictionaryAliases(root);
  return new Map(features.map((feature) => [
    feature.id,
    [
      feature.id,
      ...(feature.aliases || []),
      ...(dictionary.get(feature.id) || [])
    ]
  ]));
}

function readExceptions(root, result) {
  const file = 'ai/registry/test-ownership-exceptions.json';
  if (!pathExists(root, file)) {
    return new Map();
  }
  let data;
  try {
    data = readJson(root, file);
  } catch (error) {
    result.failures.push(issue({ file, code: 'invalid-json', message: error.message }));
    return new Map();
  }
  if (!Array.isArray(data.exceptions)) {
    result.failures.push(issue({ file, code: 'invalid-schema', message: 'exceptions must be an array' }));
    return new Map();
  }
  const byFile = new Map();
  for (const [index, entry] of data.exceptions.entries()) {
    const location = `${file}`;
    const entryFile = entry?.file;
    if (!entryFile) {
      result.failures.push(issue({ file: location, code: 'exception-file-required', message: `exceptions[${index}] missing file` }));
      continue;
    }
    if (!VALID_EXCEPTION_TYPES.has(entry.type)) {
      result.failures.push(issue({ file: entryFile, code: 'invalid-exception-type', message: `invalid exception type: ${entry.type || ''}` }));
    }
    if (!String(entry.reason || '').trim()) {
      result.failures.push(issue({ file: entryFile, code: 'exception-reason-required', message: 'test ownership exception requires reason' }));
    }
    if (!String(entry.owner || '').trim()) {
      result.failures.push(issue({ file: entryFile, code: 'exception-owner-required', message: 'test ownership exception requires owner' }));
    }
    if (!pathExists(root, entryFile)) {
      result.failures.push(issue({ file: entryFile, code: 'exception-file-missing', message: 'exception file does not exist' }));
    }
    byFile.set(entryFile.replace(/\\/g, '/'), entry);
  }
  return byFile;
}

function registeredTestMap(features, key) {
  const owners = new Map();
  for (const feature of features) {
    const values = key === 'tests'
      ? feature.tests
      : feature.ownership?.tests;
    for (const file of values || []) {
      const normalized = file.replace(/\\/g, '/');
      const list = owners.get(normalized) || [];
      list.push(feature.id);
      owners.set(normalized, list);
    }
  }
  return owners;
}

export function validateFeatureTestOwnership({ root = process.cwd() } = {}) {
  const result = emptyResult();
  const features = registeredFeatures(root);
  const aliasesByFeature = featureAliases(root, features);
  const exceptions = readExceptions(root, result);
  const testFiles = listFiles(root, 'tests', (file) => file.endsWith('.test.js'));
  const existingTests = new Set(testFiles);
  const featureTests = registeredTestMap(features, 'tests');
  const ownershipTests = registeredTestMap(features, 'ownership.tests');

  for (const feature of features) {
    if (!Array.isArray(feature.tests)) {
      result.failures.push(issue({ file: 'ai/registry/features.json', code: 'tests-array-required', message: `${feature.id}.tests must be an array` }));
    }
    if (!feature.ownership || !Array.isArray(feature.ownership.tests)) {
      result.failures.push(issue({ file: 'ai/registry/features.json', code: 'ownership-tests-array-required', message: `${feature.id}.ownership.tests must be an array` }));
    }
  }

  for (const file of testFiles) {
    if (exceptions.has(file)) {
      continue;
    }
    if (file.includes('/governance') || file.startsWith('tests/governance')) {
      result.failures.push(issue({
        file,
        code: 'governance-exception-required',
        message: 'governance tests must be registered in ai/registry/test-ownership-exceptions.json'
      }));
      continue;
    }
    const matched = features
      .filter((feature) => (aliasesByFeature.get(feature.id) || []).some((alias) => aliasMatches(file, alias)))
      .map((feature) => feature.id);
    if (matched.length === 0) {
      continue;
    }
    if (matched.length > 1) {
      result.failures.push(issue({ file, code: 'ambiguous-test-owner', message: `test matches multiple features: ${matched.join(', ')}` }));
      continue;
    }
    const owner = matched[0];
    if (!featureTests.get(file)?.includes(owner)) {
      result.failures.push(issue({ file, code: 'missing-feature-tests-entry', message: `${file} must be listed in features.${owner}.tests` }));
    }
    if (!ownershipTests.get(file)?.includes(owner)) {
      result.failures.push(issue({ file, code: 'missing-ownership-tests-entry', message: `${file} must be listed in features.${owner}.ownership.tests` }));
    }
  }

  for (const [file, owners] of featureTests.entries()) {
    if (!existingTests.has(file)) {
      result.failures.push(issue({ file, code: 'registered-test-missing', message: 'registry tests entry points to a missing file' }));
    }
    if (owners.length > 1) {
      result.failures.push(issue({ file, code: 'duplicate-feature-test-owner', message: `test is registered in multiple features: ${owners.join(', ')}` }));
    }
  }
  for (const [file, owners] of ownershipTests.entries()) {
    if (!existingTests.has(file)) {
      result.failures.push(issue({ file, code: 'registered-ownership-test-missing', message: 'ownership.tests entry points to a missing file' }));
    }
    if (owners.length > 1) {
      result.failures.push(issue({ file, code: 'duplicate-ownership-test-owner', message: `ownership test is registered in multiple features: ${owners.join(', ')}` }));
    }
  }

  for (const feature of features) {
    const tests = new Set(feature.tests || []);
    const ownership = new Set(feature.ownership?.tests || []);
    for (const file of tests) {
      if (!ownership.has(file)) {
        result.failures.push(issue({ file, code: 'ownership-tests-mismatch', message: `${file} is in ${feature.id}.tests but not ownership.tests` }));
      }
    }
    for (const file of ownership) {
      if (!tests.has(file)) {
        result.failures.push(issue({ file, code: 'feature-tests-mismatch', message: `${file} is in ${feature.id}.ownership.tests but not tests` }));
      }
    }
  }

  return result;
}

if (process.argv[1] && process.argv[1].endsWith('feature-test-ownership-checker.js')) {
  printIssues('check:feature-test-ownership', validateFeatureTestOwnership({ root: parseRootArg() }));
}
