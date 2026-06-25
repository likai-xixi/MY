import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { validateCiCoverageDeclaration } from '../tools/ci-coverage-declaration-checker.js';
import { validateConfigSafety } from '../tools/config-safety-checker.js';
import { validateCurrentDocState } from '../tools/current-doc-state-checker.js';
import { validateFeatureTestOwnership } from '../tools/feature-test-ownership-checker.js';
import { validateVerificationProvenance } from '../tools/verification-provenance-checker.js';

function withRoot(fn) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-governance-gates-'));
  try {
    return fn(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function write(root, file, content) {
  const absolute = path.join(root, file);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, content);
}

function writeJson(root, file, value) {
  write(root, file, `${JSON.stringify(value, null, 2)}\n`);
}

function writeCurrentContext(root, feature = 'customer') {
  writeJson(root, 'ai/context/current-context.json', { schemaVersion: 1, currentFeature: feature });
  write(root, 'ai/context/current-context.md', '# Current Context\n\n## Planned Verification Commands\n\n- npm run check\n');
}

function writeFeatureRegistry(root, featurePatch = {}) {
  writeJson(root, 'ai/registry/features.json', {
    schemaVersion: 1,
    features: [
      {
        id: 'customer',
        name: 'Customer',
        aliases: ['client'],
        status: 'active',
        tests: ['tests/customer-risk-gate.test.js'],
        ownership: { tests: ['tests/customer-risk-gate.test.js'] },
        ...featurePatch
      }
    ]
  });
  writeJson(root, 'ai/registry/feature-id-dictionary.json', {
    schemaVersion: 1,
    aliases: [{ id: 'customer', aliases: ['Customer'] }]
  });
}

function writeWorkflow(root, body = '- run: npm run check\n') {
  write(root, '.github/workflows/ci.yml', [
    'name: scaffold-ci',
    'on: [push]',
    'jobs:',
    '  check:',
    '    runs-on: ubuntu-latest',
    '    steps:',
    '      - uses: actions/checkout@v4',
    '      - uses: actions/setup-node@v4',
    '        with:',
    '          node-version: 20',
    ...body.split('\n').filter(Boolean).map((line) => `      ${line}`),
    ''
  ].join('\n'));
}

test('current-doc-state fails volatile current handover but ignores historical change records', () => withRoot((root) => {
  writeCurrentContext(root);
  write(root, 'memory/HANDOVER.md', '# Handover\n\n## Summary\n\nno commit or push has been made\n');
  write(root, 'memory/PROJECT_STATE.md', '# Project State\n\n## Status\n\nStable.\n');
  write(root, 'features/customer.md', '# Feature Brief\n\n## Identity\n\n- Current change: CR-TEST\n');
  write(root, 'README.md', '# Readme\n\n## Current project status\n\nStable.\n');
  write(root, 'ai/changes/CR-OLD/handover.md', '# Handover\n\nno commit or push has been made\n');

  const result = validateCurrentDocState({ root });
  assert.equal(result.failures.length, 1);
  assert.equal(result.failures[0].file, 'memory/HANDOVER.md');
}));

test('current-doc-state ignore-line only ignores the annotated line', () => withRoot((root) => {
  writeCurrentContext(root);
  write(root, 'memory/HANDOVER.md', [
    '# Handover',
    '',
    '## Summary',
    '',
    'ready to push <!-- current-doc-state-ignore-line: example in quoted source -->',
    'ready to push',
    ''
  ].join('\n'));

  const result = validateCurrentDocState({ root });
  assert.equal(result.failures.length, 1);
  assert.equal(result.failures[0].line, 6);
}));

test('feature-test-ownership requires customer test registration in both registry fields', () => withRoot((root) => {
  writeFeatureRegistry(root);
  write(root, 'tests/customer-risk-gate.test.js', 'import test from "node:test";\n');

  assert.deepEqual(validateFeatureTestOwnership({ root }).failures, []);

  writeFeatureRegistry(root, { ownership: { tests: [] } });
  const result = validateFeatureTestOwnership({ root });
  assert.ok(result.failures.some((failure) => failure.code === 'missing-ownership-tests-entry'));
}));

test('feature-test-ownership detects missing registered tests and accepts governance exceptions', () => withRoot((root) => {
  writeFeatureRegistry(root);
  write(root, 'tests/customer-risk-gate.test.js', 'import test from "node:test";\n');
  write(root, 'tests/governance-gates.test.js', 'import test from "node:test";\n');
  writeJson(root, 'ai/registry/test-ownership-exceptions.json', {
    schemaVersion: 1,
    exceptions: [
      {
        file: 'tests/governance-gates.test.js',
        type: 'governance-test',
        reason: 'validates P0 governance gates',
        owner: 'governance'
      }
    ]
  });

  assert.deepEqual(validateFeatureTestOwnership({ root }).failures, []);

  writeFeatureRegistry(root, { tests: ['tests/customer-risk-gate.test.js', 'tests/missing-customer.test.js'] });
  const missing = validateFeatureTestOwnership({ root });
  assert.ok(missing.failures.some((failure) => failure.code === 'registered-test-missing'));
}));

test('feature-test-ownership rejects exceptions without reason', () => withRoot((root) => {
  writeFeatureRegistry(root);
  write(root, 'tests/customer-risk-gate.test.js', 'import test from "node:test";\n');
  write(root, 'tests/governance-gates.test.js', 'import test from "node:test";\n');
  writeJson(root, 'ai/registry/test-ownership-exceptions.json', {
    schemaVersion: 1,
    exceptions: [{ file: 'tests/governance-gates.test.js', type: 'governance-test', owner: 'governance' }]
  });

  const result = validateFeatureTestOwnership({ root });
  assert.ok(result.failures.some((failure) => failure.code === 'exception-reason-required'));
}));

test('config-safety fails production defaults and warns for druid development defaults', () => withRoot((root) => {
  write(root, 'ruoyi-admin/src/main/resources/application-prod.yml', [
    'token:',
    '  secret: abcdefghijklmnopqrstuvwxyz',
    'spring:',
    '  datasource:',
    '    username: root',
    '    password: password',
    ''
  ].join('\n'));
  write(root, 'ruoyi-admin/src/main/resources/application-druid.yml', [
    'spring:',
    '  datasource:',
    '    druid:',
    '      master:',
    '        username: root',
    '        password: password',
    '      statViewServlet:',
    '        login-password: 123456',
    ''
  ].join('\n'));

  const result = validateConfigSafety({ root });
  assert.ok(result.failures.some((failure) => failure.code === 'token-secret-default'));
  assert.ok(result.failures.some((failure) => failure.code === 'db-root-user'));
  assert.ok(result.failures.some((failure) => failure.code === 'db-default-password'));
  assert.ok(result.warnings.some((warning) => warning.code === 'druid-default-password'));
}));

function writeVerificationRoot(root, verificationLine) {
  writeJson(root, 'ai/changes/CURRENT_CHANGE.json', { schemaVersion: 1, current: 'CR-TEST' });
  write(root, 'ai/changes/CR-TEST/verification.md', `# Verification\n\n${verificationLine}\n`);
  writeWorkflow(root);
}

test('verification-provenance requires provenance for Maven result claims', () => withRoot((root) => {
  writeVerificationRoot(root, '- mvn compile passed');
  const result = validateVerificationProvenance({ root });
  assert.ok(result.failures.some((failure) => failure.code === 'missing-provenance'));
}));

test('verification-provenance accepts local Maven provenance and rejects uncovered CI Maven claims', () => withRoot((root) => {
  writeVerificationRoot(root, '- [local] mvn compile passed');
  assert.deepEqual(validateVerificationProvenance({ root }).failures, []);

  writeVerificationRoot(root, '- [ci] Maven compile passed');
  const ciResult = validateVerificationProvenance({ root });
  assert.ok(ciResult.failures.some((failure) => failure.code === 'ci-maven-not-covered'));
}));

test('ci-coverage-declaration requires workflow npm run check', () => withRoot((root) => {
  writeWorkflow(root, '- run: npm test\n');
  const result = validateCiCoverageDeclaration({ root });
  assert.ok(result.failures.some((failure) => failure.code === 'node-governance-ci-missing'));
}));

test('ci-coverage-declaration warns when Maven CI is absent unless docs claim it', () => withRoot((root) => {
  writeWorkflow(root);
  let result = validateCiCoverageDeclaration({ root });
  assert.deepEqual(result.failures, []);
  assert.ok(result.warnings.some((warning) => warning.code === 'maven-ci-not-present'));

  write(root, 'memory/HANDOVER.md', '# Handover\n\n## Verification\n\n- [ci] Maven compile passed\n');
  result = validateCiCoverageDeclaration({ root });
  assert.ok(result.failures.some((failure) => failure.code === 'declared-ci-maven-missing'));
}));
