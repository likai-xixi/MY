import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  validateContractToTestMatrix,
  validateEvidenceFreshness,
  validateHighRiskDomains,
  validateHighRiskPermissionCoverage,
  validateIdempotencyRegistry,
  validateMigrationGate,
  validateStateMachines
} from '../tools/high-risk-governance-checker.js';
import { isAllowedByRoot } from '../tools/diff-checker.js';

function withRoot(fn) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-high-risk-governance-'));
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

function repoChangedFiles() {
  return [
    ...execFileSync('git', ['diff', '--name-only', '--diff-filter=ACMRTUXB', '--'], { encoding: 'utf8' }).split(/\r?\n/),
    ...execFileSync('git', ['ls-files', '--others', '--exclude-standard'], { encoding: 'utf8' }).split(/\r?\n/)
  ].filter(Boolean).map((file) => file.replace(/\\/g, '/'));
}

function readCurrentImpact() {
  const current = JSON.parse(fs.readFileSync('ai/changes/CURRENT_CHANGE.json', 'utf8')).current;
  return JSON.parse(fs.readFileSync(`ai/changes/${current}/impact.json`, 'utf8'));
}

function isCustomerRuntimePath(file) {
  return file.startsWith('ruoyi-business/src/main/java/com/ruoyi/business/customer/')
    || file.startsWith('ruoyi-admin/src/main/java/com/ruoyi/web/controller/business/customer/')
    || file.startsWith('ruoyi-business/src/main/resources/mapper/customer/')
    || file.startsWith('ruoyi-ui/src/views/customer/')
    || file === 'ruoyi-ui/src/api/customer.js'
    || file === 'sql/customer.ownership.md';
}

function isAllowedByActiveImpact(file, impact) {
  const allowedRoots = Array.isArray(impact.allowedEditRoots) ? impact.allowedEditRoots : [];
  const forbiddenRoots = Array.isArray(impact.forbiddenEditRoots) ? impact.forbiddenEditRoots : [];
  const allowed = allowedRoots.some((root) => isAllowedByRoot(file, root));
  const forbidden = forbiddenRoots.some((root) => isAllowedByRoot(file, root));
  return allowed && !forbidden;
}

function unauthorizedCustomerRuntimeChanges(changed, impact) {
  return changed
    .filter(isCustomerRuntimePath)
    .filter((file) => !isAllowedByActiveImpact(file, impact));
}

function sha256(value) {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
}

function requiredDomainIds() {
  return [
    'customer-fund',
    'sales-order-snapshot',
    'sales-order-state',
    'sales-order-submit',
    'delivery-settlement',
    'finance-fund',
    'production-generation',
    'station-scan',
    'station-offline-sync',
    'inventory-stock',
    'dxf-generation',
    'laser-task',
    'file-center',
    'high-risk-permission',
    'migration'
  ];
}

function domain(id, patch = {}) {
  return {
    id,
    name: id,
    description: `${id} description`,
    phase: 'fixture',
    status: 'planned',
    appliesToFeatures: [],
    triggerKeywords: [],
    requiredContracts: [],
    requiredRegistries: [],
    requiredTests: [],
    evidenceLevel: 'fixture',
    blockingMode: 'planning',
    ...patch
  };
}

function writeDomainRegistry(root, patches = {}) {
  writeJson(root, 'ai/registry/high-risk-domains.json', {
    schemaVersion: 1,
    domains: requiredDomainIds().map((id) => domain(id, patches[id] || {}))
  });
}

function writeFeatureRegistry(root, ids = ['customer']) {
  writeJson(root, 'ai/registry/features.json', {
    schemaVersion: 1,
    features: ids.map((id) => ({ id, name: id, status: 'active' }))
  });
}

function idempotencyEntry(patch = {}) {
  return {
    featureId: 'customer',
    api: '/business/customer/{customerId}/fund/deposit',
    method: 'POST',
    riskDomain: 'customer-fund',
    required: true,
    idempotencyKey: 'requestId',
    scope: 'customerId',
    ttl: '24h',
    duplicateBehavior: 'return-existing-result',
    conflictBehavior: 'reject-payload-mismatch',
    payloadHashRequired: true,
    lockStrategy: 'row-lock',
    resultReplay: 'same-response',
    tests: [],
    status: 'required',
    ...patch
  };
}

function stateMachineEntry(patch = {}) {
  return {
    featureId: 'sales-order',
    entity: 'SalesOrder',
    statusField: 'status',
    logTable: 'sales_order_state_log',
    states: ['DRAFT', 'SUBMITTED', 'CLOSED'],
    transitions: [
      {
        from: 'DRAFT',
        to: 'SUBMITTED',
        action: 'submit',
        permission: 'business:sales-order:submit',
        idempotent: true,
        logRequired: true,
        reasonRequired: false
      }
    ],
    terminalStates: ['CLOSED'],
    guards: [],
    permissions: ['business:sales-order:submit'],
    idempotency: ['sales-order-submit'],
    tests: [],
    status: 'contract'
  };
}

function migrationEntry(patch = {}) {
  return {
    migrationId: 'MIG-001',
    featureId: 'sales-order',
    file: 'sql/migrations/001_sales_order.sql',
    type: 'executable-sql',
    appliesToTables: ['sales_order'],
    status: 'required',
    phase: 'implementation',
    rollbackPlan: 'rollback sql exists',
    verification: ['migrate dry-run'],
    owner: 'governance',
    ...patch
  };
}

function permissionEntry(patch = {}) {
  return {
    featureId: 'customer',
    api: '/business/customer/{customerId}/fund/adjust',
    riskDomain: 'customer-fund',
    backendPermission: 'business:customer:fund:adjust',
    frontendPermission: 'business:customer:fund:adjust',
    menuPermission: 'business:customer:list',
    registryPermission: 'business:customer:fund:adjust',
    tests: [],
    status: 'required',
    hasFrontendAction: true,
    ...patch
  };
}

test('high-risk domains valid registry passes', () => withRoot((root) => {
  writeDomainRegistry(root);

  const result = validateHighRiskDomains({ root });
  assert.deepEqual(result.failures, []);
}));

test('high-risk domains missing id, blockingMode, or status fails', () => withRoot((root) => {
  writeDomainRegistry(root, {
    'customer-fund': { id: '', blockingMode: undefined, status: '' }
  });

  const result = validateHighRiskDomains({ root });
  assert.ok(result.failures.some((failure) => failure.code === 'required-field-empty'));
  assert.ok(result.failures.some((failure) => failure.code === 'required-field-missing'));
}));

test('high-risk domains invalid blockingMode fails', () => withRoot((root) => {
  writeDomainRegistry(root, {
    'customer-fund': { blockingMode: 'always-block' }
  });

  const result = validateHighRiskDomains({ root });
  assert.ok(result.failures.some((failure) => failure.code === 'invalid-blocking-mode'));
}));

test('evidence freshness valid manifest passes', () => withRoot((root) => {
  const content = 'covered evidence file\n';
  write(root, 'src/customer-risk.txt', content);
  writeJson(root, 'ai/evidence/customer-fund/pass.json', {
    schemaVersion: 1,
    evidenceId: 'EV-1',
    featureId: 'customer',
    riskDomain: 'customer-fund',
    generatedAt: '2026-06-25T00:00:00Z',
    gitCommit: 'fixture',
    commands: ['npm test'],
    environment: { node: 'test' },
    coveredFiles: ['src/customer-risk.txt'],
    coveredFileHashes: { 'src/customer-risk.txt': sha256(content) },
    cases: [{ id: 'case-1', result: 'pass' }],
    result: 'pass',
    limitations: [],
    producedBy: 'test'
  });

  const result = validateEvidenceFreshness({ root });
  assert.deepEqual(result.failures, []);
  assert.deepEqual(result.warnings, []);
}));

test('evidence freshness missing required field fails', () => withRoot((root) => {
  writeJson(root, 'ai/evidence/bad.json', { schemaVersion: 1 });

  const result = validateEvidenceFreshness({ root });
  assert.ok(result.failures.some((failure) => failure.code === 'required-field-missing'));
}));

test('evidence freshness missing covered file fails', () => withRoot((root) => {
  writeJson(root, 'ai/evidence/missing-covered.json', {
    schemaVersion: 1,
    evidenceId: 'EV-2',
    featureId: 'customer',
    riskDomain: 'customer-fund',
    generatedAt: '2026-06-25T00:00:00Z',
    gitCommit: 'fixture',
    commands: ['npm test'],
    environment: {},
    coveredFiles: ['src/missing.txt'],
    coveredFileHashes: {},
    cases: [],
    result: 'pass',
    limitations: [],
    producedBy: 'test'
  });

  const result = validateEvidenceFreshness({ root });
  assert.ok(result.failures.some((failure) => failure.code === 'covered-file-missing'));
}));

test('evidence freshness stale hash is warning when manifest is not blocking', () => withRoot((root) => {
  write(root, 'src/file.txt', 'new content\n');
  writeJson(root, 'ai/evidence/stale.json', {
    schemaVersion: 1,
    evidenceId: 'EV-3',
    featureId: 'customer',
    riskDomain: 'customer-fund',
    generatedAt: '2026-06-25T00:00:00Z',
    gitCommit: 'fixture',
    commands: ['npm test'],
    environment: {},
    coveredFiles: ['src/file.txt'],
    coveredFileHashes: { 'src/file.txt': sha256('old content\n') },
    cases: [],
    result: 'pass',
    limitations: [],
    producedBy: 'test'
  });

  const result = validateEvidenceFreshness({ root });
  assert.deepEqual(result.failures, []);
  assert.ok(result.warnings.some((warning) => warning.code === 'covered-file-hash-stale'));
}));

test('evidence freshness no evidence files does not fail', () => withRoot((root) => {
  const result = validateEvidenceFreshness({ root });
  assert.deepEqual(result.failures, []);
}));

test('contract-to-test covered requirement with existing test passes', () => withRoot((root) => {
  write(root, 'ai/contracts/customer.api.md', '# Contract\n');
  write(root, 'tests/customer-contract.test.js', 'import test from "node:test";\n');
  writeJson(root, 'ai/contract-test-matrix/customer.json', {
    schemaVersion: 1,
    contracts: [
      {
        contractId: 'customer-fund-must',
        contractFile: 'ai/contracts/customer.api.md',
        requirementText: 'MUST write a fund flow.',
        status: 'covered',
        coverage: [],
        tests: ['tests/customer-contract.test.js'],
        deferredReason: '',
        phase: 'CR-3',
        owner: 'governance',
        trigger: 'fund changes',
        expiresAtPhase: 'implementation'
      }
    ]
  });

  const result = validateContractToTestMatrix({ root });
  assert.deepEqual(result.failures, []);
}));

test('contract-to-test covered requirement with missing test fails', () => withRoot((root) => {
  writeJson(root, 'ai/contract-test-matrix/customer.json', {
    schemaVersion: 1,
    contracts: [
      {
        contractId: 'missing-test',
        contractFile: 'ai/contracts/customer.api.md',
        requirementText: 'MUST be tested.',
        status: 'covered',
        coverage: [],
        tests: ['tests/missing.test.js'],
        deferredReason: '',
        phase: 'CR-3',
        owner: 'governance',
        trigger: 'change',
        expiresAtPhase: 'implementation'
      }
    ]
  });

  const result = validateContractToTestMatrix({ root });
  assert.ok(result.failures.some((failure) => failure.code === 'covered-without-test'));
  assert.ok(result.failures.some((failure) => failure.code === 'covered-test-missing'));
}));

test('contract-to-test deferred missing reason phase owner or trigger fails', () => withRoot((root) => {
  writeJson(root, 'ai/contract-test-matrix/customer.json', {
    schemaVersion: 1,
    contracts: [
      {
        contractId: 'deferred-bad',
        contractFile: 'ai/contracts/customer.api.md',
        requirementText: 'SHOULD be tested.',
        status: 'deferred',
        coverage: [],
        tests: [],
        deferredReason: '',
        phase: '',
        owner: '',
        trigger: '',
        expiresAtPhase: ''
      }
    ]
  });

  const result = validateContractToTestMatrix({ root });
  assert.ok(result.failures.some((failure) => failure.code === 'required-field-empty'));
}));

test('contract-to-test empty deferred reason fails', () => withRoot((root) => {
  writeJson(root, 'ai/contract-test-matrix/customer.json', {
    schemaVersion: 1,
    contracts: [
      {
        contractId: 'deferred-later',
        contractFile: 'ai/contracts/customer.api.md',
        requirementText: 'SHOULD be tested.',
        status: 'deferred',
        coverage: [],
        tests: [],
        deferredReason: 'todo later',
        phase: 'CR-4',
        owner: 'governance',
        trigger: 'contract approved',
        expiresAtPhase: 'implementation'
      }
    ]
  });

  const result = validateContractToTestMatrix({ root });
  assert.ok(result.failures.some((failure) => failure.code === 'empty-deferred-reason'));
}));

test('contract-to-test no matrix files does not fail', () => withRoot((root) => {
  const result = validateContractToTestMatrix({ root });
  assert.deepEqual(result.failures, []);
}));

test('idempotency complete required entry passes', () => withRoot((root) => {
  writeFeatureRegistry(root);
  writeJson(root, 'ai/registry/idempotency-registry.json', {
    schemaVersion: 1,
    entries: [idempotencyEntry()]
  });

  const result = validateIdempotencyRegistry({ root });
  assert.deepEqual(result.failures, []);
}));

test('idempotency required entry missing scope ttl conflictBehavior fails', () => withRoot((root) => {
  writeFeatureRegistry(root);
  const entry = idempotencyEntry();
  delete entry.scope;
  delete entry.ttl;
  delete entry.conflictBehavior;
  writeJson(root, 'ai/registry/idempotency-registry.json', {
    schemaVersion: 1,
    entries: [entry]
  });

  const result = validateIdempotencyRegistry({ root });
  assert.ok(result.failures.some((failure) => failure.code === 'required-field-missing'));
}));

test('idempotency missing payloadHashRequired fails', () => withRoot((root) => {
  writeFeatureRegistry(root);
  const entry = idempotencyEntry();
  delete entry.payloadHashRequired;
  writeJson(root, 'ai/registry/idempotency-registry.json', {
    schemaVersion: 1,
    entries: [entry]
  });

  const result = validateIdempotencyRegistry({ root });
  assert.ok(result.failures.some((failure) => failure.code === 'payload-hash-required-missing'));
}));

test('idempotency duplicate API entry fails', () => withRoot((root) => {
  writeFeatureRegistry(root);
  writeJson(root, 'ai/registry/idempotency-registry.json', {
    schemaVersion: 1,
    entries: [idempotencyEntry(), idempotencyEntry()]
  });

  const result = validateIdempotencyRegistry({ root });
  assert.ok(result.failures.some((failure) => failure.code === 'duplicate-idempotency-entry'));
}));

test('idempotency empty registry passes', () => withRoot((root) => {
  writeJson(root, 'ai/registry/idempotency-registry.json', { schemaVersion: 1, entries: [] });

  const result = validateIdempotencyRegistry({ root });
  assert.deepEqual(result.failures, []);
}));

test('state-machine legal transition passes', () => withRoot((root) => {
  writeJson(root, 'ai/registry/state-machines.json', {
    schemaVersion: 1,
    entries: [stateMachineEntry()]
  });

  const result = validateStateMachines({ root });
  assert.deepEqual(result.failures, []);
}));

test('state-machine transition to unknown state fails', () => withRoot((root) => {
  const entry = stateMachineEntry();
  entry.transitions[0].to = 'UNKNOWN';
  writeJson(root, 'ai/registry/state-machines.json', {
    schemaVersion: 1,
    entries: [entry]
  });

  const result = validateStateMachines({ root });
  assert.ok(result.failures.some((failure) => failure.code === 'transition-to-unknown'));
}));

test('state-machine missing permission fails', () => withRoot((root) => {
  const entry = stateMachineEntry();
  delete entry.transitions[0].permission;
  writeJson(root, 'ai/registry/state-machines.json', {
    schemaVersion: 1,
    entries: [entry]
  });

  const result = validateStateMachines({ root });
  assert.ok(result.failures.some((failure) => failure.code === 'required-field-missing'));
}));

test('state-machine terminal state ordinary out transition fails', () => withRoot((root) => {
  const entry = stateMachineEntry();
  entry.transitions.push({
    from: 'CLOSED',
    to: 'DRAFT',
    action: 'reopen',
    permission: 'business:sales-order:reopen',
    idempotent: false,
    logRequired: true,
    reasonRequired: true
  });
  writeJson(root, 'ai/registry/state-machines.json', {
    schemaVersion: 1,
    entries: [entry]
  });

  const result = validateStateMachines({ root });
  assert.ok(result.failures.some((failure) => failure.code === 'terminal-state-flow-out'));
}));

test('state-machine empty registry passes', () => withRoot((root) => {
  writeJson(root, 'ai/registry/state-machines.json', { schemaVersion: 1, entries: [] });

  const result = validateStateMachines({ root });
  assert.deepEqual(result.failures, []);
}));

test('migration required executable file exists passes', () => withRoot((root) => {
  write(root, 'sql/migrations/001_sales_order.sql', '-- migration\n');
  writeJson(root, 'ai/registry/migration-registry.json', {
    schemaVersion: 1,
    entries: [migrationEntry()]
  });

  const result = validateMigrationGate({ root });
  assert.deepEqual(result.failures, []);
}));

test('migration missing required file fails', () => withRoot((root) => {
  writeJson(root, 'ai/registry/migration-registry.json', {
    schemaVersion: 1,
    entries: [migrationEntry()]
  });

  const result = validateMigrationGate({ root });
  assert.ok(result.failures.some((failure) => failure.code === 'required-migration-missing'));
}));

test('migration markdown file cannot satisfy required migration', () => withRoot((root) => {
  write(root, 'sql/migrations/plan.md', '# plan\n');
  writeJson(root, 'ai/registry/migration-registry.json', {
    schemaVersion: 1,
    entries: [migrationEntry({ file: 'sql/migrations/plan.md' })]
  });

  const result = validateMigrationGate({ root });
  assert.ok(result.failures.some((failure) => failure.code === 'required-migration-not-executable'));
}));

test('migration existing customer baseline warning does not fail', () => withRoot((root) => {
  write(root, 'sql/customer.ownership.md', '# Customer DDL\n');
  writeJson(root, 'ai/registry/migration-registry.json', {
    schemaVersion: 1,
    entries: [
      migrationEntry({
        migrationId: 'customer-baseline',
        featureId: 'customer',
        file: 'sql/customer.ownership.md',
        type: 'baseline-ddl-document',
        appliesToTables: ['customer'],
        status: 'baseline',
        phase: 'existing-customer-baseline',
        blocking: false
      })
    ]
  });

  const result = validateMigrationGate({ root });
  assert.deepEqual(result.failures, []);
  assert.ok(result.warnings.some((warning) => warning.code === 'baseline-migration-document'));
}));

test('repo-level customer migration baseline is executable blocking SQL', () => {
  const registry = JSON.parse(fs.readFileSync('ai/registry/migration-registry.json', 'utf8'));
  const entriesById = new Map((registry.entries || []).map((entry) => [entry.migrationId, entry]));
  const expected = [
    'customer-schema-baseline',
    'customer-public-seed-baseline',
    'customer-menu-permission-baseline',
    'customer-runtime-validation'
  ];

  for (const migrationId of expected) {
    const entry = entriesById.get(migrationId);
    assert.ok(entry, `${migrationId} should be registered`);
    assert.equal(entry.featureId, 'customer');
    assert.equal(entry.blocking, true);
    assert.equal(entry.status, 'required');
    assert.equal(path.extname(entry.file), '.sql');
    assert.equal(fs.existsSync(entry.file), true, `${entry.file} should exist`);
    assert.ok(String(entry.rollbackPlan || '').trim(), `${migrationId} should record a rollbackPlan`);
    assert.ok(Array.isArray(entry.verification) && entry.verification.length > 0, `${migrationId} should record verification`);
  }

  const currentCustomerMarkdownBaselines = (registry.entries || []).filter((entry) => (
    entry.featureId === 'customer'
    && entry.file === 'sql/customer.ownership.md'
    && (entry.blocking === true || entry.status === 'required' || entry.type === 'baseline-ddl-document')
  ));
  assert.deepEqual(currentCustomerMarkdownBaselines, []);

  const result = validateMigrationGate({ root: process.cwd() });
  assert.deepEqual(result.failures, []);
  assert.deepEqual(result.warnings.filter((warning) => warning.code === 'baseline-migration-document'), []);
});

test('repo-level migration registry points only to existing files', () => {
  const registry = JSON.parse(fs.readFileSync('ai/registry/migration-registry.json', 'utf8'));
  for (const entry of registry.entries || []) {
    assert.equal(fs.existsSync(entry.file), true, `${entry.migrationId} points to missing file ${entry.file}`);
    if (entry.blocking === true || entry.status === 'required') {
      assert.ok(String(entry.rollbackPlan || '').trim(), `${entry.migrationId} missing rollbackPlan`);
      assert.ok(Array.isArray(entry.verification) && entry.verification.length > 0, `${entry.migrationId} missing verification`);
    }
  }
});

test('migration empty registry passes', () => withRoot((root) => {
  writeJson(root, 'ai/registry/migration-registry.json', { schemaVersion: 1, entries: [] });

  const result = validateMigrationGate({ root });
  assert.deepEqual(result.failures, []);
}));

test('high-risk permission complete required coverage passes', () => withRoot((root) => {
  writeJson(root, 'ai/registry/high-risk-permission-coverage.json', {
    schemaVersion: 1,
    entries: [permissionEntry()]
  });

  const result = validateHighRiskPermissionCoverage({ root });
  assert.deepEqual(result.failures, []);
}));

test('high-risk permission missing backend permission fails', () => withRoot((root) => {
  writeJson(root, 'ai/registry/high-risk-permission-coverage.json', {
    schemaVersion: 1,
    entries: [permissionEntry({ backendPermission: '' })]
  });

  const result = validateHighRiskPermissionCoverage({ root });
  assert.ok(result.failures.some((failure) => failure.code === 'required-field-empty'));
}));

test('high-risk permission deferred without reason fails', () => withRoot((root) => {
  writeJson(root, 'ai/registry/high-risk-permission-coverage.json', {
    schemaVersion: 1,
    entries: [permissionEntry({ status: 'deferred', deferredReason: '', phase: 'CR-4', owner: 'governance', trigger: 'approved contract' })]
  });

  const result = validateHighRiskPermissionCoverage({ root });
  assert.ok(result.failures.some((failure) => failure.code === 'required-field-empty'));
}));

test('high-risk permission generic edit permission for fund adjust fails', () => withRoot((root) => {
  writeJson(root, 'ai/registry/high-risk-permission-coverage.json', {
    schemaVersion: 1,
    entries: [permissionEntry({ backendPermission: 'business:customer:edit' })]
  });

  const result = validateHighRiskPermissionCoverage({ root });
  assert.ok(result.failures.some((failure) => failure.code === 'generic-edit-permission'));
}));

test('high-risk permission empty registry passes', () => withRoot((root) => {
  writeJson(root, 'ai/registry/high-risk-permission-coverage.json', { schemaVersion: 1, entries: [] });

  const result = validateHighRiskPermissionCoverage({ root });
  assert.deepEqual(result.failures, []);
}));

test('repo-level safety has no sales-order runtime files', () => {
  const runtimePaths = [
    'ruoyi-business/src/main/java/com/ruoyi/business/sales-order',
    'ruoyi-business/src/main/java/com/ruoyi/business/salesorder',
    'ruoyi-admin/src/main/java/com/ruoyi/web/controller/business/sales-order',
    'ruoyi-admin/src/main/java/com/ruoyi/web/controller/business/salesorder',
    'ruoyi-ui/src/views/sales-order',
    'ruoyi-ui/src/views/salesorder',
    'ruoyi-ui/src/api/sales-order.js',
    'ruoyi-ui/src/api/salesOrder.js',
    'sql/sales-order.ownership.md',
    'sql/sales_order_init.sql'
  ];

  assert.deepEqual(runtimePaths.filter((file) => fs.existsSync(file)), []);
});

test('active impact scope permits approved customer runtime changes only', () => {
  const changed = [
    'ruoyi-business/src/main/java/com/ruoyi/business/customer/service/impl/CustomerServiceImpl.java',
    'ruoyi-ui/src/views/customer/index.vue',
    'ruoyi-ui/src/api/customer.js',
    'sql/customer.ownership.md'
  ];
  const impact = {
    allowedEditRoots: [
      'ruoyi-business/src/main/java/com/ruoyi/business/customer/service/impl/CustomerServiceImpl.java',
      'ruoyi-ui/src/views/customer/index.vue',
      'ruoyi-ui/src/api/customer.js'
    ],
    forbiddenEditRoots: [
      'ruoyi-ui/src/api/customer.js',
      'sql'
    ]
  };

  assert.deepEqual(unauthorizedCustomerRuntimeChanges(changed, impact), [
    'ruoyi-ui/src/api/customer.js',
    'sql/customer.ownership.md'
  ]);
});

test('repo-level safety has no unauthorized customer runtime changes in this CR', () => {
  const unauthorized = unauthorizedCustomerRuntimeChanges(repoChangedFiles(), readCurrentImpact());

  assert.deepEqual(unauthorized, []);
});

test('repo-level safety keeps existing check gates and adds high-risk gate', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const check = pkg.scripts.check;
  for (const script of [
    'check:phase-gate',
    'check:review',
    'check:runtime',
    'check:change',
    'check:diff',
    'npm test',
    'check:high-risk-governance'
  ]) {
    assert.equal(check.includes(script), true, `${script} should remain wired into npm run check`);
  }
});
