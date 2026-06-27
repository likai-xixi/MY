import test from 'node:test';
import assert from 'node:assert/strict';
import {
  REQUIRED_FALSE_GREEN_IDS,
  validateFalseGreenMatrix
} from '../tools/false-green-matrix-checker.js';

const baseScripts = {
  check: 'npm run check:false-green-matrix',
  'check:false-green-matrix': 'node tools/false-green-matrix-checker.js',
  test: 'node --test tests/*.test.js'
};

const baseFiles = new Set([
  'ai/governance/false-green-regression-matrix.json',
  'tools/false-green-matrix-checker.js',
  'tests/false-green-matrix-checker.test.js',
  'package.json'
]);

function matrixWithRequired(overridesById = {}) {
  return {
    schemaVersion: 1,
    items: REQUIRED_FALSE_GREEN_IDS.map((id) => ({
      id,
      title: `Title for ${id}`,
      gate: 'check:false-green-matrix',
      risk: [`Risk for ${id}`],
      mustFailWhen: [`Failure condition for ${id}`],
      coveredByTests: ['tests/false-green-matrix-checker.test.js'],
      sourceFiles: [
        'ai/governance/false-green-regression-matrix.json',
        'tools/false-green-matrix-checker.js'
      ],
      status: 'covered',
      owner: 'governance',
      lastVerifiedByChange: 'CR-TEST',
      ...(overridesById[id] || {})
    }))
  };
}

function validate(matrix, options = {}) {
  const files = options.files || baseFiles;
  return validateFalseGreenMatrix({
    matrix,
    packageScripts: options.scripts || baseScripts,
    exists: (file) => files.has(file)
  });
}

test('current false-green matrix validates against real repository files', () => {
  assert.deepEqual(validateFalseGreenMatrix(), []);
});

test('matrix requires every anti-false-green risk id', () => {
  const matrix = matrixWithRequired();
  matrix.items = matrix.items.filter((item) => item.id !== 'ci-green-not-release-green');

  const errors = validate(matrix);

  assert.ok(errors.some((error) => error.includes('must include required id ci-green-not-release-green')));
});

test('matrix rejects duplicate ids', () => {
  const matrix = matrixWithRequired();
  matrix.items.push({ ...matrix.items[0] });

  const errors = validate(matrix);

  assert.ok(errors.some((error) => error.includes('duplicate id package-script-anti-theater')));
});

test('covered matrix entries require real test files', () => {
  const matrix = matrixWithRequired({
    'package-script-anti-theater': {
      coveredByTests: ['tests/missing.test.js']
    }
  });

  const errors = validate(matrix);

  assert.ok(errors.some((error) => error.includes('coveredByTests references missing file tests/missing.test.js')));
});

test('covered matrix entries require real source files', () => {
  const matrix = matrixWithRequired({
    'package-script-anti-theater': {
      sourceFiles: ['tools/missing-checker.js']
    }
  });

  const errors = validate(matrix);

  assert.ok(errors.some((error) => error.includes('sourceFiles references missing file tools/missing-checker.js')));
});

test('gate must be a package script or existing checker source', () => {
  const matrix = matrixWithRequired({
    'package-script-anti-theater': {
      gate: 'check:not-real'
    }
  });

  const errors = validate(matrix);

  assert.ok(errors.some((error) => error.includes('gate check:not-real must match a package.json script')));
});

test('blocked or deferred entries require concrete owner, trigger, phase, and reason', () => {
  const matrix = matrixWithRequired({
    'package-script-anti-theater': {
      status: 'deferred',
      coveredByTests: [],
      trigger: 'after release gate design is approved',
      expiresAtPhase: 'R-09B',
      reason: 'TBD'
    }
  });

  const errors = validate(matrix);

  assert.ok(errors.some((error) => error.includes('reason must not use vague placeholders')));
});

test('npm run check must include the false-green matrix checker', () => {
  const errors = validate(matrixWithRequired(), {
    scripts: {
      ...baseScripts,
      check: 'npm run check:graph'
    }
  });

  assert.ok(errors.some((error) => error.includes('scripts.check must include npm run check:false-green-matrix')));
});
