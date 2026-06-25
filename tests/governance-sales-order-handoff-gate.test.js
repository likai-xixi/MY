import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { readJson } from '../tools/common.js';
import { buildCurrentContext } from '../scripts/context-build.js';
import { filterChangedFileRecords } from '../scripts/finalize-change.js';
import { validateContextPack } from '../tools/context-pack-checker.js';
import { validateDocSize } from '../tools/doc-size-checker.js';
import { validateFileWeight } from '../tools/file-weight-checker.js';
import { validatePhaseGates } from '../tools/phase-gate-checker.js';
import { validateReadBudget } from '../tools/read-budget-checker.js';
import { validateRefactorDebt } from '../tools/refactor-debt-checker.js';
import { validateReviewDirectory, validateReviews } from '../tools/review-checker.js';
import { validateRoadmap } from '../tools/roadmap-checker.js';

function readText(file) {
  return readFileSync(file, 'utf8');
}

function fakeStats(kind) {
  return {
    isDirectory: () => kind === 'directory',
    isFile: () => kind === 'file'
  };
}

function writeReviewPackage(directory, { allowImplementation = false } = {}) {
  fs.mkdirSync(directory, { recursive: true });
  const files = {
    'request.md': '# Request\n\nFeature pre-review: sales order\n',
    'context.md': '# Context\n\nbounded context\n',
    'product-review.md': '# Product Review\n\nnot empty\n',
    'architecture-review.md': '# Architecture Review\n\nnot empty\n',
    'backend-review.md': '# Backend Review\n\nnot empty\n',
    'frontend-review.md': '# Frontend Review\n\nnot empty\n',
    'qa-review.md': '# QA Review\n\nnot empty\n',
    'risk-register.md': '# Risk Register\n\nnot empty\n',
    'decision.md': allowImplementation
      ? '# Decision\n\nAllow Implementation\n'
      : '# Decision\n\nImplementation blocked.\n',
    'review.json': JSON.stringify({
      id: path.basename(directory),
      request: 'Feature pre-review: sales order',
      mode: 'pre-review',
      feature: 'sales-order',
      createdAt: '2026-06-24T00:00:00.000Z',
      status: allowImplementation ? 'approved' : 'pending-decision',
      decision: { allowImplementation },
      requiredFiles: []
    }, null, 2)
  };
  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(directory, name), `${content}\n`);
  }
}

test('package scripts wire sales-order handoff governance checks into npm run check', () => {
  const pkg = readJson('package.json');
  const expectedScripts = {
    'review:feature': 'node scripts/review-feature.js',
    'context:build': 'node scripts/context-build.js',
    'check:review': 'node tools/review-checker.js --require-allow',
    'check:doc-size': 'node tools/doc-size-checker.js',
    'check:context-pack': 'node tools/context-pack-checker.js',
    'check:read-budget': 'node tools/read-budget-checker.js',
    'check:file-weight': 'node tools/file-weight-checker.js',
    'check:roadmap': 'node tools/roadmap-checker.js',
    'check:phase-gate': 'node tools/phase-gate-checker.js',
    'check:refactor-debt': 'node tools/refactor-debt-checker.js'
  };

  for (const [script, command] of Object.entries(expectedScripts)) {
    assert.equal(pkg.scripts[script], command);
    if (script.startsWith('check:')) {
      assert.ok(pkg.scripts.check.includes(`npm run ${script}`), `npm run check must include ${script}`);
    }
  }
});

test('AGENTS includes discussion, pre-review, current-context, and governance/business boundary rules', () => {
  const text = readText('AGENTS.md');
  for (const phrase of [
    '功能讨论',
    '功能预审',
    'current-context',
    'Allow Implementation',
    'Business change 不允许改治理规则',
    '治理 change 不允许改业务代码',
    'beforeSalesOrder'
  ]) {
    assert.ok(text.includes(phrase), `AGENTS.md missing ${phrase}`);
  }
});

test('roadmap, phase gates, and refactor debt structures are valid', () => {
  assert.deepEqual(validateRoadmap(), []);
  assert.deepEqual(validatePhaseGates({ changedFiles: ['ai/roadmap/module-evolution/sales-order.md'] }), []);
  assert.deepEqual(validateRefactorDebt(), []);
});

test('context build is idempotent and generated context passes context/read-budget checks', () => {
  assert.deepEqual(buildCurrentContext({ feature: 'customer', checkMode: true }), []);
  assert.deepEqual(validateContextPack(), []);
  assert.deepEqual(validateReadBudget(), []);
});

test('review checker detects missing files, missing decision, and missing Allow Implementation', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-review-check-'));
  try {
    const missingDir = path.join(root, 'RV-MISSING');
    fs.mkdirSync(missingDir);
    fs.writeFileSync(path.join(missingDir, 'request.md'), '# Request\n\n功能预审：销售订单\n');
    const missingErrors = validateReviewDirectory({ directory: missingDir, requireAllow: true });
    assert.ok(missingErrors.some((error) => error.includes('decision.md is missing')));

    const blockedDir = path.join(root, 'RV-BLOCKED');
    fs.mkdirSync(blockedDir);
    const files = {
      'request.md': '# Request\n\n功能预审：销售订单\n',
      'context.md': '# Context\n\nbounded context\n',
      'product-review.md': '# Product Review\n\nnot empty\n',
      'architecture-review.md': '# Architecture Review\n\nnot empty\n',
      'backend-review.md': '# Backend Review\n\nnot empty\n',
      'frontend-review.md': '# Frontend Review\n\nnot empty\n',
      'qa-review.md': '# QA Review\n\nnot empty\n',
      'risk-register.md': '# Risk Register\n\nnot empty\n',
      'decision.md': '# Decision\n\nImplementation blocked.\n',
      'review.json': JSON.stringify({
        id: 'RV-BLOCKED',
        request: '功能预审：销售订单',
        mode: 'pre-review',
        feature: 'customer',
        createdAt: '2026-06-24T00:00:00.000Z',
        status: 'pending-decision',
        decision: { allowImplementation: false },
        requiredFiles: []
      }, null, 2)
    };
    for (const [name, content] of Object.entries(files)) {
      fs.writeFileSync(path.join(blockedDir, name), `${content}\n`);
    }
    const blockedErrors = validateReviewDirectory({ directory: blockedDir, requireAllow: true });
    assert.ok(blockedErrors.some((error) => error.includes('missing Allow Implementation')));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('context-aware review gate does not require Allow Implementation for governance and non-implementation changes', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-review-context-safe-'));
  try {
    writeReviewPackage(path.join(root, 'RV-BLOCKED'), { allowImplementation: false });
    const errors = validateReviews({
      root,
      requireAllow: true,
      impact: { schemaVersion: 1, mode: 'rule-change', changeType: 'governance/rule-change' },
      changedFiles: [
        'tools/review-checker.js',
        'docs/multi-role-review-workflow.md',
        'ai/context/current-context.md',
        'ai/reviews/RV-BLOCKED/decision.md',
        'memory/HANDOVER.md'
      ]
    });
    assert.deepEqual(errors, []);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('context-aware review gate requires a review package for business implementation paths', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-review-missing-'));
  try {
    const errors = validateReviews({
      root,
      requireAllow: true,
      impact: { schemaVersion: 1, mode: 'update', feature: { id: 'customer' } },
      changedFiles: ['ruoyi-business/src/main/java/com/ruoyi/business/customer/service/impl/CustomerServiceImpl.java']
    });
    assert.ok(errors.some((error) => error.includes('requires an ai/reviews/RV-* review package')));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('context-aware review gate rejects business implementation without Allow Implementation', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-review-blocked-'));
  try {
    writeReviewPackage(path.join(root, 'RV-BLOCKED'), { allowImplementation: false });
    const errors = validateReviews({
      root,
      requireAllow: true,
      impact: { schemaVersion: 1, mode: 'add-feature', feature: { id: 'customer' } },
      changedFiles: [
        'ruoyi-admin/src/main/java/com/ruoyi/web/controller/business/customer/CustomerController.java',
        'ruoyi-ui/src/views/customer/index.vue',
        'ruoyi-ui/src/api/customer.js',
        'sql/customer.ownership.md'
      ]
    });
    assert.ok(errors.some((error) => error.includes('missing Allow Implementation')));
    assert.ok(errors.some((error) => error.includes('requires review decision.md to contain Allow Implementation')));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('context-aware review gate accepts business implementation with Allow Implementation', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-review-allowed-'));
  try {
    writeReviewPackage(path.join(root, 'RV-ALLOWED'), { allowImplementation: true });
    const errors = validateReviews({
      root,
      requireAllow: true,
      impact: { schemaVersion: 1, mode: 'update', feature: { id: 'customer' } },
      changedFiles: ['ruoyi-business/src/main/resources/mapper/customer/CustomerMapper.xml']
    });
    assert.deepEqual(errors, []);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('doc-size, read-budget, context-pack, and file-weight checkers run on real files', () => {
  assert.deepEqual(validateDocSize(), []);
  assert.deepEqual(validateReadBudget(), []);
  assert.deepEqual(validateContextPack(), []);
  assert.deepEqual(validateFileWeight({ changedFiles: ['tools/file-weight-checker.js'] }).errors, []);
});

test('file-weight checker skips directory entries without EISDIR', () => {
  let result;
  assert.doesNotThrow(() => {
    result = validateFileWeight({
      changedFiles: ['docs', 'tools/file-weight-checker.js'],
      statFile: (file) => file === 'docs' ? fakeStats('directory') : fakeStats('file'),
      readTextFile: () => 'export function ok() {}\n'
    });
  });
  assert.deepEqual(result.errors, []);
  assert.ok(result.warnings.some((warning) => warning.includes('docs is a directory listed as changed')));
});

test('file-weight checker skips missing deleted files', () => {
  const result = validateFileWeight({
    changedFiles: ['tmp/missing/DeletedService.java'],
    statFile: () => {
      const error = new Error('missing');
      error.code = 'ENOENT';
      throw error;
    }
  });
  assert.deepEqual(result.errors, []);
});

test('file-weight checker still detects overweight real files when directories are present', () => {
  const result = validateFileWeight({
    changedFiles: ['docs', 'src/HugeService.java'],
    statFile: (file) => file === 'docs' ? fakeStats('directory') : fakeStats('file'),
    readTextFile: () => `${Array.from({ length: 1201 }, (_, index) => `// line ${index + 1}`).join('\n')}\n`
  });

  assert.ok(result.warnings.some((warning) => warning.includes('docs is a directory listed as changed')));
  assert.ok(result.errors.some((error) => error.includes('src/HugeService.java is a changed Java Service')));
});

test('finalize changed-files filtering removes directories and preserves file paths', () => {
  const filtered = filterChangedFileRecords([
    'tools',
    'tools/file-weight-checker.js',
    'tmp/missing/DeletedService.java'
  ]);
  assert.deepEqual(filtered, [
    'tmp/missing/DeletedService.java',
    'tools/file-weight-checker.js'
  ]);
});

test('beforeSalesOrder gate blocks actual sales-order implementation paths while incomplete', () => {
  const readJsonFile = (file) => {
    if (file === 'ai/roadmap/phase-gates.json') {
      return readJson(file);
    }
    if (file === 'ai/roadmap/enhancement-backlog.json') {
      return readJson(file);
    }
    if (file === 'ai/changes/CURRENT_CHANGE.json') {
      return { current: 'CR-TEST' };
    }
    if (file === 'ai/changes/CR-TEST/impact.json') {
      return { schemaVersion: 1, mode: 'add-feature', feature: { id: 'sales-order' } };
    }
    throw new Error(`unexpected read ${file}`);
  };

  const errors = validatePhaseGates({
    readJsonFile,
    changedFiles: ['ruoyi-business/src/main/java/com/ruoyi/business/salesorder/SalesOrderService.java']
  });
  assert.ok(errors.some((error) => error.includes('sales-order implementation is blocked')));
});

test('beforeSalesOrder gate blocks sales-order implementation naming variants', () => {
  const readJsonFile = (file) => {
    if (file === 'ai/roadmap/phase-gates.json') {
      return readJson(file);
    }
    if (file === 'ai/roadmap/enhancement-backlog.json') {
      return readJson(file);
    }
    if (file === 'ai/changes/CURRENT_CHANGE.json') {
      return { current: 'CR-TEST' };
    }
    if (file === 'ai/changes/CR-TEST/impact.json') {
      return { schemaVersion: 1, mode: 'rule-change', noSalesOrderImplementation: true };
    }
    throw new Error(`unexpected read ${file}`);
  };

  const blockedPaths = [
    'ruoyi-business/src/main/java/com/ruoyi/business/sales-order/SalesOrderService.java',
    'ruoyi-business/src/main/java/com/ruoyi/business/salesOrder/SalesOrderService.java',
    'ruoyi-admin/src/main/java/com/ruoyi/web/controller/business/salesOrder/SalesOrderController.java',
    'ruoyi-business/src/main/resources/mapper/business/sales_order/SalesOrderMapper.xml',
    'ruoyi-ui/src/views/salesorder/index.vue',
    'ruoyi-ui/src/views/sales/order/index.vue',
    'ruoyi-ui/src/api/salesOrder.js',
    'sql/sales_order_init.sql'
  ];

  for (const file of blockedPaths) {
    const errors = validatePhaseGates({ readJsonFile, changedFiles: [file] });
    assert.ok(errors.some((error) => error.includes('sales-order implementation is blocked')), `${file} should be blocked`);
  }

  assert.deepEqual(validatePhaseGates({ readJsonFile, changedFiles: ['ai/roadmap/module-evolution/sales-order.md'] }), []);
});
