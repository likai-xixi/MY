import crypto from 'node:crypto';
import {
  emptyResult,
  issue,
  listFiles,
  mergeResults,
  parseRootArg,
  pathExists,
  printIssues,
  readJson,
  readText,
  runGit
} from './governance-checker-utils.js';

const REQUIRED_DOMAIN_IDS = [
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

const DOMAIN_FIELDS = [
  'id',
  'name',
  'description',
  'phase',
  'status',
  'appliesToFeatures',
  'triggerKeywords',
  'requiredContracts',
  'requiredRegistries',
  'requiredTests',
  'evidenceLevel',
  'blockingMode'
];

const DOMAIN_ARRAY_FIELDS = [
  'appliesToFeatures',
  'triggerKeywords',
  'requiredContracts',
  'requiredRegistries',
  'requiredTests'
];

const BLOCKING_MODES = new Set([
  'planning',
  'contract-required',
  'implementation-required',
  'runtime-required',
  'warning-only'
]);

const FUTURE_RUNTIME_PREFIXES = [
  'sales-order',
  'delivery',
  'finance',
  'production',
  'station',
  'inventory',
  'dxf',
  'laser',
  'file-center'
];

const REQUIRED_SCHEMA_FILES = [
  'ai/rules/schemas/evidence-manifest.schema.json',
  'ai/rules/schemas/contract-test-matrix.schema.json',
  'ai/rules/schemas/idempotency-registry.schema.json',
  'ai/rules/schemas/state-machines.schema.json',
  'ai/rules/schemas/migration-registry.schema.json',
  'ai/rules/schemas/high-risk-permission-coverage.schema.json'
];

const EVIDENCE_REQUIRED_FIELDS = [
  'schemaVersion',
  'evidenceId',
  'featureId',
  'riskDomain',
  'generatedAt',
  'gitCommit',
  'commands',
  'environment',
  'coveredFiles',
  'coveredFileHashes',
  'cases',
  'result',
  'limitations',
  'producedBy'
];

const CONTRACT_REQUIRED_FIELDS = [
  'contractId',
  'contractFile',
  'requirementText',
  'status',
  'coverage',
  'tests',
  'deferredReason',
  'phase',
  'owner',
  'trigger',
  'expiresAtPhase'
];

const CONTRACT_STATUSES = new Set(['covered', 'deferred', 'blocked', 'not-applicable']);
const EMPTY_DEFERRED_REASON = /\b(later|todo|tbd|以后再说|回头再说|待定)\b/i;

const IDEMPOTENCY_FIELDS = [
  'featureId',
  'api',
  'method',
  'riskDomain',
  'required',
  'idempotencyKey',
  'scope',
  'ttl',
  'duplicateBehavior',
  'conflictBehavior',
  'payloadHashRequired',
  'lockStrategy',
  'resultReplay',
  'tests',
  'status'
];

const REQUIRED_IDEMPOTENCY_FIELDS = [
  'scope',
  'ttl',
  'duplicateBehavior',
  'conflictBehavior',
  'payloadHashRequired',
  'lockStrategy'
];

const STATE_MACHINE_FIELDS = [
  'featureId',
  'entity',
  'statusField',
  'logTable',
  'states',
  'transitions',
  'terminalStates',
  'guards',
  'permissions',
  'idempotency',
  'tests',
  'status'
];

const TRANSITION_FIELDS = [
  'from',
  'to',
  'action',
  'permission',
  'idempotent',
  'logRequired',
  'reasonRequired'
];

const MIGRATION_FIELDS = [
  'migrationId',
  'featureId',
  'file',
  'type',
  'appliesToTables',
  'status',
  'phase',
  'rollbackPlan',
  'verification',
  'owner'
];

const PERMISSION_FIELDS = [
  'featureId',
  'api',
  'riskDomain',
  'backendPermission',
  'frontendPermission',
  'menuPermission',
  'registryPermission',
  'tests',
  'status'
];

const HIGH_RISK_PERMISSION_STATUSES = new Set([
  'required',
  'deferred',
  'framework-warning',
  'not-applicable'
]);

function normalizePath(value) {
  return String(value || '').replace(/\\/g, '/').replace(/^\.\//, '');
}

function hasOwn(object, field) {
  return Object.prototype.hasOwnProperty.call(object || {}, field);
}

function isBlank(value) {
  if (value === undefined || value === null) {
    return true;
  }
  if (typeof value === 'string') {
    return value.trim().length === 0;
  }
  return false;
}

function addFailure(result, file, code, message, detail = '') {
  result.failures.push(issue({ file, code, message, detail }));
}

function addWarning(result, file, code, message, detail = '') {
  result.warnings.push(issue({ file, code, message, detail }));
}

function readJsonResult(root, file, result, { missingOk = false } = {}) {
  if (!pathExists(root, file)) {
    if (!missingOk) {
      addFailure(result, file, 'missing-file', `${file} is missing`);
    }
    return null;
  }
  try {
    return readJson(root, file);
  } catch (error) {
    addFailure(result, file, 'invalid-json', error.message);
    return null;
  }
}

function requirePresentFields(result, file, label, entry, fields) {
  for (const field of fields) {
    if (!hasOwn(entry, field)) {
      addFailure(result, file, 'required-field-missing', `${label} missing ${field}`);
    }
  }
}

function requireNonBlankFields(result, file, label, entry, fields) {
  for (const field of fields) {
    if (isBlank(entry[field])) {
      addFailure(result, file, 'required-field-empty', `${label} missing ${field}`);
    }
  }
}

function requireArrayField(result, file, label, entry, field) {
  if (!Array.isArray(entry[field])) {
    addFailure(result, file, 'array-field-required', `${label}.${field} must be an array`);
    return [];
  }
  return entry[field];
}

function registeredFeatureIds(root) {
  try {
    const registry = readJson(root, 'ai/registry/features.json');
    return new Set((registry.features || [])
      .filter((feature) => feature.status !== 'removed')
      .map((feature) => feature.id));
  } catch {
    return new Set();
  }
}

function checkTestFiles(root, result, file, label, tests = []) {
  if (!Array.isArray(tests)) {
    return;
  }
  for (const testFile of tests) {
    if (!pathExists(root, testFile)) {
      addFailure(result, file, 'test-file-missing', `${label} references missing test ${testFile}`);
    }
  }
}

function sha256Hex(root, file) {
  const text = readText(root, file);
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

function currentHead(root) {
  const head = runGit(root, ['rev-parse', 'HEAD']);
  return head.status === 0 ? head.stdout.trim() : '';
}

function issueStaleEvidence(result, manifest, file, code, message, detail = '') {
  if (manifest?.blocking === true) {
    addFailure(result, file, code, message, detail);
  } else {
    addWarning(result, file, code, message, detail);
  }
}

function isFutureRuntimeDomain(id) {
  return FUTURE_RUNTIME_PREFIXES.some((prefix) => id === prefix || id.startsWith(`${prefix}-`));
}

export function validateSchemaFiles({ root = process.cwd() } = {}) {
  const result = emptyResult();
  for (const file of REQUIRED_SCHEMA_FILES) {
    const data = readJsonResult(root, file, result);
    if (!data) {
      continue;
    }
    if (data.$schema === undefined || data.title === undefined) {
      addFailure(result, file, 'invalid-schema-file', `${file} must declare $schema and title`);
    }
  }
  return result;
}

export function validateHighRiskDomains({ root = process.cwd() } = {}) {
  const result = emptyResult();
  const file = 'ai/registry/high-risk-domains.json';
  const data = readJsonResult(root, file, result);
  if (!data) {
    return result;
  }

  if (data.schemaVersion !== 1) {
    addFailure(result, file, 'invalid-schema-version', `${file} schemaVersion must be 1`);
  }
  if (!Array.isArray(data.domains)) {
    addFailure(result, file, 'domains-array-required', `${file} domains must be an array`);
    return result;
  }

  const ids = new Set();
  for (const [index, domain] of data.domains.entries()) {
    const label = `domains[${index}]`;
    requirePresentFields(result, file, label, domain, DOMAIN_FIELDS);
    requireNonBlankFields(result, file, label, domain, ['id', 'name', 'description', 'phase', 'status', 'evidenceLevel', 'blockingMode']);
    for (const field of DOMAIN_ARRAY_FIELDS) {
      requireArrayField(result, file, label, domain, field);
    }
    if (domain.id) {
      if (ids.has(domain.id)) {
        addFailure(result, file, 'duplicate-domain-id', `duplicate high-risk domain id ${domain.id}`);
      }
      ids.add(domain.id);
    }
    if (!BLOCKING_MODES.has(domain.blockingMode)) {
      addFailure(result, file, 'invalid-blocking-mode', `${domain.id || label} has invalid blockingMode ${domain.blockingMode || ''}`);
    }
    if (isFutureRuntimeDomain(domain.id) && domain.status === 'planned' && domain.blockingMode === 'runtime-required') {
      addFailure(result, file, 'future-runtime-hard-blocked', `${domain.id} must not be runtime-required before implementation exists`);
    }
    checkTestFiles(root, result, file, domain.id || label, domain.requiredTests);
  }

  for (const id of REQUIRED_DOMAIN_IDS) {
    if (!ids.has(id)) {
      addFailure(result, file, 'required-domain-missing', `${file} must define high-risk domain ${id}`);
    }
  }
  return result;
}

export function validateEvidenceFreshness({ root = process.cwd() } = {}) {
  const result = emptyResult();
  const files = listFiles(root, 'ai/evidence', (file) => file.endsWith('.json'));
  if (files.length === 0) {
    return result;
  }

  const head = currentHead(root);
  for (const file of files) {
    const manifest = readJsonResult(root, file, result);
    if (!manifest) {
      continue;
    }
    requirePresentFields(result, file, 'evidence manifest', manifest, EVIDENCE_REQUIRED_FIELDS);
    if (manifest.schemaVersion !== 1) {
      addFailure(result, file, 'invalid-schema-version', `${file} schemaVersion must be 1`);
    }
    const coveredFiles = requireArrayField(result, file, 'evidence manifest', manifest, 'coveredFiles');
    const coveredFileHashes = manifest.coveredFileHashes || {};
    if (!coveredFileHashes || typeof coveredFileHashes !== 'object' || Array.isArray(coveredFileHashes)) {
      addFailure(result, file, 'covered-hashes-object-required', `${file} coveredFileHashes must be an object`);
    }

    for (const coveredFile of coveredFiles) {
      const normalized = normalizePath(coveredFile);
      if (!pathExists(root, normalized)) {
        addFailure(result, file, 'covered-file-missing', `${file} references missing covered file ${normalized}`);
        continue;
      }
      const expectedHash = coveredFileHashes?.[normalized] || coveredFileHashes?.[coveredFile];
      if (expectedHash) {
        const actualHash = sha256Hex(root, normalized);
        if (String(expectedHash).toLowerCase() !== actualHash) {
          issueStaleEvidence(result, manifest, file, 'covered-file-hash-stale', `${normalized} hash differs from evidence manifest`, `expected ${expectedHash}, actual ${actualHash}`);
        }
      }
    }

    if (head && manifest.gitCommit && !head.startsWith(String(manifest.gitCommit)) && !String(manifest.gitCommit).startsWith(head)) {
      issueStaleEvidence(result, manifest, file, 'git-commit-stale', `${file} gitCommit does not match current HEAD`, `manifest ${manifest.gitCommit}, HEAD ${head}`);
    }
  }
  return result;
}

function contractMatrixFiles(root) {
  const files = new Set();
  if (pathExists(root, 'ai/contract-test-matrix.json')) {
    files.add('ai/contract-test-matrix.json');
  }
  for (const file of listFiles(root, 'ai/contract-test-matrix', (item) => item.endsWith('.json'))) {
    files.add(file);
  }
  for (const file of listFiles(root, 'ai/contracts', (item) => item.endsWith('.json') && /(contract-test-matrix|matrix)/i.test(item))) {
    files.add(file);
  }
  return [...files].sort();
}

function existingCoverageFiles(root, files = []) {
  return files.filter((file) => pathExists(root, normalizePath(file)));
}

export function validateContractToTestMatrix({ root = process.cwd() } = {}) {
  const result = emptyResult();
  const files = contractMatrixFiles(root);
  if (files.length === 0) {
    return result;
  }

  for (const file of files) {
    const data = readJsonResult(root, file, result);
    if (!data) {
      continue;
    }
    if (data.schemaVersion !== 1) {
      addFailure(result, file, 'invalid-schema-version', `${file} schemaVersion must be 1`);
    }
    if (!Array.isArray(data.contracts)) {
      addFailure(result, file, 'contracts-array-required', `${file} contracts must be an array`);
      continue;
    }
    for (const [index, entry] of data.contracts.entries()) {
      const label = `contracts[${index}]`;
      requirePresentFields(result, file, label, entry, CONTRACT_REQUIRED_FIELDS);
      requireNonBlankFields(result, file, label, entry, ['contractId', 'contractFile', 'requirementText', 'status']);
      const tests = requireArrayField(result, file, label, entry, 'tests');
      const coverage = requireArrayField(result, file, label, entry, 'coverage');

      if (!CONTRACT_STATUSES.has(entry.status)) {
        addFailure(result, file, 'invalid-contract-status', `${entry.contractId || label} has invalid status ${entry.status || ''}`);
      }
      if (entry.status === 'covered') {
        const existingTests = existingCoverageFiles(root, tests);
        const existingCoverage = existingCoverageFiles(root, coverage);
        if (existingTests.length + existingCoverage.length === 0) {
          addFailure(result, file, 'covered-without-test', `${entry.contractId || label} is covered but has no existing test or coverage file`);
        }
        for (const testFile of tests) {
          if (!pathExists(root, normalizePath(testFile))) {
            addFailure(result, file, 'covered-test-missing', `${entry.contractId || label} references missing test ${testFile}`);
          }
        }
      }
      if (entry.status === 'deferred') {
        requireNonBlankFields(result, file, label, entry, ['deferredReason', 'phase', 'owner', 'trigger', 'expiresAtPhase']);
        if (EMPTY_DEFERRED_REASON.test(entry.deferredReason || '')) {
          addFailure(result, file, 'empty-deferred-reason', `${entry.contractId || label} has a non-actionable deferredReason`);
        }
      }
      if (entry.status === 'blocked') {
        requireNonBlankFields(result, file, label, entry, ['blocker', 'nextAction']);
      }
      if (entry.status === 'not-applicable') {
        requireNonBlankFields(result, file, label, entry, ['reason']);
      }
    }
  }
  return result;
}

export function validateIdempotencyRegistry({ root = process.cwd() } = {}) {
  const result = emptyResult();
  const file = 'ai/registry/idempotency-registry.json';
  const data = readJsonResult(root, file, result);
  if (!data) {
    return result;
  }
  if (data.schemaVersion !== 1) {
    addFailure(result, file, 'invalid-schema-version', `${file} schemaVersion must be 1`);
  }
  if (!Array.isArray(data.entries)) {
    addFailure(result, file, 'entries-array-required', `${file} entries must be an array`);
    return result;
  }

  const features = registeredFeatureIds(root);
  const seen = new Set();
  for (const [index, entry] of data.entries.entries()) {
    const label = `entries[${index}]`;
    requirePresentFields(result, file, label, entry, IDEMPOTENCY_FIELDS);
    requireNonBlankFields(result, file, label, entry, ['featureId', 'api', 'method', 'riskDomain', 'idempotencyKey', 'status']);
    requireArrayField(result, file, label, entry, 'tests');

    const key = [entry.featureId, entry.method, entry.api, entry.riskDomain].map((part) => String(part || '').toLowerCase()).join('|');
    if (seen.has(key)) {
      addFailure(result, file, 'duplicate-idempotency-entry', `${entry.method || ''} ${entry.api || label} has duplicate idempotency registry entries`);
    }
    seen.add(key);

    if (features.size > 0 && entry.featureId && !features.has(entry.featureId)) {
      addFailure(result, file, 'unknown-feature', `${label} references unknown active feature ${entry.featureId}`);
    }
    if (entry.required === true) {
      requireNonBlankFields(result, file, label, entry, REQUIRED_IDEMPOTENCY_FIELDS.filter((field) => field !== 'payloadHashRequired'));
      if (!hasOwn(entry, 'payloadHashRequired') || typeof entry.payloadHashRequired !== 'boolean') {
        addFailure(result, file, 'payload-hash-required-missing', `${label} required=true must declare boolean payloadHashRequired`);
      }
    }
    checkTestFiles(root, result, file, label, entry.tests);
  }
  return result;
}

export function validateStateMachines({ root = process.cwd() } = {}) {
  const result = emptyResult();
  const file = 'ai/registry/state-machines.json';
  const data = readJsonResult(root, file, result);
  if (!data) {
    return result;
  }
  if (data.schemaVersion !== 1) {
    addFailure(result, file, 'invalid-schema-version', `${file} schemaVersion must be 1`);
  }
  if (!Array.isArray(data.entries)) {
    addFailure(result, file, 'entries-array-required', `${file} entries must be an array`);
    return result;
  }

  for (const [index, machine] of data.entries.entries()) {
    const label = `entries[${index}]`;
    requirePresentFields(result, file, label, machine, STATE_MACHINE_FIELDS);
    requireNonBlankFields(result, file, label, machine, ['featureId', 'entity', 'statusField', 'logTable', 'status']);
    const states = requireArrayField(result, file, label, machine, 'states');
    const transitions = requireArrayField(result, file, label, machine, 'transitions');
    const terminalStates = requireArrayField(result, file, label, machine, 'terminalStates');
    requireArrayField(result, file, label, machine, 'guards');
    requireArrayField(result, file, label, machine, 'permissions');
    requireArrayField(result, file, label, machine, 'idempotency');
    requireArrayField(result, file, label, machine, 'tests');

    if (states.length === 0) {
      addFailure(result, file, 'states-empty', `${label} states must not be empty`);
    }
    const stateSet = new Set(states);
    for (const terminal of terminalStates) {
      if (!stateSet.has(terminal)) {
        addFailure(result, file, 'terminal-state-unknown', `${label} terminal state ${terminal} is not declared in states`);
      }
    }
    if (machine.logTable === 'state_transition_log' && !machine.logRegistryRef && !machine.domainNote) {
      addFailure(result, file, 'state-transition-log-unregistered', `${label} uses state_transition_log without logRegistryRef or domainNote`);
    }
    for (const [transitionIndex, transition] of transitions.entries()) {
      const transitionLabel = `${label}.transitions[${transitionIndex}]`;
      requirePresentFields(result, file, transitionLabel, transition, TRANSITION_FIELDS);
      requireNonBlankFields(result, file, transitionLabel, transition, ['from', 'to', 'action', 'permission']);
      if (transition.from && !stateSet.has(transition.from)) {
        addFailure(result, file, 'transition-from-unknown', `${transitionLabel}.from ${transition.from} is not declared in states`);
      }
      if (transition.to && !stateSet.has(transition.to)) {
        addFailure(result, file, 'transition-to-unknown', `${transitionLabel}.to ${transition.to} is not declared in states`);
      }
      if (typeof transition.idempotent !== 'boolean') {
        addFailure(result, file, 'transition-idempotent-required', `${transitionLabel}.idempotent must be boolean`);
      }
      if (typeof transition.logRequired !== 'boolean') {
        addFailure(result, file, 'transition-log-required', `${transitionLabel}.logRequired must be boolean`);
      }
      if (terminalStates.includes(transition.from)) {
        if (transition.explicitOverride !== true) {
          addFailure(result, file, 'terminal-state-flow-out', `${transitionLabel} leaves terminal state ${transition.from} without explicitOverride=true`);
        } else if (isBlank(transition.reason)) {
          addFailure(result, file, 'terminal-override-reason-required', `${transitionLabel} explicitOverride requires reason`);
        }
      }
    }
    checkTestFiles(root, result, file, label, machine.tests);
  }
  return result;
}

function isBlockingMigration(entry) {
  return entry?.blocking === true || entry?.status === 'required';
}

function isMarkdownFile(file) {
  return /\.md$/i.test(String(file || ''));
}

function isValidationMigration(entry) {
  return /validation/i.test(String(entry?.type || '')) || /validation/i.test(String(entry?.migrationId || ''));
}

function dependencyIds(entry) {
  return Array.isArray(entry?.dependsOn) ? entry.dependsOn : [];
}

function dependencyTableSet(entry, byMigrationId, visited = new Set()) {
  const tables = new Set();
  for (const id of dependencyIds(entry)) {
    if (visited.has(id)) {
      continue;
    }
    visited.add(id);
    const dependency = byMigrationId.get(id);
    if (!dependency) {
      continue;
    }
    for (const table of dependency.appliesToTables || []) {
      tables.add(table);
    }
    for (const table of dependencyTableSet(dependency, byMigrationId, visited)) {
      tables.add(table);
    }
  }
  return tables;
}

export function validateMigrationGate({ root = process.cwd() } = {}) {
  const result = emptyResult();
  const file = 'ai/registry/migration-registry.json';
  const data = readJsonResult(root, file, result);
  if (!data) {
    return result;
  }
  if (data.schemaVersion !== 1) {
    addFailure(result, file, 'invalid-schema-version', `${file} schemaVersion must be 1`);
  }
  if (!Array.isArray(data.entries)) {
    addFailure(result, file, 'entries-array-required', `${file} entries must be an array`);
    return result;
  }

  const byMigrationId = new Map();
  for (const [index, entry] of data.entries.entries()) {
    const label = `entries[${index}]`;
    if (!entry?.migrationId) {
      continue;
    }
    if (byMigrationId.has(entry.migrationId)) {
      addFailure(result, file, 'duplicate-migration-id', `${label} duplicates migrationId ${entry.migrationId}`);
      continue;
    }
    byMigrationId.set(entry.migrationId, entry);
  }

  for (const [index, entry] of data.entries.entries()) {
    const label = `entries[${index}]`;
    requirePresentFields(result, file, label, entry, MIGRATION_FIELDS);
    requireNonBlankFields(result, file, label, entry, ['migrationId', 'featureId', 'file', 'type', 'status', 'phase', 'rollbackPlan', 'owner']);
    const appliesToTables = requireArrayField(result, file, label, entry, 'appliesToTables');
    requireArrayField(result, file, label, entry, 'verification');
    if (entry.dependsOn !== undefined && !Array.isArray(entry.dependsOn)) {
      addFailure(result, file, 'depends-on-array-required', `${entry.migrationId || label}.dependsOn must be an array`);
    }
    for (const dependsOn of dependencyIds(entry)) {
      if (!byMigrationId.has(dependsOn)) {
        addFailure(result, file, 'depends-on-missing', `${entry.migrationId || label} dependsOn unknown migrationId ${dependsOn}`);
      }
    }
    if (isValidationMigration(entry)) {
      if (!Array.isArray(entry.dependsOn) || entry.dependsOn.length === 0) {
        addFailure(result, file, 'validation-depends-on-missing', `${entry.migrationId || label} runtime validation must declare dependsOn`);
      }
      if (!entry.domainNote) {
        const dependencyTables = dependencyTableSet(entry, byMigrationId);
        for (const table of appliesToTables) {
          if (!dependencyTables.has(table)) {
            addFailure(result, file, 'validation-table-dependency-missing', `${entry.migrationId || label} validates ${table} but no dependsOn chain provides that table`);
          }
        }
      }
    }
    if (isBlockingMigration(entry)) {
      if (!pathExists(root, entry.file)) {
        addFailure(result, file, 'required-migration-missing', `${entry.migrationId || label} required migration file is missing: ${entry.file || ''}`);
      }
      if (isMarkdownFile(entry.file)) {
        addFailure(result, file, 'required-migration-not-executable', `${entry.migrationId || label} required migration file must not be markdown`);
      }
    } else if (entry.status === 'baseline' && isMarkdownFile(entry.file)) {
      addWarning(result, file, 'baseline-migration-document', `${entry.migrationId || label} is a non-blocking baseline markdown DDL document`);
    }
  }
  return result;
}

function isGenericEditPermission(permission) {
  return /(^|:)edit$/i.test(String(permission || '').trim());
}

function highRiskPermissionEntry(entry) {
  return /fund|stock|submit|approve|cancel|reverse|refund|claim|ship|scan|report|generate|status|settlement|migration/i
    .test(`${entry?.riskDomain || ''} ${entry?.api || ''}`);
}

export function validateHighRiskPermissionCoverage({ root = process.cwd() } = {}) {
  const result = emptyResult();
  const file = 'ai/registry/high-risk-permission-coverage.json';
  const data = readJsonResult(root, file, result);
  if (!data) {
    return result;
  }
  if (data.schemaVersion !== 1) {
    addFailure(result, file, 'invalid-schema-version', `${file} schemaVersion must be 1`);
  }
  if (!Array.isArray(data.entries)) {
    addFailure(result, file, 'entries-array-required', `${file} entries must be an array`);
    return result;
  }

  for (const [index, entry] of data.entries.entries()) {
    const label = `entries[${index}]`;
    requirePresentFields(result, file, label, entry, PERMISSION_FIELDS);
    requireNonBlankFields(result, file, label, entry, ['featureId', 'api', 'riskDomain', 'status']);
    requireArrayField(result, file, label, entry, 'tests');
    if (!HIGH_RISK_PERMISSION_STATUSES.has(entry.status)) {
      addFailure(result, file, 'invalid-permission-status', `${label} has invalid status ${entry.status || ''}`);
    }
    if (entry.status === 'required') {
      requireNonBlankFields(result, file, label, entry, ['backendPermission']);
      if (entry.hasFrontendAction === true) {
        requireNonBlankFields(result, file, label, entry, ['frontendPermission']);
      }
      if (highRiskPermissionEntry(entry) && isGenericEditPermission(entry.backendPermission)) {
        addFailure(result, file, 'generic-edit-permission', `${label} uses generic edit permission for high-risk API ${entry.api || ''}`);
      }
    }
    if (entry.status === 'deferred') {
      requireNonBlankFields(result, file, label, entry, ['deferredReason', 'phase', 'owner', 'trigger']);
      if (EMPTY_DEFERRED_REASON.test(entry.deferredReason || '')) {
        addFailure(result, file, 'empty-deferred-reason', `${label} has a non-actionable deferredReason`);
      }
    }
    checkTestFiles(root, result, file, label, entry.tests);
  }
  return result;
}

const CHECKS = {
  schemas: validateSchemaFiles,
  domains: validateHighRiskDomains,
  evidence: validateEvidenceFreshness,
  'contract-to-test': validateContractToTestMatrix,
  idempotency: validateIdempotencyRegistry,
  'state-machines': validateStateMachines,
  migration: validateMigrationGate,
  permissions: validateHighRiskPermissionCoverage
};

export function validateHighRiskGovernance({ root = process.cwd() } = {}) {
  return mergeResults(...Object.values(CHECKS).map((check) => check({ root })));
}

function parseSubcommand(args) {
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === '--root') {
      index += 1;
      continue;
    }
    if (!args[index].startsWith('--')) {
      return args[index];
    }
  }
  return 'all';
}

function runCli() {
  const args = process.argv.slice(2);
  const root = parseRootArg(args);
  const subcommand = parseSubcommand(args);
  if (subcommand === 'all') {
    let failed = false;
    for (const [name, check] of Object.entries(CHECKS)) {
      const ok = printIssues(`check:high-risk-governance:${name}`, check({ root }));
      failed = failed || !ok;
    }
    if (failed) {
      process.exitCode = 1;
    }
    return;
  }
  const check = CHECKS[subcommand];
  if (!check) {
    console.error(`Unknown high-risk governance subcommand: ${subcommand}`);
    console.error(`Known subcommands: all, ${Object.keys(CHECKS).join(', ')}`);
    process.exitCode = 1;
    return;
  }
  printIssues(`check:high-risk-governance:${subcommand}`, check({ root }));
}

if (process.argv[1] && process.argv[1].endsWith('high-risk-governance-checker.js')) {
  runCli();
}
