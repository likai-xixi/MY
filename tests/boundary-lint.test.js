import test from 'node:test';
import assert from 'node:assert/strict';
import { validateBackendBoundaries, validateFrontendBoundaries, validateBoundaries } from '../tools/boundary-lint.js';

test('boundary lint passes for scaffold', () => {
  assert.deepEqual(validateBoundaries(), []);
});

test('backend root layer directories are rejected', () => {
  const errors = validateBackendBoundaries({
    exists: (relativePath) => relativePath === 'backend/api',
    files: () => [],
    read: () => ''
  });
  assert.ok(errors.some((error) => error.includes('backend/api is not allowed')));
});

test('backend root code is rejected unless explicitly whitelisted', () => {
  const errors = validateBackendBoundaries({
    exists: () => false,
    files: () => ['backend/order-service.ts'],
    read: () => '',
    directories: () => [],
    policy: { backend: { rootCodeWhitelist: [] } }
  });
  assert.ok(errors.some((error) => error.includes('backend root code')));
});

test('backend module subdirectories are limited to layers or whitelist entries', () => {
  const errors = validateBackendBoundaries({
    exists: () => false,
    files: () => [],
    read: () => '',
    directories: (relativePath) => {
      if (relativePath === 'backend/modules') return ['inventory'];
      if (relativePath === 'backend/modules/inventory') return ['api', 'jobs'];
      return [];
    },
    policy: {
      backend: {
        allowedModuleSubdirectories: ['api', 'service', 'domain', 'repository'],
        moduleSubdirectoryWhitelist: []
      }
    }
  });
  assert.ok(errors.some((error) => error.includes('backend/modules/inventory/jobs')));
});

test('backend module subdirectory whitelist permits registered exceptions', () => {
  const errors = validateBackendBoundaries({
    exists: () => false,
    files: () => [],
    read: () => '',
    directories: (relativePath) => {
      if (relativePath === 'backend/modules') return ['inventory'];
      if (relativePath === 'backend/modules/inventory') return ['api', 'jobs'];
      return [];
    },
    policy: {
      backend: {
        allowedModuleSubdirectories: ['api', 'service', 'domain', 'repository'],
        moduleSubdirectoryWhitelist: ['jobs']
      }
    }
  });
  assert.deepEqual(errors, []);
});

test('backend common cannot depend on feature modules', () => {
  const errors = validateBackendBoundaries({
    exists: () => false,
    files: () => ['backend/common/shared.ts'],
    read: () => "import x from 'backend/modules/inventory/domain/model';"
  });
  assert.ok(errors.some((error) => error.includes('must not import from backend/modules')));
});

test('domain layer cannot depend on repository', () => {
  const errors = validateBackendBoundaries({
    exists: () => false,
    files: () => ['backend/modules/inventory/domain/item.ts'],
    read: () => "import repo from 'backend/modules/inventory/repository/item-repository';"
  });
  assert.ok(errors.some((error) => error.includes('domain layer must not depend on repository')));
});

test('frontend shared components cannot depend on modules', () => {
  const errors = validateFrontendBoundaries({
    files: () => ['frontend/src/components/SharedTable.tsx'],
    read: () => "import state from 'frontend/src/modules/inventory/state';"
  });
  assert.ok(errors.some((error) => error.includes('Shared components cannot depend on business modules')));
});

test('frontend modules cannot import another module internals', () => {
  const errors = validateFrontendBoundaries({
    files: () => ['frontend/src/modules/inventory/view.tsx'],
    read: () => "import x from 'frontend/src/modules/orders/components/OrderTable';"
  });
  assert.ok(errors.some((error) => error.includes('orders')));
});
