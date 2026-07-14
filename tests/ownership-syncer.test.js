import test from 'node:test';
import assert from 'node:assert/strict';
import { hasRepeatedRoutePath, runOwnershipSync, scanLiveOwnership } from '../tools/ownership-syncer.js';

test('ownership sync discovers api clients and permissions in mjs helpers', () => {
  const file = 'ruoyi-ui/src/api/customer/customer.api.mjs';
  const componentHelper = 'ruoyi-ui/src/layout/components/CustomerNotice/format-message.mjs';
  const features = [{ id: 'customer', name: 'Customer', status: 'active' }];
  const ownership = scanLiveOwnership(features, {
    config: {
      backendScanRoots: [],
      frontendScanRoots: ['ruoyi-ui/src'],
      dbScanRoots: []
    },
    list: (roots, predicate) => roots.includes('ruoyi-ui/src')
      ? [file, componentHelper].filter((candidate) => predicate(candidate))
      : [],
    readTextFile: (candidate) => candidate === file
      ? "export const permission = 'customer:record:list';"
      : 'export const formatCustomerMessage = (value) => value;'
  });

  assert.deepEqual(ownership.customer.apiClients, [file]);
  assert.deepEqual(ownership.customer.permissions, ['customer:record:list']);
  assert.deepEqual(ownership.customer.permissionFiles, [file]);
  assert.deepEqual(ownership.customer.components, []);
});

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
