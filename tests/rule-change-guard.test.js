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

test('test ownership exception registry requires exact rule-change mode', () => {
  const file = 'ai/registry/test-ownership-exceptions.json';
  for (const mode of ['update', 'governance', 'baseline', 'profile']) {
    const errors = validateRuleChangeGuard({ files: [file], impact: { mode } });
    assert.equal(errors.length, 1, mode);
    assert.match(errors[0], /requires an active rule-change record/, mode);
  }

  assert.deepEqual(validateRuleChangeGuard({
    files: [file],
    impact: { mode: 'rule-change' }
  }), []);
});
