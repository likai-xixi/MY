import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
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

function repositoryMatrix() {
  return JSON.parse(fs.readFileSync('ai/governance/false-green-regression-matrix.json', 'utf8'));
}

function repositoryScripts() {
  return JSON.parse(fs.readFileSync('package.json', 'utf8')).scripts;
}

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
    exists: (file) => files.has(file),
    coverageContracts: options.coverageContracts || {}
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

test('matrix cannot delete a required current governance regression contract', () => {
  const matrix = repositoryMatrix();
  matrix.items = matrix.items.filter((item) => item.id !== 'review-exact-binding');

  const errors = validateFalseGreenMatrix({ matrix });

  assert.ok(errors.some((error) => error.includes('must include required id review-exact-binding')));
});

test('covered matrix contracts reject unrelated owner change gate test source and checker bindings', () => {
  const matrix = repositoryMatrix();
  const item = matrix.items.find((entry) => entry.id === 'review-exact-binding');
  item.owner = 'nobody';
  item.lastVerifiedByChange = 'not-a-change';
  item.gate = 'tools/common.js';
  item.coveredByTests = ['tests/memory.test.js'];
  item.sourceFiles = ['tools/common.js'];

  const errors = validateFalseGreenMatrix({ matrix });

  for (const expected of [
    'owner must be governance',
    'lastVerifiedByChange must equal',
    'gate must equal check:review',
    'coveredByTests must include tests/governance-sales-order-handoff-gate.test.js',
    'sourceFiles must include tools/review-checker.js'
  ]) {
    assert.ok(errors.some((error) => error.includes(expected)), expected);
  }
});

test('covered matrix gate must execute its bound checker and tests must contain real test declarations', () => {
  const matrix = repositoryMatrix();
  const scripts = repositoryScripts();
  scripts['check:review'] = 'node tools/common.js';

  const gateErrors = validateFalseGreenMatrix({ matrix, packageScripts: scripts });
  assert.ok(gateErrors.some((error) => error.includes('gate check:review must execute tools/review-checker.js')));

  const testErrors = validateFalseGreenMatrix({
    matrix,
    packageScripts: repositoryScripts(),
    readTextFile: (file) => file.endsWith('governance-sales-order-handoff-gate.test.js')
      ? '# documentation only\n'
      : fs.readFileSync(file, 'utf8')
  });
  assert.ok(testErrors.some((error) => error.includes('must contain a real test declaration')));
});

test('covered matrix gate rejects pseudo execution shell control path concatenation and missing required arguments', () => {
  const attacks = [
    ['check:runtime', 'echo node tools/runtime-checker.js'],
    ['check:runtime', 'node -e "console.log(\'tools/runtime-checker.js\')"'],
    ['check:runtime', 'node tools/runtime-checker.js || exit 0'],
    ['check:runtime', 'node tools/runtime-checker.js-suffix'],
    ['check:review', 'node tools/review-checker.js']
  ];

  for (const [gate, command] of attacks) {
    const scripts = repositoryScripts();
    scripts[gate] = command;
    const errors = validateFalseGreenMatrix({ matrix: repositoryMatrix(), packageScripts: scripts });
    assert.ok(
      errors.some((error) => error.includes('dedicated fail-fast command')),
      `${gate} must reject ${command}`
    );
  }
});

test('covered matrix test evidence rejects comments strings and uncalled test references', () => {
  const fakeSources = [
    '// test( is only a comment\n',
    'const text = "test(";\n',
    'import test from "node:test"; const reference = test;\n',
    'const text = "import test from \'node:test\'; test(\'fake\')";\n',
    'import test from "node:test"; const pattern = /test\\(/; const reference = test;\n',
    'import test from "node:test"; const suite = { test() {} }; const reference = test;\n'
  ];

  for (const source of fakeSources) {
    const errors = validateFalseGreenMatrix({
      matrix: repositoryMatrix(),
      packageScripts: repositoryScripts(),
      readTextFile: (file) => file === 'tests/runtime-checker.test.js'
        ? source
        : fs.readFileSync(file, 'utf8')
    });
    assert.ok(
      errors.some((error) => error.includes('must contain a real node:test test() or it() call')),
      source
    );
  }
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
