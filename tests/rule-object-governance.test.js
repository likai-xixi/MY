import test from 'node:test';
import assert from 'node:assert/strict';
import { readJson } from '../tools/common.js';
import { validateRuleObjects } from '../tools/rule-object-checker.js';
import { buildRulePreflight } from '../scripts/rule-change-preflight.js';

const REQUIRED_OBJECTS = [
  'customer-fund-deposit-entry',
  'customer-sample-rebate-generation',
  'public-customer-invariant',
  'before-sales-order-phase-gate'
];

function validRegistry(overrides = {}) {
  const registry = readJson('ai/registry/rule-objects.json');
  return {
    ...registry,
    ...overrides,
    objects: overrides.objects || registry.objects.map((object) => ({ ...object }))
  };
}

function fakeReader({ registry = validRegistry(), features = { schemaVersion: 1, features: [{ id: 'customer', status: 'active' }, { id: 'platform', status: 'active' }] } } = {}) {
  return (file) => {
    if (file === 'ai/registry/rule-objects.json') {
      return registry;
    }
    if (file === 'ai/registry/features.json') {
      return features;
    }
    if (file === 'ai/changes/CURRENT_CHANGE.json') {
      return { schemaVersion: 1, current: 'CR-TEST' };
    }
    if (file === 'ai/roadmap/phase-gates.json') {
      return readJson(file);
    }
    if (file === 'ai/roadmap/enhancement-backlog.json') {
      return readJson(file);
    }
    throw new Error(`unexpected read ${file}`);
  };
}

test('package scripts wire rule object checker into npm run check without a parallel sales-order gate', () => {
  const pkg = readJson('package.json');
  assert.equal(pkg.scripts['check:rule-objects'], 'node tools/rule-object-checker.js');
  assert.equal(pkg.scripts['rule:preflight'], 'node scripts/rule-change-preflight.js');
  assert.ok(pkg.scripts.check.includes('npm run check:rule-objects'));
  assert.equal(pkg.scripts['check:sales-order-gate'], undefined);
});

test('rule object registry contains the first R-09A objects and passes real validation', () => {
  const registry = readJson('ai/registry/rule-objects.json');
  const ids = registry.objects.map((object) => object.id);
  for (const id of REQUIRED_OBJECTS) {
    assert.ok(ids.includes(id), `missing rule object ${id}`);
  }
  assert.deepEqual(validateRuleObjects(), []);
});

test('rule object checker blocks invalid schema, duplicate ids, unknown owners, and missing files', () => {
  const registry = validRegistry();
  registry.schemaVersion = 2;
  registry.objects[0].id = registry.objects[1].id;
  registry.objects[0].ownerFeature = 'missing-feature';
  registry.objects[0].sourceContracts = ['missing-contract.md'];
  registry.objects[0].ownedFiles = ['missing-owned-file.js'];
  registry.objects[0].tests = ['missing-test.js'];

  const errors = validateRuleObjects({
    readJsonFile: fakeReader({ registry }),
    exists: (file) => !String(file).startsWith('missing-')
  });

  assert.ok(errors.some((error) => error.includes('schemaVersion must be 1')));
  assert.ok(errors.some((error) => error.includes('duplicate object id')));
  assert.ok(errors.some((error) => error.includes('ownerFeature missing-feature')));
  assert.ok(errors.some((error) => error.includes('sourceContracts references missing file missing-contract.md')));
  assert.ok(errors.some((error) => error.includes('ownedFiles references missing file missing-owned-file.js')));
  assert.ok(errors.some((error) => error.includes('tests references missing file missing-test.js')));
});

test('rule object checker blocks invalid lifecycle, blocking mode, and published metadata gaps', () => {
  const registry = validRegistry();
  registry.objects[0].lifecycleStatus = 'ready';
  registry.objects[0].blockingMode = 'hard';
  registry.objects[1].version = '';
  registry.objects[1].changePolicy = {};

  const errors = validateRuleObjects({
    readJsonFile: fakeReader({ registry }),
    exists: () => true
  });

  assert.ok(errors.some((error) => error.includes('invalid lifecycleStatus ready')));
  assert.ok(errors.some((error) => error.includes('invalid blockingMode hard')));
  assert.ok(errors.some((error) => error.includes('must include version')));
  assert.ok(errors.some((error) => error.includes('must include changePolicy')));
});

test('rule object checker blocks unknown and one-way supersede relationships', () => {
  const unknownRegistry = validRegistry();
  unknownRegistry.objects[0].supersedes = ['missing-rule'];
  unknownRegistry.objects[1].supersededBy = ['missing-rule'];
  const unknownErrors = validateRuleObjects({
    readJsonFile: fakeReader({ registry: unknownRegistry }),
    exists: () => true
  });
  assert.ok(unknownErrors.some((error) => error.includes('supersedes unknown object missing-rule')));
  assert.ok(unknownErrors.some((error) => error.includes('supersededBy references unknown object missing-rule')));

  const oneWayRegistry = validRegistry();
  oneWayRegistry.objects[0].supersedes = [oneWayRegistry.objects[1].id];
  const oneWayErrors = validateRuleObjects({
    readJsonFile: fakeReader({ registry: oneWayRegistry }),
    exists: () => true
  });
  assert.ok(oneWayErrors.some((error) => error.includes('supersede relationship must be bidirectional')));
});

test('rule preflight renders lifecycle, references, tests, snapshot policy, and gate state', () => {
  const { text, errors, warnings } = buildRulePreflight({
    ids: ['before-sales-order-phase-gate'],
    readJsonFile: fakeReader(),
    exists: () => true,
    validate: () => []
  });

  assert.deepEqual(errors, []);
  assert.deepEqual(warnings, []);
  assert.ok(text.includes('Current change: `CR-TEST`'));
  assert.ok(text.includes('### before-sales-order-phase-gate'));
  assert.ok(text.includes('Lifecycle: `published`'));
  assert.ok(text.includes('Blocking mode: `blocking`'));
  assert.ok(text.includes('Source contracts:'));
  assert.ok(text.includes('Tests:'));
  assert.ok(text.includes('Snapshot policy'));
  assert.ok(text.includes('beforeSalesOrder: `blocked`'));
});
