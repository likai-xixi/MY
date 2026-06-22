import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAgents } from '../tools/rule-validator.js';

test('agent contracts are complete', () => {
  assert.deepEqual(validateAgents(), []);
});
