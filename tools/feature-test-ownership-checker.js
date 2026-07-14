import path from 'node:path';
import {
  currentChangeId,
  dictionaryAliases,
  emptyResult,
  issue,
  isGeneratedPath,
  listFiles,
  normalizePath,
  parseRootArg,
  pathExists,
  printIssues,
  readJson,
  registeredFeatures
} from './governance-checker-utils.js';
import { collectChangedFiles } from './diff-checker.js';

const EXCEPTION_REGISTRY = 'ai/registry/test-ownership-exceptions.json';
const JAVA_MAIN_SOURCE_ROOT = 'src/main/java';
const JAVA_TEST_SOURCE_ROOT = 'src/test/java';

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

function compactPackageToken(value) {
  return normalize(value).replace(/[^a-z0-9]/g, '');
}

function javaSourceRootPosition(file, sourceRoot) {
  const normalizedFile = normalizePath(file).toLowerCase().replace(/^\.\/+/, '');
  if (normalizedFile === sourceRoot || normalizedFile.startsWith(`${sourceRoot}/`)) {
    return 0;
  }
  const marker = `/${sourceRoot}`;
  let markerIndex = normalizedFile.indexOf(marker);
  while (markerIndex !== -1) {
    const sourceRootIndex = markerIndex + 1;
    const boundaryIndex = sourceRootIndex + sourceRoot.length;
    if (boundaryIndex === normalizedFile.length || normalizedFile[boundaryIndex] === '/') {
      return sourceRootIndex;
    }
    markerIndex = normalizedFile.indexOf(marker, markerIndex + marker.length);
  }
  return -1;
}

function javaTestRelativePath(file) {
  const normalizedFile = normalizePath(file).toLowerCase().replace(/^\.\/+/, '');
  const sourceRootIndex = javaSourceRootPosition(normalizedFile, JAVA_TEST_SOURCE_ROOT);
  if (sourceRootIndex === -1) {
    return null;
  }
  return normalizedFile.slice(sourceRootIndex + JAVA_TEST_SOURCE_ROOT.length).replace(/^\/+/, '');
}

function javaTestPackageSegments(file) {
  const relativePath = javaTestRelativePath(file);
  if (relativePath === null) {
    return [];
  }
  return relativePath.split('/').slice(0, -1);
}

function javaTestRoot(backendRoot) {
  const normalizedRoot = normalizePath(backendRoot).toLowerCase().replace(/\/+$/, '');
  const mainRootIndex = javaSourceRootPosition(normalizedRoot, JAVA_MAIN_SOURCE_ROOT);
  if (mainRootIndex !== -1) {
    return `${normalizedRoot.slice(0, mainRootIndex)}${JAVA_TEST_SOURCE_ROOT}${normalizedRoot.slice(mainRootIndex + JAVA_MAIN_SOURCE_ROOT.length)}`;
  }
  return javaSourceRootPosition(normalizedRoot, JAVA_TEST_SOURCE_ROOT) !== -1 ? normalizedRoot : '';
}

function featureOwnsJavaTestPackage(file, feature, aliases) {
  if (!isJavaTest(file)) {
    return false;
  }
  const normalizedFile = normalizePath(file).toLowerCase();
  const registeredRoots = [
    ...(feature.backendModules || []),
    ...(feature.ownership?.backend || [])
  ].map(javaTestRoot).filter(Boolean);
  if (registeredRoots.some((root) => normalizedFile === root || normalizedFile.startsWith(`${root}/`))) {
    return true;
  }
  const compactTokens = [feature.id, ...(aliases || [])]
    .map(compactPackageToken)
    .filter(Boolean);
  return javaTestPackageSegments(file)
    .map(compactPackageToken)
    .some((segment) => compactTokens.includes(segment));
}

function matchedFeatureIds(file, features, aliasesByFeature) {
  return features
    .filter((feature) => {
      const aliases = aliasesByFeature.get(feature.id) || [];
      return aliases.some((alias) => aliasMatches(file, alias))
        || featureOwnsJavaTestPackage(file, feature, aliases);
    })
    .map((feature) => feature.id);
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

function isJavaTest(file) {
  const normalized = normalizePath(file).toLowerCase();
  return javaTestRelativePath(normalized) !== null && normalized.endsWith('.java');
}

function isNodeTest(file) {
  return file.startsWith('tests/') && file.endsWith('.test.js');
}

function isInsideTestSourceRoot(file) {
  const normalized = normalizePath(file);
  return normalized === 'tests'
    || normalized.startsWith('tests/')
    || javaTestRelativePath(normalized) !== null;
}

function shouldTraverseTestDirectory(file) {
  return isInsideTestSourceRoot(file) || !isGeneratedPath(file);
}

function exactTestPath(value) {
  const file = String(value || '');
  const normalized = normalizePath(file);
  if (
    !file
    || normalized !== file
    || /^[A-Za-z]:/.test(file)
    || file.split('/').includes('..')
    || /[*?\[\]{}!]/.test(file)
    || file.endsWith('/')
  ) {
    return '';
  }
  return isNodeTest(file) || isJavaTest(file) ? file : '';
}

function readExceptions(root, result, features, aliasesByFeature) {
  const file = EXCEPTION_REGISTRY;
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
  const schemaValid = data?.schemaVersion === 1;
  if (!schemaValid) {
    result.failures.push(issue({ file, code: 'invalid-schema-version', message: 'schemaVersion must be 1' }));
  }
  if (!Array.isArray(data?.exceptions)) {
    result.failures.push(issue({ file, code: 'invalid-schema', message: 'exceptions must be an array' }));
    return new Map();
  }
  const byFile = new Map();
  const seenFiles = new Set();
  const featureIds = new Set(features.map((feature) => feature.id));
  for (const [index, entry] of data.exceptions.entries()) {
    const location = `${file}`;
    const entryFile = entry?.file;
    let valid = schemaValid;
    const fail = ({ file: issueFile = entryFile || location, code, message }) => {
      valid = false;
      result.failures.push(issue({ file: issueFile, code, message }));
    };
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      fail({ file: location, code: 'invalid-exception-entry', message: `exceptions[${index}] must be an object` });
      continue;
    }
    if (typeof entryFile !== 'string' || !entryFile.trim()) {
      result.failures.push(issue({ file: location, code: 'exception-file-required', message: `exceptions[${index}] missing file` }));
      continue;
    }
    const exactFile = exactTestPath(entryFile);
    if (!exactFile) {
      fail({ code: 'exception-file-invalid', message: 'exception file must be one exact normalized tests/*.test.js or src/test/java/*.java path without glob or parent syntax' });
    }
    if (seenFiles.has(entryFile)) {
      fail({ code: 'duplicate-exception-file', message: 'test ownership exception file is duplicated' });
    }
    seenFiles.add(entryFile);
    if (!VALID_EXCEPTION_TYPES.has(entry.type)) {
      fail({ code: 'invalid-exception-type', message: `invalid exception type: ${entry.type || ''}` });
    }
    if (!String(entry.reason || '').trim()) {
      fail({ code: 'exception-reason-required', message: 'test ownership exception requires reason' });
    }
    const owner = String(entry.owner || '').trim();
    if (!owner) {
      fail({ code: 'exception-owner-required', message: 'test ownership exception requires owner' });
    } else if (owner !== 'governance' && !featureIds.has(owner)) {
      fail({ code: 'exception-owner-invalid', message: `test ownership exception owner must be governance or a registered feature id: ${owner}` });
    }
    if (exactFile && !pathExists(root, exactFile)) {
      fail({ code: 'exception-file-missing', message: 'exception file does not exist' });
    }

    let relatedFeatures = [];
    if (entry.relatedFeatures !== undefined) {
      if (!Array.isArray(entry.relatedFeatures)) {
        fail({ code: 'related-features-array-required', message: 'relatedFeatures must be an array of registered feature ids' });
      } else {
        relatedFeatures = entry.relatedFeatures.map((feature) => String(feature || '').trim());
        if (relatedFeatures.some((feature) => !feature)) {
          fail({ code: 'related-feature-empty', message: 'relatedFeatures must not contain empty feature ids' });
        }
        if (new Set(relatedFeatures).size !== relatedFeatures.length) {
          fail({ code: 'duplicate-related-feature', message: 'relatedFeatures must contain unique feature ids' });
        }
        for (const feature of relatedFeatures) {
          if (feature && !featureIds.has(feature)) {
            fail({ code: 'unknown-related-feature', message: `relatedFeatures references unknown or inactive feature: ${feature}` });
          }
        }
      }
    }
    const matchedOwners = exactFile ? matchedFeatureIds(entryFile, features, aliasesByFeature) : [];
    if (entry.type === 'cross-feature-contract-test') {
      if (relatedFeatures.length < 2) {
        fail({ code: 'cross-feature-related-features-required', message: 'cross-feature-contract-test requires at least two unique registered relatedFeatures' });
      }
      if (matchedOwners.length < 2) {
        fail({
          code: 'cross-feature-multiple-matched-owners-required',
          message: 'cross-feature-contract-test path must independently match at least two registered features'
        });
      }
      const missingOwners = matchedOwners.filter((feature) => !relatedFeatures.includes(feature));
      if (missingOwners.length > 0) {
        fail({
          code: 'cross-feature-matched-owner-required',
          message: `cross-feature-contract-test relatedFeatures must include every feature matched by the test path: ${missingOwners.join(', ')}`
        });
      }
      if (owner && owner !== 'governance' && !relatedFeatures.includes(owner)) {
        fail({
          code: 'cross-feature-owner-related',
          message: 'cross-feature-contract-test owner must be governance or one of relatedFeatures'
        });
      }
    }
    if (entry.type === 'governance-test' && !(entryFile.startsWith('tests/') && /governance/i.test(entryFile))) {
      fail({ code: 'governance-test-scope-invalid', message: 'governance-test exceptions are limited to governance test files under tests/' });
    }
    if (entry.type === 'governance-test' && owner !== 'governance') {
      fail({ code: 'governance-test-owner-invalid', message: 'governance-test exceptions must be owned by governance' });
    }
    if (entry.type === 'governance-test' && matchedOwners.length > 0) {
      fail({ code: 'governance-test-feature-local', message: 'business-feature-matched tests must use explicit feature ownership and cannot use governance-test' });
    }
    if (entry.type === 'shared-test' && matchedOwners.length > 0) {
      fail({ code: 'shared-test-feature-local', message: 'business-feature-matched tests must use explicit feature ownership and cannot use shared-test' });
    }
    if (valid) {
      byFile.set(entryFile, entry);
    }
  }
  return byFile;
}

function activeImpact(root) {
  const changeId = currentChangeId(root);
  if (!changeId) return null;
  try {
    return readJson(root, `ai/changes/${changeId}/impact.json`);
  } catch {
    return null;
  }
}

function actualFilesForRoot(root, actualChangedFiles) {
  if (Array.isArray(actualChangedFiles)) {
    return actualChangedFiles.map(normalizePath);
  }
  return path.resolve(root) === path.resolve(process.cwd()) ? collectChangedFiles() : [];
}

function validateExceptionRegistryChange({ root, actualChangedFiles, impact, result }) {
  const files = actualFilesForRoot(root, actualChangedFiles);
  if (files.includes(EXCEPTION_REGISTRY) && impact?.mode !== 'rule-change') {
    result.failures.push(issue({
      file: EXCEPTION_REGISTRY,
      code: 'exception-registry-rule-change-required',
      message: 'test ownership exception registry changes require an active rule-change impact'
    }));
  }
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

export function validateFeatureTestOwnership({
  root = process.cwd(),
  actualChangedFiles,
  impact = activeImpact(root)
} = {}) {
  const result = emptyResult();
  const features = registeredFeatures(root);
  const aliasesByFeature = featureAliases(root, features);
  validateExceptionRegistryChange({ root, actualChangedFiles, impact, result });
  const exceptions = readExceptions(root, result, features, aliasesByFeature);
  const testFiles = [...new Set([
    ...listFiles(root, 'tests', (file) => file.endsWith('.test.js'), {
      shouldTraverseDirectory: shouldTraverseTestDirectory
    }),
    ...listFiles(root, '.', isJavaTest, {
      shouldTraverseDirectory: shouldTraverseTestDirectory
    })
  ])].sort((left, right) => left.localeCompare(right));
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
    const matched = matchedFeatureIds(file, features, aliasesByFeature);
    if (matched.length === 0) {
      if (isJavaTest(file)) {
        result.failures.push(issue({
          file,
          code: 'unowned-java-test',
          message: 'Java tests must match one feature or use a documented test ownership exception'
        }));
      }
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
