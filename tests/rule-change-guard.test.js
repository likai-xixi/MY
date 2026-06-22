import test from 'node:test';
import assert from 'node:assert/strict';
import { validateRuleChangeGuard } from '../tools/rule-change-guard.js';

test('business feature work cannot edit protected governance files', () => {
  const errors = validateRuleChangeGuard({
    files: ['tools/diff-checker.js', 'backend/modules/customer/README.md'],
    impact: { mode: 'update' }
  });
  assert.equal(errors.length, 1);
  assert.match(errors[0], /protected governance file/);
});

test('rule-change mode may edit protected governance files', () => {
  const errors = validateRuleChangeGuard({
    files: ['tools/diff-checker.js', 'ai/rules/module-boundary.json'],
    impact: { mode: 'rule-change' }
  });
  assert.deepEqual(errors, []);
});
