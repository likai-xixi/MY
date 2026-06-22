import test from 'node:test';
import assert from 'node:assert/strict';
import { runOwnershipSync } from '../tools/ownership-syncer.js';

test('ownership sync is stable after scan output is current', () => {
  assert.deepEqual(runOwnershipSync({ checkMode: true }), []);
});
