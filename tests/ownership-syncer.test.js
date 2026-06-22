import test from 'node:test';
import assert from 'node:assert/strict';
import { hasRepeatedRoutePath, runOwnershipSync } from '../tools/ownership-syncer.js';

test('ownership sync is stable after scan output is current', () => {
  assert.deepEqual(runOwnershipSync({ checkMode: true }), []);
});

test('ownership sync detects repeated generated route halves', () => {
  assert.equal(hasRepeatedRoutePath('/system/config/system/config'), true);
  assert.equal(hasRepeatedRoutePath('/system/user/profile/system/user/profile'), true);
  assert.equal(hasRepeatedRoutePath('/test/user/test/user'), true);
  assert.equal(hasRepeatedRoutePath('/system/config/list'), false);
  assert.equal(hasRepeatedRoutePath('/monitor/cache/getValue/{cacheName}/{cacheKey}'), false);
});
