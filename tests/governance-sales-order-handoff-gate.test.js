import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { readJson } from '../tools/common.js';
import { buildMarkdown, deriveContextFeature } from '../scripts/context-build.js';
import { filterChangedFileRecords, resolveFinalizedChangedFiles } from '../scripts/finalize-change.js';
import { validateContextPack } from '../tools/context-pack-checker.js';
import { validateDocSize } from '../tools/doc-size-checker.js';
import { gitChangedFiles } from '../tools/diff-checker.js';
import { validateFileWeight } from '../tools/file-weight-checker.js';
import { validatePhaseGates } from '../tools/phase-gate-checker.js';
import { validateReadBudget } from '../tools/read-budget-checker.js';
import { validateRefactorDebt } from '../tools/refactor-debt-checker.js';
import {
  isBusinessImplementationPath,
  validateContextOverrideReview,
  validateReviewCommittedAtBase,
  validateReviewDirectory,
  validateReviews
} from '../tools/review-checker.js';
import { validateRoadmap } from '../tools/roadmap-checker.js';
import { validateFeatureTestOwnership } from '../tools/feature-test-ownership-checker.js';

function readText(file) {
  return readFileSync(file, 'utf8');
}

function fakeStats(kind) {
  return {
    isDirectory: () => kind === 'directory',
    isFile: () => kind === 'file'
  };
}

function writeReviewPackage(directory, {
  allowImplementation = false,
  feature = 'customer',
  approvedFeatures = [feature],
  approvedEditRoots = ['ruoyi-business/src/main/java/com/ruoyi/business/customer'],
  baseRevision = ''
} = {}) {
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
      ? '# Decision\n\nDecision: Allow Implementation\n'
      : '# Decision\n\nImplementation blocked.\n',
    'review.json': JSON.stringify({
      id: path.basename(directory),
      request: 'Feature pre-review: sales order',
      mode: 'pre-review',
      feature,
      ...(baseRevision ? { baseRevision } : {}),
      createdAt: '2026-06-24T00:00:00.000Z',
      status: allowImplementation ? 'approved' : 'pending-decision',
      approvedFeatures,
      approvedEditRoots,
      approvedEditRootsReason: 'The review explicitly limits implementation to these roots.',
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

test('context build derives the active feature instead of hardcoding customer', () => {
  assert.equal(deriveContextFeature({ impact: { feature: { id: 'platform' } } }), 'platform');
  assert.equal(deriveContextFeature({
    impact: {
      feature: { id: 'platform' },
      reviewId: 'RV-APPROVED',
      contextFeatureOverride: { feature: 'customer', reason: 'Focused customer contract review.' }
    },
    readJsonFile: () => ({
      status: 'approved',
      decision: { allowImplementation: true },
      approvedFeatures: ['platform', 'customer']
    }),
    validateContextOverrideReviewFn: () => []
  }), 'customer');
  assert.equal(deriveContextFeature({
    impact: {
      feature: { id: 'platform' },
      contextFeatureOverride: { feature: 'customer', reason: 'x' }
    }
  }), 'platform');
  assert.deepEqual(validateReadBudget(), []);
});

test('context build rejects an override approved by a review changed in the same Git range', () => {
  const impact = {
    feature: { id: 'platform' },
    baseRevision: 'a'.repeat(40),
    reviewId: 'RV-APPROVED',
    contextFeatureOverride: { feature: 'customer', reason: 'Focused customer review.' }
  };
  assert.equal(deriveContextFeature({
    feature: 'customer',
    impact,
    changedFiles: ['ai/reviews/RV-APPROVED/review.json'],
    readJsonFile: () => ({
      id: 'RV-APPROVED',
      baseRevision: '9'.repeat(40),
      status: 'approved',
      decision: { allowImplementation: true },
      approvedFeatures: ['platform', 'customer']
    }),
    contextOverrideValidation: {
      validateBaseRevisionFn: () => [],
      validateRevisionBindingFn: () => [],
      validateReviewBaseFn: () => []
    }
  }), 'platform');
});

test('context build requires a fixed impact base and a review committed at that base', () => {
  const impact = {
    feature: { id: 'platform' },
    baseRevision: 'a'.repeat(40),
    reviewId: 'RV-APPROVED',
    contextFeatureOverride: { feature: 'customer', reason: 'Focused customer review.' }
  };
  const review = {
    id: 'RV-APPROVED',
    baseRevision: '9'.repeat(40),
    status: 'approved',
    decision: { allowImplementation: true },
    approvedFeatures: ['platform', 'customer']
  };
  const derive = (contextOverrideValidation) => deriveContextFeature({
    feature: 'customer',
    impact,
    changedFiles: [],
    readJsonFile: () => review,
    contextOverrideValidation
  });

  assert.equal(derive({
    validateBaseRevisionFn: () => ['impact.baseRevision must be fixed'],
    validateRevisionBindingFn: () => [],
    validateReviewBaseFn: () => []
  }), 'platform');
  assert.equal(derive({
    validateBaseRevisionFn: () => [],
    validateRevisionBindingFn: () => [],
    validateReviewBaseFn: () => ['review package is not committed at impact.baseRevision']
  }), 'platform');
  assert.equal(derive({
    validateBaseRevisionFn: () => [],
    validateRevisionBindingFn: () => [],
    validateReviewBaseFn: () => [],
    validateReviewPackageFn: () => []
  }), 'customer');
});

test('context feature override rejects a review whose JSON approves but decision.md blocks implementation', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-context-override-review-'));
  try {
    const reviewId = 'RV-CONTRADICTORY';
    const directory = path.join(root, reviewId);
    writeReviewPackage(directory, {
      allowImplementation: true,
      feature: 'platform',
      approvedFeatures: ['platform', 'customer'],
      approvedEditRoots: ['tools'],
      baseRevision: '9'.repeat(40)
    });
    fs.writeFileSync(path.join(directory, 'decision.md'), '# Decision\n\nImplementation blocked.\n');

    const errors = validateContextOverrideReview({
      impact: {
        feature: { id: 'platform' },
        baseRevision: 'a'.repeat(40),
        reviewId,
        contextFeatureOverride: { feature: 'customer', reason: 'Focused customer review.' }
      },
      requestedFeature: 'customer',
      changedFiles: [],
      reviewsRootPath: root,
      readJsonFile: (file) => JSON.parse(fs.readFileSync(path.join(root, file.replace('ai/reviews/', '')), 'utf8')),
      validateBaseRevisionFn: () => [],
      validateRevisionBindingFn: () => [],
      validateReviewBaseFn: () => []
    });

    assert.ok(errors.some((error) => error.includes('decision.md is missing Allow Implementation')));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('context pack rejects stale current change, feature, and edit-root bindings', () => {
  const context = {
    currentFeature: 'customer',
    currentChange: 'CR-OLD',
    allowedEditRoots: ['sql'],
    forbiddenEditRoots: [],
    mustReadFiles: [],
    mustNotBreak: [],
    roadmapBlockers: [],
    phaseGates: {},
    refactorDebt: [],
    verificationCommands: [],
    nextSteps: []
  };
  const readJsonFile = (file) => {
    if (file === 'ai/context/current-context.json') return context;
    if (file === 'ai/changes/CURRENT_CHANGE.json') return { current: 'CR-NEW' };
    if (file === 'ai/changes/CR-NEW/impact.json') {
      return {
        feature: { id: 'platform' },
        allowedEditRoots: ['tools'],
        forbiddenEditRoots: ['sql']
      };
    }
    if (file === 'ai/registry/features.json') {
      return { features: [{ id: 'platform', status: 'active' }] };
    }
    throw new Error(`unexpected read ${file}`);
  };
  const errors = validateContextPack({ readFile: () => '# Current Context\n', readJsonFile });
  assert.ok(errors.some((error) => error.includes('currentChange')));
  assert.ok(errors.some((error) => error.includes('currentFeature')));
  assert.ok(errors.some((error) => error.includes('allowedEditRoots')));
  assert.ok(errors.some((error) => error.includes('forbiddenEditRoots')));
});

test('context pack rejects missing must-read files and Windows absolute paths', () => {
  const context = {
    currentFeature: 'platform',
    currentChange: 'CR-NEW',
    allowedEditRoots: ['tools'],
    forbiddenEditRoots: ['sql'],
    mustReadFiles: [{ path: 'ai/context/features/platform.md', reason: 'Focused context.' }],
    mustNotBreak: [],
    roadmapBlockers: [],
    phaseGates: {},
    refactorDebt: [],
    verificationCommands: [],
    nextSteps: []
  };
  const errors = validateContextPack({
    readFile: () => '# Current Context\n\nWorkspace D:/Project/MY must stay local.\n',
    readJsonFile: () => context,
    bindActiveContext: false,
    fileIsFile: () => false
  });
  assert.ok(errors.some((error) => error.includes('missing or non-file')));
  assert.ok(errors.some((error) => error.includes('absolute workspace paths')));

  context.mustReadFiles = [{ path: 'D:\\Project\\MY\\AGENTS.md', reason: 'Unsafe absolute path.' }];
  const absoluteErrors = validateContextPack({
    readFile: () => '# Current Context\n',
    readJsonFile: () => context,
    bindActiveContext: false,
    fileIsFile: () => true
  });
  assert.ok(absoluteErrors.some((error) => error.includes('repository-relative')));
});

test('context pack rejects Markdown facts that drift from the generated JSON context', () => {
  const context = {
    currentFeature: 'platform',
    currentChange: 'CR-NEW',
    repositoryProfile: { adapter: 'ruoyi', locked: true, stack: 'RuoYi + Vue3 + Codex Auto Dev OS' },
    allowedEditRoots: ['tools'],
    forbiddenEditRoots: ['sql'],
    mustReadFiles: [{ path: 'AGENTS.md', reason: 'Workflow contract.' }],
    mustNotBreak: [],
    roadmapBlockers: [],
    phaseGates: {},
    refactorDebt: [],
    verificationCommands: [],
    nextSteps: []
  };
  const staleMarkdown = buildMarkdown({
    ...context,
    currentFeature: 'customer',
    allowedEditRoots: ['/'],
    mustReadFiles: [{ path: 'README.md', reason: 'Stale context.' }]
  });
  const errors = validateContextPack({
    readFile: () => staleMarkdown,
    readJsonFile: () => context,
    bindActiveContext: false,
    fileIsFile: () => true
  });
  assert.ok(errors.some((error) => error.includes('must exactly match current-context.json')));
});

test('context pack rejects jointly forged JSON and Markdown must-read facts', () => {
  const context = {
    currentFeature: 'platform',
    currentChange: 'CR-NEW',
    repositoryProfile: { adapter: 'ruoyi', locked: true, stack: 'RuoYi + Vue3 + Codex Auto Dev OS' },
    allowedEditRoots: ['tools'],
    forbiddenEditRoots: ['sql'],
    mustReadFiles: [{ path: 'README.md', reason: 'Omits the required governance and active-change files.' }],
    mustNotBreak: [],
    roadmapBlockers: [],
    phaseGates: {},
    refactorDebt: [],
    verificationCommands: [],
    nextSteps: []
  };
  const errors = validateContextPack({
    readFile: () => buildMarkdown(context),
    readJsonFile: () => context,
    bindActiveContext: false,
    fileIsFile: () => true
  });
  assert.ok(errors.some((error) => error.includes('mustReadFiles must match the generated current context')));
});

test('context feature override requires a committed approved review feature set', () => {
  const context = {
    currentFeature: 'customer',
    currentChange: 'CR-NEW',
    allowedEditRoots: ['tools'],
    forbiddenEditRoots: ['sql'],
    mustReadFiles: [],
    mustNotBreak: [],
    roadmapBlockers: [],
    phaseGates: {},
    refactorDebt: [],
    verificationCommands: [],
    nextSteps: []
  };
  const impact = {
    feature: { id: 'platform' },
    reviewId: 'RV-APPROVED',
    contextFeatureOverride: { feature: 'customer', reason: 'Focused review.' },
    allowedEditRoots: ['tools'],
    forbiddenEditRoots: ['sql']
  };
  const readJsonFile = (file) => {
    if (file === 'ai/context/current-context.json') return context;
    if (file === 'ai/changes/CURRENT_CHANGE.json') return { current: 'CR-NEW' };
    if (file === 'ai/changes/CR-NEW/impact.json') return impact;
    if (file === 'ai/registry/features.json') return { features: [{ id: 'platform' }, { id: 'customer' }] };
    if (file === 'ai/reviews/RV-APPROVED/review.json') {
      return { status: 'approved', decision: { allowImplementation: true }, approvedFeatures: ['platform'] };
    }
    throw new Error(`unexpected read ${file}`);
  };
  const errors = validateContextPack({ readFile: () => '# Current Context\n', readJsonFile });
  assert.ok(errors.some((error) => error.includes('currentFeature')));

  impact.baseRevision = 'a'.repeat(40);
  context.currentFeature = 'customer';
  const sameRangeErrors = validateContextPack({
    readFile: () => buildMarkdown({
      ...context,
      repositoryProfile: { adapter: 'ruoyi', locked: true, stack: 'RuoYi + Vue3 + Codex Auto Dev OS' }
    }),
    readJsonFile: (file) => {
      if (file === 'ai/context/current-context.json') return context;
      if (file === 'ai/changes/CURRENT_CHANGE.json') return { current: 'CR-NEW' };
      if (file === 'ai/changes/CR-NEW/impact.json') return impact;
      if (file === 'ai/registry/features.json') return { features: [{ id: 'platform' }, { id: 'customer' }] };
      if (file === 'ai/reviews/RV-APPROVED/review.json') {
        return {
          id: 'RV-APPROVED',
          baseRevision: '9'.repeat(40),
          status: 'approved',
          decision: { allowImplementation: true },
          approvedFeatures: ['platform', 'customer']
        };
      }
      throw new Error(`unexpected read ${file}`);
    },
    contextOverrideValidation: {
      changedFiles: ['ai/reviews/RV-APPROVED/review.json'],
      validateBaseRevisionFn: () => [],
      validateRevisionBindingFn: () => [],
      validateReviewBaseFn: () => []
    }
  });
  assert.ok(sameRangeErrors.some((error) => error.includes('must not change in the same Git range')));
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
      impact: {
        schemaVersion: 1,
        mode: 'add-feature',
        baseRevision: 'base-revision',
        reviewId: 'RV-BLOCKED',
        feature: { id: 'customer' }
      },
      changedFiles: [
        'ruoyi-admin/src/main/java/com/ruoyi/web/controller/business/customer/CustomerController.java',
        'ruoyi-ui/src/views/customer/index.vue',
        'ruoyi-ui/src/api/customer.js',
        'sql/customer.ownership.md'
      ],
      validateBaseRevisionFn: () => []
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
    writeReviewPackage(path.join(root, 'RV-ALLOWED'), { allowImplementation: true, baseRevision: 'review-base' });
    const errors = validateReviews({
      root,
      requireAllow: true,
      impact: {
        schemaVersion: 1,
        mode: 'update',
        baseRevision: 'base-revision',
        reviewId: 'RV-ALLOWED',
        feature: { id: 'customer' }
      },
      changedFiles: ['ruoyi-business/src/main/java/com/ruoyi/business/customer/service/CustomerService.java'],
      validateBaseRevisionFn: () => [],
      validateRevisionBindingFn: () => [],
      validateReviewBaseFn: () => []
    });
    assert.deepEqual(errors, []);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('review gate binds the exact review id, feature, approved roots, and base revision', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-review-binding-'));
  try {
    writeReviewPackage(path.join(root, 'RV-ALLOWED'), { allowImplementation: true, baseRevision: 'review-base' });
    const changedFiles = ['ruoyi-business/src/main/java/com/ruoyi/business/customer/service/CustomerService.java'];
    const baseImpact = {
      schemaVersion: 1,
      mode: 'update',
      baseRevision: 'base-revision',
      reviewId: 'RV-ALLOWED',
      feature: { id: 'customer' }
    };

    const missingReview = validateReviews({
      root,
      requireAllow: true,
      impact: { ...baseImpact, reviewId: 'RV-DOES-NOT-EXIST' },
      changedFiles,
      validateBaseRevisionFn: () => [],
      validateRevisionBindingFn: () => [],
      validateReviewBaseFn: () => []
    });
    assert.ok(missingReview.some((error) => error.includes('RV-DOES-NOT-EXIST')));

    const featureMismatch = validateReviews({
      root,
      requireAllow: true,
      impact: { ...baseImpact, feature: { id: 'masterdata' } },
      changedFiles,
      validateBaseRevisionFn: () => [],
      validateRevisionBindingFn: () => [],
      validateReviewBaseFn: () => []
    });
    assert.ok(featureMismatch.some((error) => error.includes('approvedFeatures')));

    const rootMismatch = validateReviews({
      root,
      requireAllow: true,
      impact: baseImpact,
      changedFiles: ['ruoyi-business/src/main/resources/mapper/customer/CustomerMapper.xml'],
      validateBaseRevisionFn: () => [],
      validateRevisionBindingFn: () => [],
      validateReviewBaseFn: () => []
    });
    assert.ok(rootMismatch.some((error) => error.includes('approvedEditRoots')));

    writeReviewPackage(path.join(root, 'RV-DANGEROUS-ROOT'), {
      allowImplementation: true,
      approvedEditRoots: ['/'],
      baseRevision: 'review-base'
    });
    const dangerousReviewRoot = validateReviews({
      root,
      requireAllow: true,
      impact: { ...baseImpact, reviewId: 'RV-DANGEROUS-ROOT' },
      changedFiles,
      validateBaseRevisionFn: () => [],
      validateRevisionBindingFn: () => [],
      validateReviewBaseFn: () => []
    });
    assert.ok(dangerousReviewRoot.some((error) => error.includes('canonical repository-relative path')));

    const invalidBase = validateReviews({
      root,
      requireAllow: true,
      impact: baseImpact,
      changedFiles,
      validateBaseRevisionFn: () => ['baseRevision is not a commit'],
      validateRevisionBindingFn: () => [],
      validateReviewBaseFn: () => []
    });
    assert.ok(invalidBase.some((error) => error.includes('baseRevision is not a commit')));

    const invalidReviewBase = validateReviews({
      root,
      requireAllow: true,
      impact: baseImpact,
      changedFiles,
      validateBaseRevisionFn: () => [],
      validateRevisionBindingFn: () => ['review base is outside impact range'],
      validateReviewBaseFn: () => []
    });
    assert.ok(invalidReviewBase.some((error) => error.includes('review base is outside impact range')));

    writeReviewPackage(path.join(root, 'RV-MISSING-BASE'), { allowImplementation: true });
    const missingReviewBase = validateReviews({
      root,
      requireAllow: true,
      impact: { ...baseImpact, reviewId: 'RV-MISSING-BASE' },
      changedFiles,
      validateBaseRevisionFn: () => [],
      validateRevisionBindingFn: () => [],
      validateReviewBaseFn: () => []
    });
    assert.ok(missingReviewBase.some((error) => error.includes('baseRevision is required')));

    const selfApprovedReview = validateReviews({
      root,
      requireAllow: true,
      impact: baseImpact,
      changedFiles: [...changedFiles, 'ai/reviews/RV-ALLOWED/review.json'],
      validateBaseRevisionFn: () => [],
      validateRevisionBindingFn: () => [],
      validateReviewBaseFn: () => []
    });
    assert.ok(selfApprovedReview.some((error) => error.includes('must not change in the same Git range')));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('review gate requires the complete review package to predate implementation', () => {
  const calls = [];
  const errors = validateReviewCommittedAtBase({
    reviewId: 'RV-APPROVED',
    baseRevision: '1111111111111111111111111111111111111111',
    runGitResultFn: (args) => {
      calls.push(args);
      return { status: args.at(-1).endsWith(':ai/reviews/RV-APPROVED/qa-review.md') ? 1 : 0 };
    }
  });
  assert.equal(calls.length, 10);
  assert.ok(errors.some((error) => error.includes('qa-review.md must already exist')));
});

test('review gate recognizes runtime changes outside feature view/controller conventions', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-review-runtime-roots-'));
  try {
    writeReviewPackage(path.join(root, 'RV-SYSTEM'), {
      allowImplementation: true,
      feature: 'system',
      approvedEditRoots: ['ruoyi-ui/src/layout/components/HeaderNotice'],
      baseRevision: 'review-base'
    });
    const common = {
      root,
      requireAllow: true,
      validateBaseRevisionFn: () => [],
      validateRevisionBindingFn: () => [],
      validateReviewBaseFn: () => []
    };

    const missingSystemReview = validateReviews({
      ...common,
      impact: { mode: 'update', baseRevision: 'base', feature: { id: 'system' } },
      changedFiles: ['ruoyi-ui/src/layout/components/HeaderNotice/DetailView.vue']
    });
    assert.ok(missingSystemReview.some((error) => error.includes('impact.reviewId')));

    const missingPlatformReview = validateReviews({
      ...common,
      impact: { mode: 'update', baseRevision: 'base', feature: { id: 'platform' } },
      changedFiles: ['ruoyi-admin/src/main/resources/application-prod.yml']
    });
    assert.ok(missingPlatformReview.some((error) => error.includes('impact.reviewId')));

    for (const runtimeFile of [
      'backend/common/customer-runtime.ts',
      'backend/common/dist/customer-runtime.ts',
      'backend/common/node_modules/customer-runtime.ts',
      'backend/config/customer-runtime.yml',
      'backend/package.json',
      'frontend/src/components/CustomerRuntime.tsx',
      'frontend/src/dist/customer-runtime.ts',
      'frontend/src/node_modules/customer-runtime.ts',
      'frontend/public/customer-runtime.js',
      'frontend/index.html',
      'frontend/vite.config.mjs',
      'frontend/package.json',
      'ruoyi-ui/public/customer-runtime.js',
      'ruoyi-ui/src/dist/customer-runtime.js',
      'ruoyi-ui/src/node_modules/customer-runtime.js',
      'ruoyi-ui/index.html',
      'ruoyi-ui/vite.config.js',
      'ruoyi-ui/package.json',
      'ruoyi-business/src/main/kotlin/com/ruoyi/business/customer/CustomerRuntime.kt',
      'ruoyi-system/src/test/groovy/com/ruoyi/system/CustomerRuntimeSpec.groovy',
      'ruoyi-admin/src/main/webapp/customer-runtime.js',
      'ruoyi-system/src/main/java/com/ruoyi/system/service/CustomerPolicyService.java',
      'ruoyi-generator/src/main/resources/mapper/generator/GenTableMapper.xml',
      'ruoyi-quartz/src/main/java/com/ruoyi/quartz/task/CustomerSyncTask.java'
    ]) {
      const errors = validateReviews({
        ...common,
        impact: { mode: 'update', baseRevision: 'base', feature: { id: 'system' } },
        changedFiles: [runtimeFile]
      });
      assert.ok(errors.some((error) => error.includes('impact.reviewId')), runtimeFile);
    }
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('review gate treats every non-document file under runtime source roots as implementation', () => {
  for (const runtimeFile of [
    'backend/common/customer-runtime.ts',
    'backend/common/dist/customer-runtime.ts',
    'backend/common/node_modules/customer-runtime.ts',
    'backend/config/customer-runtime.yml',
    'backend/package.json',
    'frontend/src/components/CustomerRuntime.tsx',
    'frontend/src/dist/customer-runtime.ts',
    'frontend/src/node_modules/customer-runtime.ts',
    'frontend/public/customer-runtime.js',
    'frontend/index.html',
    'frontend/vite.config.mjs',
    'frontend/package.json',
    'ruoyi-ui/public/customer-runtime.js',
    'ruoyi-ui/src/dist/customer-runtime.js',
    'ruoyi-ui/src/node_modules/customer-runtime.js',
    'ruoyi-ui/index.html',
    'ruoyi-ui/vite.config.js',
    'ruoyi-ui/package.json',
    'ruoyi-business/src/main/kotlin/com/ruoyi/business/customer/CustomerRuntime.kt',
    'ruoyi-system/src/test/groovy/com/ruoyi/system/CustomerRuntimeSpec.groovy',
    'ruoyi-admin/src/main/webapp/customer-runtime.js',
    'ruoyi-ui/src/views/customer/detail-request-guard.mjs',
    'ruoyi-ui/src/views/customer/customer-worker.cjs',
    'ruoyi-ui/src/views/customer/CustomerPanel.jsx',
    'ruoyi-ui/src/views/customer/customer-state.mts',
    'ruoyi-ui/src/views/customer/customer-state.cts',
    'ruoyi-ui/src/views/customer/customer-policy.json',
    'ruoyi-ui/src/assets/customer-status.custom',
    'ruoyi-business/src/main/resources/customer/runtime.txt'
  ]) {
    assert.equal(isBusinessImplementationPath(runtimeFile), true, runtimeFile);
  }
  assert.equal(isBusinessImplementationPath('docs/customer-runtime.mjs.md'), false);
  assert.equal(isBusinessImplementationPath('backend/README.md'), false);
  assert.equal(isBusinessImplementationPath('backend/dist/customer-runtime.js'), false);
  assert.equal(isBusinessImplementationPath('backend/node_modules/example/runtime.js'), false);
  assert.equal(isBusinessImplementationPath('frontend/docs/customer-runtime.md'), false);
  assert.equal(isBusinessImplementationPath('frontend/dist/customer-runtime.js'), false);
  assert.equal(isBusinessImplementationPath('frontend/node_modules/example/runtime.js'), false);
  assert.equal(isBusinessImplementationPath('ruoyi-ui/src/views/customer/README.md'), false);
  assert.equal(isBusinessImplementationPath('ruoyi-ui/dist/customer-runtime.mjs'), false);
  assert.equal(isBusinessImplementationPath('ruoyi-ui/node_modules/example/runtime.js'), false);
});

test('Java tests under src/test/java require feature ownership registration', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-java-test-owner-'));
  try {
    const registryDir = path.join(root, 'ai', 'registry');
    const javaTest = path.join(root, 'ruoyi-business', 'src', 'test', 'java', 'com', 'ruoyi', 'business', 'customer', 'service', 'CustomerServiceTest.java');
    fs.mkdirSync(registryDir, { recursive: true });
    fs.mkdirSync(path.dirname(javaTest), { recursive: true });
    fs.writeFileSync(javaTest, 'class CustomerServiceTest {}\n');
    fs.writeFileSync(path.join(registryDir, 'features.json'), JSON.stringify({
      schemaVersion: 1,
      features: [{
        id: 'customer',
        name: 'Customer',
        aliases: [],
        status: 'active',
        tests: [],
        ownership: { tests: [] }
      }]
    }, null, 2));
    fs.writeFileSync(path.join(registryDir, 'test-ownership-exceptions.json'), JSON.stringify({ schemaVersion: 1, exceptions: [] }, null, 2));

    const result = validateFeatureTestOwnership({ root });
    assert.ok(result.failures.some((failure) => failure.file.endsWith('CustomerServiceTest.java') && failure.code === 'missing-feature-tests-entry'));
    assert.ok(result.failures.some((failure) => failure.file.endsWith('CustomerServiceTest.java') && failure.code === 'missing-ownership-tests-entry'));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('doc-size, read-budget, context-pack, and file-weight checkers run on real files', () => {
  assert.deepEqual(validateDocSize(), []);
  assert.deepEqual(validateReadBudget(), []);
  assert.deepEqual(validateContextPack({ bindActiveContext: false }), []);
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
    readJsonFile: (file) => file === 'ai/changes/CURRENT_CHANGE.json'
      ? { current: 'CR-TEST-WITHOUT-WEIGHT-JUSTIFICATION' }
      : readJson(file),
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

test('finalize records only actual Git changes and ignores requested or impact-declared overclaims', () => {
  assert.deepEqual(resolveFinalizedChangedFiles({
    actualFiles: ['tools/diff-checker.js'],
    requestedFiles: ['docs/untouched.md'],
    impactFiles: ['sql/untouched.sql']
  }), ['tools/diff-checker.js']);
});

test('diff evidence unions the candidate index, worktree divergence, and untracked files', () => {
  const calls = [];
  const zero = '0'.repeat(40);
  const candidateRaw = [
    `:100644 100644 ${'1'.repeat(40)} ${'2'.repeat(40)} M\0committed.js\0`,
    `:100644 000000 ${'3'.repeat(40)} ${zero} D\0deleted.sql\0`,
    `:100644 100644 ${'4'.repeat(40)} ${'5'.repeat(40)} M\0staged.js\0`
  ].join('');
  const worktreeRaw = [
    `:100644 100644 ${'6'.repeat(40)} ${'7'.repeat(40)} M\0unstaged.js\0`
  ].join('');
  const outputs = new Map([
    ['diff --cached --no-renames --raw -z --abbrev=40 --diff-filter=ACDMRTUXB base --', candidateRaw],
    ['diff --no-renames --raw -z --abbrev=40 --diff-filter=ACDMRTUXB --', worktreeRaw],
    ['ls-files --others --exclude-standard -z', 'untracked.js\0']
  ]);
  const files = gitChangedFiles({
    baseRevision: 'base',
    gitRepository: true,
    runGitCommand: (args) => {
      const command = args.join(' ');
      calls.push(command);
      return outputs.get(command) || '';
    },
    readWorktreeMode: () => '100644',
    hashWorktreeFile: () => '8'.repeat(40)
  });
  assert.deepEqual(files, ['committed.js', 'deleted.sql', 'staged.js', 'unstaged.js', 'untracked.js']);
  assert.ok(calls.includes('diff --cached --no-renames --raw -z --abbrev=40 --diff-filter=ACDMRTUXB base --'));
  assert.ok(calls.includes('diff --no-renames --raw -z --abbrev=40 --diff-filter=ACDMRTUXB --'));
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

test('beforeSalesOrder gate blocks sales-order runtime content in SQL and Vue API files', () => {
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

  const samples = [
    {
      file: 'sql/migrations/V999__customer.sql',
      text: 'create table sales_order (order_id bigint);'
    },
    {
      file: 'sql/validation/customer.sql',
      text: 'create table sales_order_item (item_id bigint);'
    },
    {
      file: 'ruoyi-ui/src/api/customer.js',
      text: "export const createSalesOrder = () => request({ url: '/sales/order', method: 'post' })"
    },
    {
      file: 'ruoyi-ui/src/views/customer/index.vue',
      text: "<el-button v-hasPermi=\"['business:sales:order']\">Create</el-button>"
    }
  ];

  for (const sample of samples) {
    const errors = validatePhaseGates({
      readJsonFile,
      readTextFile: (file) => file === sample.file ? sample.text : '',
      changedFiles: [sample.file]
    });
    assert.ok(errors.some((error) => error.includes('sales-order implementation is blocked')), `${sample.file} should be blocked`);
  }
});

test('beforeSalesOrder content scan ignores markdown prose but still scans executable runtime files', () => {
  const readJsonFile = (file) => {
    if (file === 'ai/roadmap/phase-gates.json') return readJson(file);
    if (file === 'ai/roadmap/enhancement-backlog.json') return readJson(file);
    if (file === 'ai/changes/CURRENT_CHANGE.json') return { current: 'CR-TEST' };
    if (file === 'ai/changes/CR-TEST/impact.json') {
      return { schemaVersion: 1, mode: 'rule-change', noSalesOrderImplementation: true };
    }
    throw new Error(`unexpected read ${file}`);
  };
  const text = 'Documentation example: create table sales_order (order_id bigint);';
  assert.deepEqual(validatePhaseGates({
    readJsonFile,
    readTextFile: () => text,
    changedFiles: ['sql/customer.ownership.md']
  }), []);
  const runtimeErrors = validatePhaseGates({
    readJsonFile,
    readTextFile: () => text,
    changedFiles: ['sql/migrations/V999__customer.sql']
  });
  assert.ok(runtimeErrors.some((error) => error.includes('sales-order implementation is blocked')));
});

test('beforeSalesOrder gate blocks sales-order bypasses in shared RuoYi runtime roots', () => {
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

  const namedRuntimeFiles = [
    'ruoyi-system/src/main/java/com/ruoyi/system/service/SalesOrderMenuService.java',
    'ruoyi-generator/src/main/java/com/ruoyi/generator/service/SalesOrderTemplateService.java',
    'ruoyi-quartz/src/main/java/com/ruoyi/quartz/task/SalesOrderTask.java',
    'ruoyi-admin/sql/sales_order_menu.sql',
    'ruoyi-ui/src/store/modules/salesOrder.js'
  ];

  for (const file of namedRuntimeFiles) {
    const errors = validatePhaseGates({ readJsonFile, changedFiles: [file] });
    assert.ok(errors.some((error) => error.includes('sales-order implementation is blocked')), `${file} should be blocked`);
  }

  const contentRuntimeFiles = [
    {
      file: 'ruoyi-ui/src/router/index.js',
      text: "const route = { path: '/sales/order', component: () => import('@/views/salesOrder/index') };"
    },
    {
      file: 'ruoyi-ui/src/permission.js',
      text: "if (hasPermi('business:sales-order:list')) next();"
    },
    {
      file: 'ruoyi-system/src/main/resources/mapper/system/SysMenuMapper.xml',
      text: "insert into sys_menu(menu_name, perms) values ('Sales Order', 'business:salesorder:list');"
    }
  ];

  for (const sample of contentRuntimeFiles) {
    const errors = validatePhaseGates({
      readJsonFile,
      readTextFile: (file) => file === sample.file ? sample.text : '',
      changedFiles: [sample.file]
    });
    assert.ok(errors.some((error) => error.includes('sales-order implementation is blocked')), `${sample.file} should be blocked`);
  }
});
