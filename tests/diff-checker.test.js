import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkAllowedEditRoots,
  checkEditRootPolicy,
  checkForbiddenEditRoots,
  isAllowedByRoot
} from '../tools/diff-checker.js';

test('allowed root accepts exact file and children', () => {
  assert.equal(isAllowedByRoot('backend/modules/customer/service/a.java', 'backend/modules/customer'), true);
  assert.equal(isAllowedByRoot('memory/HANDOVER.md', 'memory'), true);
  assert.equal(isAllowedByRoot('package.json', 'package.json'), true);
  assert.equal(isAllowedByRoot('backend/modules/order/service/a.java', 'backend/modules/customer'), false);
});

test('range gate rejects files outside impact roots', () => {
  const errors = checkAllowedEditRoots({
    changedFiles: ['backend/modules/customer/service/a.java', 'frontend/src/modules/order/index.ts'],
    impact: { allowedEditRoots: ['backend/modules/customer'] }
  });
  assert.deepEqual(errors, ['frontend/src/modules/order/index.ts is outside impact.allowedEditRoots.']);
});

test('range gate rejects forbidden roots before allowed roots can mask them', () => {
  const impact = {
    allowedEditRoots: ['ruoyi-ui/src'],
    forbiddenEditRoots: ['ruoyi-ui/src/router']
  };

  assert.deepEqual(checkForbiddenEditRoots({
    changedFiles: ['ruoyi-ui/src/router/index.js'],
    impact
  }), ['ruoyi-ui/src/router/index.js is inside impact.forbiddenEditRoots entry ruoyi-ui/src/router.']);

  assert.deepEqual(checkEditRootPolicy({
    changedFiles: ['ruoyi-ui/src/router/index.js'],
    impact
  }), ['impact.allowedEditRoots entry ruoyi-ui/src overlaps impact.forbiddenEditRoots entry ruoyi-ui/src/router.']);
});

test('range gate rejects overlapping allowed and forbidden roots', () => {
  const errors = checkEditRootPolicy({
    changedFiles: ['tools/diff-checker.js'],
    impact: {
      allowedEditRoots: ['ruoyi-ui/src/router'],
      forbiddenEditRoots: ['ruoyi-ui/src/router/index.js']
    }
  });

  assert.deepEqual(errors, [
    'impact.allowedEditRoots entry ruoyi-ui/src/router overlaps impact.forbiddenEditRoots entry ruoyi-ui/src/router/index.js.'
  ]);
});
