import test from 'node:test';
import assert from 'node:assert/strict';
import { extractRequestObjectCalls } from '../tools/scan-api-clients.js';

test('RuoYi request object scanner extracts url and method', () => {
  const calls = extractRequestObjectCalls(`
    export function listCustomer(query) {
      return request({
        url: '/business/customer/list',
        method: 'get',
        params: query
      })
    }
  `);
  assert.deepEqual(calls, [
    { path: '/business/customer/list', method: 'GET', source: 'request-object' }
  ]);
});
