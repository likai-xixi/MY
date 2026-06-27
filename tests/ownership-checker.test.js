import test from 'node:test';
import assert from 'node:assert/strict';
import { validateOwnership } from '../tools/ownership-checker.js';

test('ownership ledger passes for scaffold features', () => {
  assert.deepEqual(validateOwnership(), []);
});

test('ownership checker requires feature permissions to appear in generated scan', () => {
  const errors = validateOwnership({
    exists: () => true,
    readJsonFile: (file) => {
      if (file === 'ai/registry/features.json') {
        return {
          schemaVersion: 1,
          features: [
            {
              id: 'customer',
              status: 'active',
              permissions: ['business:customer:list'],
              ownership: {
                backend: [],
                frontend: [],
                api: [],
                ui: [],
                database: [],
                permissions: ['business:customer:list'],
                menus: [],
                components: [],
                tests: [],
                docs: [],
                apiClients: [],
                controllers: [],
                services: [],
                mappers: [],
                domainObjects: []
              }
            }
          ]
        };
      }
      if (file === 'ai/generated/permissions.json') {
        return { schemaVersion: 1, permissions: [] };
      }
      throw new Error(`unexpected read ${file}`);
    }
  });

  assert.deepEqual(errors, [
    'feature customer.permissions item business:customer:list is missing from ai/generated/permissions.json.'
  ]);
});
