import test from 'node:test';
import assert from 'node:assert/strict';
import { readJson, readText } from '../tools/common.js';
import { parseApiCatalog, parseFrontendModule, validateApiPermissionConsistency, validateApiRouteScanConsistency, validateGraphs } from '../tools/dependency-checker.js';
import { buildModuleGraph, buildRenderGraphMermaid } from '../scripts/build-graph.js';

test('module graph matches generated graph', () => {
  assert.deepEqual(readJson('graph/module-graph.json'), buildModuleGraph());
});

test('render graph matches generated module graph', () => {
  assert.equal(buildRenderGraphMermaid(readJson('graph/module-graph.json')), readText('graph/render-graph.mmd'));
});

test('graph files are internally consistent', () => {
  assert.deepEqual(validateGraphs(), []);
});

test('api catalog parser reads stable endpoint ids', () => {
  const catalog = parseApiCatalog([
    '# API Catalog',
    '',
    '## inventory.list',
    '',
    '- Owner: backend-agent',
    '- Module: inventory',
    '- Method: `GET`',
    '- Path: `/api/inventory/items`',
    ''
  ].join('\n'));
  assert.equal(catalog.get('inventory.list').path, '/api/inventory/items');
});

test('frontend module parser reads route, api, and states', () => {
  const parsed = parseFrontendModule("export const m = { id: 'inventory', route: '/inventory', api: 'inventory.list', states: ['loading', 'empty', 'success', 'error'] };");
  assert.deepEqual(parsed, {
    id: 'inventory',
    route: '/inventory',
    api: 'inventory.list',
    states: ['loading', 'empty', 'success', 'error']
  });
});

test('api route scan consistency allows template placeholders only while template setup is active', () => {
  const endpoints = [
    { id: 'inventory.list', method: 'GET', path: '/api/inventory/items', module: 'inventory' }
  ];
  const catalog = parseApiCatalog([
    '# API Catalog',
    '',
    '## inventory.list',
    '',
    '- Owner: backend-agent',
    '- Module: inventory',
    '- Method: `GET`',
    '- Path: `/api/inventory/items`',
    ''
  ].join('\n'));
  const policy = { apiFactSources: { allowMissingGeneratedRouteWhenTemplateSetup: true, realBackendRouteSources: ['java-annotation', 'js-router'] } };

  assert.deepEqual(validateApiRouteScanConsistency({
    endpoints,
    catalog,
    backendRoutes: { routes: [] },
    profile: { templateSetup: true, locked: false },
    policy
  }), []);

  const errors = validateApiRouteScanConsistency({
    endpoints,
    catalog,
    backendRoutes: { routes: [] },
    profile: { templateSetup: false, locked: true },
    policy
  });
  assert.ok(errors.some((error) => error.includes('no real scanned backend route source')));
});

test('api route scan consistency requires a real generated route source', () => {
  const endpoints = [
    { id: 'inventory.list', method: 'GET', path: '/api/inventory/items', module: 'inventory' }
  ];
  const catalog = new Map([
    ['inventory.list', { id: 'inventory.list', method: 'GET', path: '/api/inventory/items', module: 'inventory' }]
  ]);
  const policy = { apiFactSources: { realBackendRouteSources: ['java-annotation', 'js-router'] } };

  assert.deepEqual(validateApiRouteScanConsistency({
    endpoints,
    catalog,
    backendRoutes: {
      routes: [
        {
          module: 'inventory',
          method: 'GET',
          path: '/api/inventory/items',
          file: 'backend/modules/inventory/api/routes.ts',
          source: 'js-router'
        }
      ]
    },
    profile: { templateSetup: false, locked: true },
    policy
  }), []);

  const errors = validateApiRouteScanConsistency({
    endpoints,
    catalog,
    backendRoutes: {
      routes: [
        {
          module: 'inventory',
          method: 'GET',
          path: '/api/inventory/items',
          file: 'backend/modules/inventory/api/routes.ts',
          source: 'manual-contract'
        }
      ]
    },
    profile: { templateSetup: false, locked: true },
    policy
  });
  assert.ok(errors.some((error) => error.includes('no real scanned backend route source')));
});

test('api permission consistency requires graph permission to match backend route', () => {
  const endpoints = [
    {
      id: '/business/customer/{customerId}/fund/deposit',
      method: 'POST',
      path: '/business/customer/{customerId}/fund/deposit',
      module: 'customer',
      permission: ''
    }
  ];
  const backendRoutes = {
    routes: [
      {
        module: 'customer',
        method: 'POST',
        path: '/business/customer/{customerId}/fund/deposit',
        permission: 'business:customer:fund:deposit'
      }
    ]
  };
  const features = [
    {
      id: 'customer',
      status: 'active',
      permissions: ['business:customer:fund:deposit']
    }
  ];
  const highRiskCoverage = {
    entries: [
      {
        api: '/business/customer/{customerId}/fund/deposit',
        status: 'required',
        backendPermission: 'business:customer:fund:deposit',
        riskDomain: 'customer-fund'
      }
    ]
  };

  const errors = validateApiPermissionConsistency({ endpoints, backendRoutes, features, highRiskCoverage });
  assert.ok(errors.some((error) => error.includes('permission must match backend route permission')));
  assert.ok(errors.some((error) => error.includes('riskDomain must be customer-fund')));
});

test('repo-level UI graph contains only real screen files', () => {
  const uiGraph = readJson('graph/ui-graph.json');
  assert.equal(uiGraph.screens.some((screen) => !screen.file && screen.virtual !== true), false);
  assert.equal(uiGraph.screens.some((screen) => screen.route === '/business/customer/{customerId}/fund/deposit'), false);
  assert.ok(uiGraph.screens.some((screen) => screen.id === 'customer:customer' && screen.file === 'ruoyi-ui/src/views/customer/index.vue'));
});

test('repo-level high-risk customer APIs carry permission and riskDomain in API graph', () => {
  const apiGraph = readJson('graph/api-graph.json');
  const entries = new Map(apiGraph.endpoints.map((endpoint) => [`${endpoint.method} ${endpoint.path}`, endpoint]));

  assert.equal(entries.get('POST /business/customer/{customerId}/fund/deposit')?.permission, 'business:customer:fund:deposit');
  assert.equal(entries.get('POST /business/customer/{customerId}/fund/deposit')?.riskDomain, 'customer-fund');
  assert.equal(entries.get('POST /business/customer/{customerId}/sample-rebate')?.permission, 'business:customer:sample-rebate:create');
  assert.equal(entries.get('POST /business/customer/{customerId}/sample-rebate')?.riskDomain, 'customer-fund');
});
