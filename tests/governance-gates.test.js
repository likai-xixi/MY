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
    '      - uses: actions/checkout@1111111111111111111111111111111111111111',
    '      - uses: actions/setup-node@2222222222222222222222222222222222222222',
    '        with:',
    '          node-version: 20',
    ...body.split('\n').filter(Boolean).map((line) => `      ${line}`),
    ''
  ].join('\n'));
}

function completeCiCommands() {
  return [
    '- run: npm ci',
    '- run: npm run check',
    '- run: npm test',
    '- run: mvn -pl ruoyi-business -am -Pintegration-test verify',
    '- run: npm --prefix ruoyi-ui ci',
    '- run: npm --prefix ruoyi-ui test',
    '- run: npm --prefix ruoyi-ui audit --audit-level=moderate --include=dev',
    '- run: npm --prefix ruoyi-ui run build:prod'
  ].join('\n');
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

test('feature-test-ownership rejects invalid schema glob paths and duplicate exceptions', () => withRoot((root) => {
  writeFeatureRegistry(root, { tests: [], ownership: { tests: [] } });
  write(root, 'tests/governance-gates.test.js', 'import test from "node:test";\n');
  const validEntry = {
    file: 'tests/governance-gates.test.js',
    type: 'governance-test',
    reason: 'Validates governance.',
    owner: 'governance'
  };
  writeJson(root, 'ai/registry/test-ownership-exceptions.json', {
    schemaVersion: 2,
    exceptions: [
      {
        ...validEntry,
        file: 'tests/**/*.test.js'
      },
      validEntry,
      { ...validEntry }
    ]
  });

  const result = validateFeatureTestOwnership({ root });
  assert.ok(result.failures.some((failure) => failure.code === 'invalid-schema-version'));
  assert.ok(result.failures.some((failure) => failure.code === 'exception-file-invalid'));
  assert.ok(result.failures.some((failure) => failure.code === 'duplicate-exception-file'));
}));

test('feature-test-ownership requires rule-change for actual exception registry edits', () => withRoot((root) => {
  writeFeatureRegistry(root);
  write(root, 'tests/customer-risk-gate.test.js', 'import test from "node:test";\n');
  writeJson(root, 'ai/registry/test-ownership-exceptions.json', { schemaVersion: 1, exceptions: [] });
  const actualChangedFiles = ['ai/registry/test-ownership-exceptions.json'];

  const business = validateFeatureTestOwnership({
    root,
    actualChangedFiles,
    impact: { mode: 'update' }
  });
  assert.ok(business.failures.some((failure) => failure.code === 'exception-registry-rule-change-required'));

  const ruleChange = validateFeatureTestOwnership({
    root,
    actualChangedFiles,
    impact: { mode: 'rule-change' }
  });
  assert.equal(ruleChange.failures.some((failure) => failure.code === 'exception-registry-rule-change-required'), false);
}));

test('feature-local Java tests cannot bypass ownership as shared tests', () => withRoot((root) => {
  const file = 'ruoyi-business/src/test/java/com/ruoyi/business/customer/service/UnregisteredCustomerTest.java';
  writeFeatureRegistry(root, { tests: [], ownership: { tests: [] } });
  write(root, file, 'class UnregisteredCustomerTest {}\n');
  writeJson(root, 'ai/registry/test-ownership-exceptions.json', {
    schemaVersion: 1,
    exceptions: [{
      file,
      type: 'shared-test',
      reason: 'Attempts to bypass customer ownership.',
      owner: 'platform'
    }]
  });

  const result = validateFeatureTestOwnership({ root });
  assert.ok(result.failures.some((failure) => failure.code === 'shared-test-feature-local'));
  assert.ok(result.failures.some((failure) => failure.code === 'missing-feature-tests-entry'));
  assert.ok(result.failures.some((failure) => failure.code === 'missing-ownership-tests-entry'));
}));

test('feature-local Java ownership follows registered backend roots and compact package names', () => withRoot((root) => {
  const compactFile = 'ruoyi-business/src/test/java/com/ruoyi/business/salesorder/service/SalesOrderServiceTest.java';
  const rootedFile = 'ruoyi-business/src/test/java/com/ruoyi/business/orderflow/service/OrderFlowServiceTest.java';
  writeJson(root, 'ai/registry/features.json', {
    schemaVersion: 1,
    features: [{
      id: 'sales-order',
      name: 'Sales Order',
      aliases: [],
      status: 'active',
      backendModules: ['ruoyi-business/src/main/java/com/ruoyi/business/orderflow'],
      tests: [],
      ownership: {
        backend: ['ruoyi-business/src/main/java/com/ruoyi/business/orderflow'],
        tests: []
      }
    }]
  });
  writeJson(root, 'ai/registry/feature-id-dictionary.json', {
    schemaVersion: 1,
    aliases: [{ id: 'sales-order', aliases: ['Sales Order'] }]
  });
  write(root, compactFile, 'class SalesOrderServiceTest {}\n');
  write(root, rootedFile, 'class OrderFlowServiceTest {}\n');
  writeJson(root, 'ai/registry/test-ownership-exceptions.json', {
    schemaVersion: 1,
    exceptions: [compactFile, rootedFile].map((file) => ({
      file,
      type: 'shared-test',
      reason: 'Attempts to bypass feature-local ownership.',
      owner: 'platform'
    }))
  });

  const result = validateFeatureTestOwnership({ root });
  for (const file of [compactFile, rootedFile]) {
    assert.ok(result.failures.some((failure) => failure.file === file && failure.code === 'shared-test-feature-local'), file);
    assert.ok(result.failures.some((failure) => failure.file === file && failure.code === 'missing-feature-tests-entry'), file);
    assert.ok(result.failures.some((failure) => failure.file === file && failure.code === 'missing-ownership-tests-entry'), file);
  }
}));

test('cross-feature ownership exceptions require two real structured feature ids', () => withRoot((root) => {
  const file = 'tests/customer-platform-contract.test.js';
  writeFeatureRegistry(root, { tests: [], ownership: { tests: [] } });
  write(root, file, 'import test from "node:test";\n');
  const writeException = (relatedFeatures) => writeJson(root, 'ai/registry/test-ownership-exceptions.json', {
    schemaVersion: 1,
    exceptions: [{
      file,
      type: 'cross-feature-contract-test',
      reason: 'Validates an explicit cross-feature contract.',
      owner: 'governance',
      relatedFeatures
    }]
  });

  writeException(['customer']);
  let result = validateFeatureTestOwnership({ root });
  assert.ok(result.failures.some((failure) => failure.code === 'cross-feature-related-features-required'));

  writeException(['customer', 'missing-feature']);
  result = validateFeatureTestOwnership({ root });
  assert.ok(result.failures.some((failure) => failure.code === 'unknown-related-feature'));

  writeJson(root, 'ai/registry/features.json', {
    schemaVersion: 1,
    features: [
      { id: 'customer', name: 'Customer', aliases: [], status: 'active', tests: [], ownership: { tests: [] } },
      { id: 'platform', name: 'Platform', aliases: [], status: 'active', tests: [], ownership: { tests: [] } }
    ]
  });
  writeJson(root, 'ai/registry/feature-id-dictionary.json', { schemaVersion: 1, aliases: [] });
  writeException(['customer', 'platform']);
  assert.deepEqual(validateFeatureTestOwnership({ root }).failures, []);
}));

test('cross-feature Java exceptions must include every matched owner and cannot disguise a single-feature test', () => withRoot((root) => {
  const file = 'ruoyi-business/src/test/java/com/ruoyi/business/customer/service/UnregisteredCustomerTest.java';
  writeJson(root, 'ai/registry/features.json', {
    schemaVersion: 1,
    features: [
      { id: 'customer', name: 'Customer', aliases: [], status: 'active', tests: [], ownership: { tests: [] } },
      { id: 'platform', name: 'Platform', aliases: [], status: 'active', tests: [], ownership: { tests: [] } },
      { id: 'masterdata', name: 'Masterdata', aliases: [], status: 'active', tests: [], ownership: { tests: [] } }
    ]
  });
  writeJson(root, 'ai/registry/feature-id-dictionary.json', { schemaVersion: 1, aliases: [] });
  write(root, file, 'class UnregisteredCustomerTest {}\n');
  const writeException = (relatedFeatures) => writeJson(root, 'ai/registry/test-ownership-exceptions.json', {
    schemaVersion: 1,
    exceptions: [{
      file,
      type: 'cross-feature-contract-test',
      reason: 'Validates an explicit cross-feature contract rooted in customer code.',
      owner: 'governance',
      relatedFeatures
    }]
  });

  writeException(['platform', 'masterdata']);
  let result = validateFeatureTestOwnership({ root });
  assert.ok(result.failures.some((failure) => failure.code === 'cross-feature-matched-owner-required'));

  writeException(['customer', 'platform']);
  result = validateFeatureTestOwnership({ root });
  assert.ok(result.failures.some((failure) => failure.code === 'cross-feature-multiple-matched-owners-required'));
}));

test('ownership exceptions reject business-matched governance/shared tests and fake owners', () => withRoot((root) => {
  const governanceFile = 'tests/customer-governance.test.js';
  const sharedFile = 'tests/customer-service.test.js';
  const fakeOwnerFile = 'tests/common-runtime.test.js';
  writeJson(root, 'ai/registry/features.json', {
    schemaVersion: 1,
    features: [
      { id: 'customer', name: 'Customer', aliases: [], status: 'active', tests: [], ownership: { tests: [] } },
      { id: 'platform', name: 'Platform', aliases: [], status: 'active', tests: [], ownership: { tests: [] } }
    ]
  });
  writeJson(root, 'ai/registry/feature-id-dictionary.json', { schemaVersion: 1, aliases: [] });
  for (const file of [governanceFile, sharedFile, fakeOwnerFile]) {
    write(root, file, 'import test from "node:test";\n');
  }
  writeJson(root, 'ai/registry/test-ownership-exceptions.json', {
    schemaVersion: 1,
    exceptions: [
      {
        file: governanceFile,
        type: 'governance-test',
        reason: 'Attempts to disguise a customer test as governance.',
        owner: 'governance',
        relatedFeatures: ['customer']
      },
      {
        file: sharedFile,
        type: 'shared-test',
        reason: 'Attempts to disguise a customer test as shared.',
        owner: 'platform'
      },
      {
        file: fakeOwnerFile,
        type: 'shared-test',
        reason: 'Attempts to use a non-existent owner.',
        owner: 'not-a-real-owner'
      }
    ]
  });

  const result = validateFeatureTestOwnership({ root });
  assert.ok(result.failures.some((failure) => failure.file === governanceFile && failure.code === 'governance-test-feature-local'));
  assert.ok(result.failures.some((failure) => failure.file === sharedFile && failure.code === 'shared-test-feature-local'));
  assert.ok(result.failures.some((failure) => failure.file === fakeOwnerFile && failure.code === 'exception-owner-invalid'));
}));

test('common idempotency Java test remains a valid shared-test exception', () => withRoot((root) => {
  const file = 'ruoyi-business/src/test/java/com/ruoyi/business/common/idempotency/IdempotencyServiceTest.java';
  writeJson(root, 'ai/registry/features.json', {
    schemaVersion: 1,
    features: [
      { id: 'customer', name: 'Customer', aliases: [], status: 'active', tests: [], ownership: { tests: [] } },
      { id: 'platform', name: 'Platform', aliases: [], status: 'active', tests: [], ownership: { tests: [] } }
    ]
  });
  writeJson(root, 'ai/registry/feature-id-dictionary.json', { schemaVersion: 1, aliases: [] });
  write(root, file, 'class IdempotencyServiceTest {}\n');
  writeJson(root, 'ai/registry/test-ownership-exceptions.json', {
    schemaVersion: 1,
    exceptions: [{
      file,
      type: 'shared-test',
      reason: 'Validates the cross-feature idempotency utility rather than one business feature.',
      owner: 'platform'
    }]
  });

  assert.deepEqual(validateFeatureTestOwnership({ root }).failures, []);
}));

test('test ownership discovery keeps generated-looking directories inside Node and Maven test roots', () => withRoot((root) => {
  const generatedLookingSegments = ['target', 'build', 'tmp', 'dist', 'node_modules'];
  const javaClassName = (segment) => `Customer${segment
    .split('_')
    .map((part) => `${part[0].toUpperCase()}${part.slice(1)}`)
    .join('')}Test`;
  const javaTests = generatedLookingSegments.map((segment) => ({
    file: `ruoyi-business/src/test/java/com/ruoyi/business/customer/${segment}/${javaClassName(segment)}.java`,
    source: `package com.ruoyi.business.customer.${segment}; public class ${javaClassName(segment)} {}\n`
  })).concat(
    generatedLookingSegments.map((segment) => ({
      file: `src/test/java/customer/${segment}/Root${javaClassName(segment)}.java`,
      source: `package customer.${segment}; public class Root${javaClassName(segment)} {}\n`
    })),
    [{
      file: 'src/test/java/customer/CustomerRootTest.java',
      source: 'package customer; public class CustomerRootTest {}\n'
    }]
  );
  const nodeTests = generatedLookingSegments.map((segment) => (
    `tests/${segment}/customer-${segment}.test.js`
  ));

  writeFeatureRegistry(root, { tests: [], ownership: { tests: [] } });
  writeJson(root, 'ai/registry/test-ownership-exceptions.json', { schemaVersion: 1, exceptions: [] });
  for (const { file, source } of javaTests) {
    write(root, file, source);
  }
  for (const file of nodeTests) {
    write(root, file, 'import test from "node:test"; test("customer", () => {});\n');
  }

  const result = validateFeatureTestOwnership({
    root,
    actualChangedFiles: [...javaTests.map(({ file }) => file), ...nodeTests],
    impact: { mode: 'update' }
  });

  for (const file of [...javaTests.map(({ file }) => file), ...nodeTests]) {
    assert.ok(
      result.failures.some((failure) => failure.file === file && failure.code === 'missing-feature-tests-entry'),
      `${file} must be discovered and require feature.tests ownership`
    );
    assert.ok(
      result.failures.some((failure) => failure.file === file && failure.code === 'missing-ownership-tests-entry'),
      `${file} must be discovered and require ownership.tests ownership`
    );
  }
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

test('verification-provenance requires Maven unit and integration CI before accepting a passed claim', () => withRoot((root) => {
  writeVerificationRoot(root, '- [ci] Maven unit and integration tests passed');
  writeWorkflow(root, [
    '- run: npm run check',
    '- run: mvn -pl ruoyi-admin -am -DskipTests compile'
  ].join('\n'));
  let result = validateVerificationProvenance({ root });
  assert.ok(result.failures.some((failure) => failure.code === 'ci-maven-not-covered'));

  writeWorkflow(root, completeCiCommands());
  result = validateVerificationProvenance({ root });
  assert.deepEqual(result.failures, []);
}));

test('verification-provenance rejects passed results tagged as CI planned', () => withRoot((root) => {
  writeVerificationRoot(root, '- [ci-planned] Maven unit and integration tests passed');
  writeWorkflow(root, completeCiCommands());

  const result = validateVerificationProvenance({ root });
  assert.ok(result.failures.some((failure) => failure.code === 'planned-evidence-claims-result'));
}));

test('verification-provenance rejects success assertions tagged as not-run or inconclusive', () => withRoot((root) => {
  for (const verificationLine of [
    '- [not-run] `npm test` passed with 42 tests.',
    '- [inconclusive] `npm run check` verified successfully.',
    '- [not-run] `npm test`\n  passed with 42 tests.',
    '- [not-run] `npm test` was not run but passed.'
  ]) {
    writeVerificationRoot(root, verificationLine);
    const result = validateVerificationProvenance({ root });
    assert.ok(
      result.failures.some((failure) => failure.code === 'non-success-evidence-claims-success'),
      verificationLine
    );
  }
}));

test('verification-provenance allows an explicitly negated success claim', () => withRoot((root) => {
  writeVerificationRoot(root, '- [inconclusive] Do not claim `npm run check` passed.');
  assert.deepEqual(validateVerificationProvenance({ root }).failures, []);
}));

test('ci-coverage-declaration requires workflow npm run check', () => withRoot((root) => {
  writeWorkflow(root, '- run: npm test\n');
  const result = validateCiCoverageDeclaration({ root });
  assert.ok(result.failures.some((failure) => failure.code === 'node-governance-ci-missing'));
}));

test('ci-coverage-declaration requires reproducible Node, Maven, and frontend verification', () => withRoot((root) => {
  writeWorkflow(root);
  let result = validateCiCoverageDeclaration({ root });
  for (const code of [
    'root-npm-ci-missing',
    'root-npm-test-missing',
    'maven-unit-ci-missing',
    'maven-integration-ci-missing',
    'frontend-npm-ci-missing',
    'frontend-npm-test-missing',
    'frontend-audit-ci-missing',
    'frontend-build-ci-missing'
  ]) {
    assert.ok(result.failures.some((failure) => failure.code === code), code);
  }

  write(root, 'memory/HANDOVER.md', '# Handover\n\n## Verification\n\n- [ci] Maven compile passed\n');
  result = validateCiCoverageDeclaration({ root });
  assert.ok(result.failures.some((failure) => failure.code === 'declared-ci-maven-missing'));
}));

test('ci-coverage-declaration accepts reproducible Node, Maven unit/integration, frontend test, audit, and build commands', () => withRoot((root) => {
  writeWorkflow(root, completeCiCommands());

  const result = validateCiCoverageDeclaration({ root });
  assert.deepEqual(result.failures, []);
}));

test('ci-coverage-declaration accepts ruoyi-ui working-directory install, test, audit, and build', () => withRoot((root) => {
  writeWorkflow(root, [
    '- run: npm ci',
    '- run: npm run check',
    '- run: npm test',
    '- run: mvn -pl ruoyi-business -am -Pintegration-test verify',
    '- run: npm ci',
    '  working-directory: ruoyi-ui',
    '- run: npm test',
    '  working-directory: ruoyi-ui',
    '- run: npm audit --audit-level moderate --include dev',
    '  working-directory: ruoyi-ui',
    '- run: npm run build:prod',
    '  working-directory: ruoyi-ui'
  ].join('\n'));

  const result = validateCiCoverageDeclaration({ root });
  assert.deepEqual(result.failures, []);
}));

test('ci-coverage-declaration does not count root npm commands as frontend coverage', () => withRoot((root) => {
  writeWorkflow(root, [
    '- run: npm ci',
    '- run: npm run check',
    '- run: npm test',
    '- run: mvn -pl ruoyi-business -am -Pintegration-test verify',
    '- run: npm audit --audit-level=moderate --include=dev',
    '- run: npm run build:prod'
  ].join('\n'));

  const result = validateCiCoverageDeclaration({ root });
  assert.ok(result.failures.some((failure) => failure.code === 'frontend-npm-ci-missing'));
  assert.ok(result.failures.some((failure) => failure.code === 'frontend-npm-test-missing'));
  assert.ok(result.failures.some((failure) => failure.code === 'frontend-audit-ci-missing'));
  assert.ok(result.failures.some((failure) => failure.code === 'frontend-build-ci-missing'));
}));

test('ci-coverage-declaration rejects skipped tests, echo commands, and continue-on-error', () => withRoot((root) => {
  writeWorkflow(root, [
    '- run: npm install --package-lock=false',
    '- run: npm run check',
    '- run: npm test',
    '- run: mvn -pl ruoyi-admin -am -DskipTests compile',
    '- run: echo compile passed',
    '  continue-on-error: true',
    '- run: npm --prefix ruoyi-ui install --package-lock=false',
    '- run: npm --prefix ruoyi-ui test',
    '- run: npm --prefix ruoyi-ui audit --audit-level=moderate --include=dev',
    '- run: npm --prefix ruoyi-ui run build:prod'
  ].join('\n'));
  write(root, 'memory/HANDOVER.md', [
    '# Handover',
    '',
    '## Verification',
    '',
    '- [ci] Maven compile passed',
    '- [ci] frontend build passed',
    ''
  ].join('\n'));

  const result = validateCiCoverageDeclaration({ root });
  assert.ok(result.failures.some((failure) => failure.code === 'root-npm-ci-missing'));
  assert.ok(result.failures.some((failure) => failure.code === 'maven-tests-skipped'));
  assert.ok(result.failures.some((failure) => failure.code === 'ci-echo-command'));
  assert.ok(result.failures.some((failure) => failure.code === 'ci-continue-on-error'));
  assert.ok(result.failures.some((failure) => failure.code === 'frontend-npm-ci-missing'));
  assert.ok(result.failures.some((failure) => failure.code === 'declared-ci-maven-missing'));
}));

test('ci-coverage-declaration rejects mutable GitHub Action refs', () => withRoot((root) => {
  writeWorkflow(root, completeCiCommands());
  const workflow = path.join(root, '.github/workflows/ci.yml');
  fs.writeFileSync(workflow, fs.readFileSync(workflow, 'utf8').replace(
    'actions/setup-node@2222222222222222222222222222222222222222',
    'actions/setup-node@v4'
  ));

  const result = validateCiCoverageDeclaration({ root });
  assert.ok(result.failures.some((failure) => failure.code === 'ci-action-ref-unpinned'));
}));

test('ci-coverage-declaration still requires CI coverage when only local Maven evidence exists', () => withRoot((root) => {
  writeWorkflow(root);
  write(root, 'memory/HANDOVER.md', '# Handover\n\n## Verification\n\n- [local] Maven compile passed\n');

  const result = validateCiCoverageDeclaration({ root });
  assert.ok(result.failures.some((failure) => failure.code === 'maven-unit-ci-missing'));
  assert.ok(result.failures.some((failure) => failure.code === 'maven-integration-ci-missing'));
}));

test('verification-provenance treats ci-planned as planned coverage, not passed CI evidence', () => withRoot((root) => {
  writeVerificationRoot(root, '- [ci-planned] Maven compile will run after push; actual CI result is determined after push.');
  writeWorkflow(root, completeCiCommands());

  assert.deepEqual(validateVerificationProvenance({ root }).failures, []);
  assert.deepEqual(validateCiCoverageDeclaration({ root }).failures, []);
}));

test('verification-provenance ignores ci text inside change-record paths', () => withRoot((root) => {
  writeVerificationRoot(root, 'Current change record: `ai/changes/CR-TEST-ci-backend-frontend-governance-checks`.');

  assert.deepEqual(validateVerificationProvenance({ root }).failures, []);
}));
