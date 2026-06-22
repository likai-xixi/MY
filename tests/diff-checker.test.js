import test from 'node:test';
import assert from 'node:assert/strict';
import { checkAllowedEditRoots, isAllowedByRoot } from '../tools/diff-checker.js';

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
