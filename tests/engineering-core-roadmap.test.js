import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { readJson } from '../tools/common.js';
import { validatePhaseGates } from '../tools/phase-gate-checker.js';
import { validateRoadmap } from '../tools/roadmap-checker.js';

function readText(file) {
  return fs.readFileSync(file, 'utf8');
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function completeBacklogExceptEngineering() {
  const ids = [
    'multi-role-review',
    'current-context',
    'doc-size',
    'read-budget',
    'context-pack',
    'file-weight',
    'roadmap-check',
    'phase-gate-check',
    'refactor-debt-check',
    'snapshot-contract',
    'state-machine-contract',
    'fund-boundary-contract'
  ];
  return {
    schemaVersion: 1,
    items: [
      ...ids.map((id) => ({ id, status: 'completed' })),
      { id: 'engineering-core-ready', status: 'required' }
    ]
  };
}

test('R-11 phase gates expose engineeringCoreReady and beforeSalesOrder depends on it', () => {
  const gates = readJson('ai/roadmap/phase-gates.json');
  assert.ok(gates.gates.engineeringCoreReady);
  assert.equal(gates.gates.engineeringCoreReady.status, 'blocked');
  assert.ok(gates.gates.beforeSalesOrder.required.includes('engineering-core-ready'));
});

test('phase gate checker requires engineering-core-ready in beforeSalesOrder', () => {
  const gates = clone(readJson('ai/roadmap/phase-gates.json'));
  gates.gates.beforeSalesOrder.required = gates.gates.beforeSalesOrder.required
    .filter((id) => id !== 'engineering-core-ready');
  const errors = validatePhaseGates({
    readJsonFile(file) {
      if (file === 'ai/roadmap/phase-gates.json') return gates;
      if (file === 'ai/changes/CURRENT_CHANGE.json') return { current: 'CR-TEST' };
      if (file === 'ai/changes/CR-TEST/impact.json') return { mode: 'rule-change' };
      if (file === 'ai/roadmap/enhancement-backlog.json') return completeBacklogExceptEngineering();
      throw new Error(`unexpected read ${file}`);
    },
    changedFiles: []
  });
  assert.ok(errors.some((error) => error.includes('beforeSalesOrder.required must include engineering-core-ready')));
});

test('sales-order implementation remains blocked when engineering core is incomplete', () => {
  const gates = clone(readJson('ai/roadmap/phase-gates.json'));
  if (!gates.gates.beforeSalesOrder.required.includes('engineering-core-ready')) {
    gates.gates.beforeSalesOrder.required.push('engineering-core-ready');
  }
  const errors = validatePhaseGates({
    readJsonFile(file) {
      if (file === 'ai/roadmap/phase-gates.json') return gates;
      if (file === 'ai/changes/CURRENT_CHANGE.json') return { current: 'CR-TEST' };
      if (file === 'ai/changes/CR-TEST/impact.json') return { mode: 'update', feature: { id: 'sales-order' } };
      if (file === 'ai/roadmap/enhancement-backlog.json') return completeBacklogExceptEngineering();
      throw new Error(`unexpected read ${file}`);
    },
    readTextFile: () => '',
    changedFiles: ['ruoyi-business/src/main/java/com/ruoyi/business/salesorder/SalesOrder.java']
  });
  assert.ok(errors.some((error) => error.includes('engineering-core-ready')));
});

test('roadmap checker requires every engineering-core readiness item', () => {
  const backlog = clone(readJson('ai/roadmap/enhancement-backlog.json'));
  const requiredIds = [
    'engineering-core-contracts',
    'engineering-core-runtime-migration',
    'field-library-ready',
    'process-plan-ready',
    'calculation-io-ready',
    'version-release-ready',
    'golden-sample-baseline',
    'engineering-core-reverse-review',
    'engineering-core-ready'
  ];
  for (const id of requiredIds) {
    assert.ok(backlog.items.some((item) => item.id === id), `missing ${id}`);
  }
  const missing = clone(backlog);
  missing.items = missing.items.filter((item) => item.id !== 'engineering-core-ready');
  const errors = validateRoadmap({ readJsonFile: () => missing });
  assert.ok(errors.some((error) => error.includes('engineering-core-ready')));
});

test('engineering-core contract package covers all R-11 objects and reverse checks', () => {
  const index = readText('ai/contracts/engineering-core.index.md');
  const domain = readText('ai/contracts/engineering-core.domain.md');
  const calculation = readText('ai/contracts/engineering-core.calculation-io.md');
  const versions = readText('ai/contracts/engineering-core.version-release.md');
  const migration = readText('ai/contracts/engineering-core.migration-plan.md');
  const golden = readText('ai/contracts/engineering-core.golden-samples.md');
  const matrix = readText('ai/contracts/engineering-core.contract-test-matrix.md');

  for (const value of ['ProductModel', 'OptionSet', 'OptionValue', 'FieldDefinition', 'FieldSchemeVersion', 'ProcessPlanVersion']) {
    assert.match(domain, new RegExp(value));
  }
  for (const owner of ['SALES', 'TECH', 'SYSTEM']) {
    assert.match(domain, new RegExp(`\\b${owner}\\b`));
  }
  assert.match(calculation, /EngineeringCalculationInput/);
  assert.match(calculation, /EngineeringDecompositionOutput/);
  for (const artifact of ['OrderVersion', 'TechnicalVersion', 'CalculationSnapshot', 'TechnicalReleasePackage', 'ProductionReleaseVersion']) {
    assert.match(versions, new RegExp(artifact));
  }
  for (const surface of ['masterdata_product_model', 'masterdata_sales_option_category', '/business/masterdata/{resource}', 'tests/masterdata-runtime.test.js']) {
    assert.ok(migration.includes(surface));
  }
  assert.match(golden, /GS-9CM-SINGLE-001/);
  assert.match(golden, /GS-9CM-DOUBLE-GRID-SPLICE-001/);
  assert.match(golden, /PM-DOOR-9CM/);
  assert.match(index, /beforeSalesOrder.*engineering-core-ready/s);
  assert.match(matrix, /Formula and DXF integrations/);
});
