import test from 'node:test';
import assert from 'node:assert/strict';
import { hasRouteCoverage, routeShape, validateModuleRegistry } from '../tools/registry-checker.js';

const featureRegistry = {
  schemaVersion: 1,
  features: [
    {
      id: 'inventory',
      status: 'active',
      backendModules: ['backend/modules/inventory'],
      frontendModules: ['frontend/src/modules/inventory']
    }
  ]
};

function registryReader(modulesRegistry) {
  return (relativePath) => {
    if (relativePath === 'ai/registry/features.json') return featureRegistry;
    if (relativePath === 'ai/registry/modules.json') return modulesRegistry;
    throw new Error(`unexpected read ${relativePath}`);
  };
}

test('module registry requires every backend module directory to be registered', () => {
  const errors = validateModuleRegistry({
    read: registryReader({ schemaVersion: 1, modules: [] }),
    exists: () => true,
    directories: (relativePath) => (relativePath === 'backend/modules' ? ['inventory'] : [])
  });
  assert.ok(errors.some((error) => error.includes('backend/modules/inventory exists but is missing from ai/registry/modules.json')));
});

test('module registry backend paths must be declared by the owning feature', () => {
  const errors = validateModuleRegistry({
    read: registryReader({
      schemaVersion: 1,
      modules: [
        {
          id: 'inventory',
          type: 'business-feature',
          feature: 'inventory',
          backendPath: 'backend/modules/orders',
          frontendPath: 'frontend/src/modules/inventory',
          owner: 'workflow'
        }
      ]
    }),
    exists: () => true,
    directories: () => []
  });
  assert.ok(errors.some((error) => error.includes('is not declared in feature inventory.backendModules')));
});

test('module registry accepts registered backend modules', () => {
  const errors = validateModuleRegistry({
    read: registryReader({
      schemaVersion: 1,
      modules: [
        {
          id: 'inventory',
          type: 'business-feature',
          feature: 'inventory',
          backendPath: 'backend/modules/inventory',
          frontendPath: 'frontend/src/modules/inventory',
          owner: 'workflow'
        }
      ]
    }),
    exists: () => true,
    directories: (relativePath) => (relativePath === 'backend/modules' ? ['inventory'] : [])
  });
  assert.deepEqual(errors, []);
});

test('module registry paths field can register backend modules', () => {
  const errors = validateModuleRegistry({
    read: registryReader({
      schemaVersion: 1,
      modules: [
        {
          id: 'inventory',
          type: 'business-feature',
          feature: 'inventory',
          paths: ['backend/modules/inventory'],
          owner: 'workflow'
        }
      ]
    }),
    exists: () => true,
    directories: (relativePath) => (relativePath === 'backend/modules' ? ['inventory'] : [])
  });
  assert.deepEqual(errors, []);
});

test('feature route coverage accepts generated backend route shapes', () => {
  const coverage = {
    uiRoutes: new Set(),
    apiPaths: new Set(['/monitor/job']),
    backendPaths: new Set(['/monitor/job/{jobIds}']),
    uiRouteShapes: new Set(),
    apiPathShapes: new Set(['/monitor/job'].map(routeShape)),
    backendPathShapes: new Set(['/monitor/job/{jobIds}'].map(routeShape))
  };

  assert.equal(hasRouteCoverage('/monitor/job/{jobId}', coverage), true);
  assert.equal(hasRouteCoverage('/monitor/job/export', coverage), false);
});
