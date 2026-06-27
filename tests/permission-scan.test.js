import test from 'node:test';
import assert from 'node:assert/strict';
import { inferFeatureFromPermissionCode } from '../tools/scan-permissions.js';

const features = [
  { id: 'customer', status: 'active' },
  { id: 'system', status: 'active' },
  { id: 'removed-feature', status: 'removed' }
];

test('permission scanner maps RuoYi business feature permissions to the second segment', () => {
  assert.equal(inferFeatureFromPermissionCode('business:customer:add', features), 'customer');
  assert.equal(inferFeatureFromPermissionCode('business:customer:fund:add', features), 'customer');
  assert.equal(inferFeatureFromPermissionCode('business:customer:*', features), 'customer');
});

test('permission scanner keeps legacy registered-prefix permissions and rejects unknown features', () => {
  assert.equal(inferFeatureFromPermissionCode('system:user:list', features), 'system');
  assert.equal(inferFeatureFromPermissionCode('business:missing:add', features), '');
  assert.equal(inferFeatureFromPermissionCode('removed-feature:item:list', features), '');
});
