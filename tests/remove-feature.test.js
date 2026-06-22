import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { collectFeatureImpact, parseArgs, renderImpactText } from '../scripts/remove-feature.js';
import { readJson } from '../tools/common.js';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function firstActiveFeature() {
  try {
    const registry = readJson('ai/registry/features.json');
    return (registry.features || []).find((feature) => feature.status !== 'removed') || null;
  } catch {
    return null;
  }
}

function toPosix(filePath) {
  return filePath.split(path.sep).join('/');
}

function copyProjectFixture() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'remove-feature-apply-'));
  fs.cpSync(projectRoot, tempRoot, {
    recursive: true,
    filter: (source) => {
      const relative = toPosix(path.relative(projectRoot, source));
      return relative === ''
        || (
          !relative.startsWith('node_modules/')
          && relative !== 'node_modules'
          && !relative.startsWith('.git/')
          && relative !== '.git'
          && !relative.startsWith('ai/deletions/')
        );
    }
  });
  return tempRoot;
}

function tempPath(root, relativePath) {
  return path.join(root, ...relativePath.split('/'));
}

function readTempJson(root, relativePath) {
  return JSON.parse(fs.readFileSync(tempPath(root, relativePath), 'utf8'));
}

function writeTempJson(root, relativePath, data) {
  fs.mkdirSync(path.dirname(tempPath(root, relativePath)), { recursive: true });
  fs.writeFileSync(tempPath(root, relativePath), `${JSON.stringify(data, null, 2)}\n`);
}

function writeTempText(root, relativePath, content) {
  fs.mkdirSync(path.dirname(tempPath(root, relativePath)), { recursive: true });
  fs.writeFileSync(tempPath(root, relativePath), content);
}

function runNode(root, args) {
  return spawnSync(process.execPath, args, {
    cwd: root,
    encoding: 'utf8'
  });
}

function assertCommandOk(result) {
  assert.equal(
    result.status,
    0,
    [
      `command failed: ${result.spawnargs?.join(' ') || '<unknown>'}`,
      result.stdout,
      result.stderr
    ].filter(Boolean).join('\n')
  );
}

function addRemovalFixture(root) {
  const featureId = 'apply-cleanup-fixture';
  const apiId = `${featureId}.list`;
  const screenId = `frontend.${featureId}`;

  writeTempText(root, `features/${featureId}.md`, `# Feature Brief: Apply Cleanup Fixture\n\nTemporary deletion fixture.\n`);
  writeTempText(root, `backend/modules/${featureId}/api/README.md`, '# API\n');
  writeTempText(root, `backend/modules/${featureId}/service/README.md`, '# Service\n');
  writeTempText(root, `backend/modules/${featureId}/domain/README.md`, '# Domain\n');
  writeTempText(root, `backend/modules/${featureId}/repository/README.md`, '# Repository\n');
  writeTempText(root, `frontend/src/modules/${featureId}/module.ts`, [
    'export const applyCleanupFixtureModule = {',
    `  id: '${featureId}',`,
    `  route: '/${featureId}',`,
    `  api: '${apiId}',`,
    "  states: ['loading', 'empty', 'success', 'error']",
    '};',
    ''
  ].join('\n'));

  const features = readTempJson(root, 'ai/registry/features.json');
  features.features.push({
    id: featureId,
    name: 'Apply Cleanup Fixture',
    status: 'active',
    featureBrief: `features/${featureId}.md`,
    backendModules: [`backend/modules/${featureId}`],
    frontendModules: [`frontend/src/modules/${featureId}`],
    apis: [apiId],
    screens: [screenId],
    dbTables: [],
    permissions: [],
    components: [],
    routes: [`/${featureId}`],
    tests: [],
    docs: [`features/${featureId}.md`],
    apiClients: [`frontend/src/modules/${featureId}/module.ts`],
    ownership: {
      backend: [`backend/modules/${featureId}`],
      frontend: [`frontend/src/modules/${featureId}`],
      api: [apiId],
      ui: [screenId],
      database: [],
      permissions: [],
      menus: [],
      components: [],
      tests: [],
      docs: [`features/${featureId}.md`],
      apiClients: [`frontend/src/modules/${featureId}/module.ts`],
      controllers: [],
      services: [],
      mappers: [],
      domainObjects: []
    }
  });
  writeTempJson(root, 'ai/registry/features.json', features);

  const modules = readTempJson(root, 'ai/registry/modules.json');
  modules.modules.push({
    id: featureId,
    type: 'business-feature',
    feature: featureId,
    backendPath: `backend/modules/${featureId}`,
    frontendPath: `frontend/src/modules/${featureId}`,
    owner: 'workflow'
  });
  writeTempJson(root, 'ai/registry/modules.json', modules);

  const apiGraph = readTempJson(root, 'graph/api-graph.json');
  apiGraph.endpoints.push({
    id: apiId,
    method: 'GET',
    path: `/api/${featureId}/items`,
    owner: 'backend-agent',
    module: featureId,
    consumers: [screenId]
  });
  writeTempJson(root, 'graph/api-graph.json', apiGraph);

  const uiGraph = readTempJson(root, 'graph/ui-graph.json');
  uiGraph.screens.push({
    id: screenId,
    route: `/${featureId}`,
    owner: 'frontend-agent',
    module: featureId,
    usesApi: [apiId],
    states: ['loading', 'empty', 'success', 'error']
  });
  writeTempJson(root, 'graph/ui-graph.json', uiGraph);

  const backendRoutes = readTempJson(root, 'ai/generated/backend-routes.json');
  backendRoutes.modules = [...new Set([...(backendRoutes.modules || []), featureId])];
  backendRoutes.routes.push({
    module: featureId,
    method: 'GET',
    path: `/api/${featureId}/stale`,
    file: `backend/modules/${featureId}/api/stale.js`,
    source: 'test-stale'
  });
  writeTempJson(root, 'ai/generated/backend-routes.json', backendRoutes);

  const apiClients = readTempJson(root, 'ai/generated/api-clients.json');
  apiClients.calls.push({
    module: featureId,
    path: `/api/${featureId}/stale`,
    file: `frontend/src/modules/${featureId}/module.ts`,
    method: 'GET',
    source: 'test-stale'
  });
  apiClients.moduleContracts.push({
    module: featureId,
    api: apiId,
    file: `frontend/src/modules/${featureId}/module.ts`,
    source: 'module-contract'
  });
  writeTempJson(root, 'ai/generated/api-clients.json', apiClients);

  return { featureId, apiId, screenId };
}

test('feature removal dry-run creates deterministic impact list for the active sample feature', () => {
  const feature = firstActiveFeature();
  if (!feature) {
    assert.equal(collectFeatureImpact({ name: 'definitely-missing-feature' }).blockers.length > 0, true);
    return;
  }
  const impact = collectFeatureImpact({ name: feature.id });
  assert.equal(impact.slug, feature.id);
  assert.deepEqual(impact.blockers, []);
  assert.ok(impact.removeFiles.includes(feature.featureBrief));
  for (const backendModule of feature.backendModules || []) {
    assert.ok(impact.removeFiles.includes(backendModule));
  }
  for (const frontendModule of feature.frontendModules || []) {
    assert.ok(impact.removeFiles.includes(frontendModule));
  }
  assert.ok(impact.updateFiles.includes('ai/registry/features.json'));
  assert.ok(impact.updateFiles.includes('ai/registry/modules.json'));
  assert.ok(impact.updateFiles.includes('memory/PROJECT_STATE.md'));
  assert.ok(impact.updateFiles.includes('memory/TASKS.json'));
  assert.ok(impact.updateFiles.includes('memory/HANDOVER.md'));
  assert.ok(impact.updateFiles.includes('memory/CHANGELOG.md'));
  assert.ok(impact.qaCommands.includes('npm run check'));
});



test('feature removal resolves display names without relying on a fixed sample', () => {
  const feature = firstActiveFeature();
  if (!feature) {
    const impact = collectFeatureImpact({ name: '库存管理' });
    assert.equal(impact.slug, 'inventory');
    assert.ok(impact.blockers.some((error) => error.includes('No feature')));
    return;
  }
  const impact = collectFeatureImpact({ name: feature.name || feature.id });
  assert.equal(impact.slug, feature.id);
  assert.deepEqual(impact.blockers, []);
});

test('unknown feature removal reports blockers', () => {
  const impact = collectFeatureImpact({ name: 'Definitely Missing Feature' });
  assert.equal(impact.slug, 'definitely-missing-feature');
  assert.ok(impact.blockers.some((error) => error.includes('No feature')));
});

test('feature removal impact renders rollback notes', () => {
  const feature = firstActiveFeature();
  const text = renderImpactText(collectFeatureImpact({ name: feature?.id || 'Definitely Missing Feature' }));
  assert.match(text, /Rollback notes:/);
  assert.match(text, /npm run check/);
});

test('feature removal CLI args keep feature name without confirm flag', () => {
  assert.deepEqual(parseArgs(['Inventory', '--dry-run']), {
    name: 'Inventory',
    dryRun: true,
    json: false,
    apply: false,
    confirm: ''
  });
});

test('feature removal apply refreshes generated scans, ownership, graph, memory, and orphan state', () => {
  const tempRoot = copyProjectFixture();
  const { featureId, apiId, screenId } = addRemovalFixture(tempRoot);

  const dryRun = runNode(tempRoot, ['scripts/remove-feature.js', featureId, '--dry-run']);
  assertCommandOk(dryRun);
  assert.match(dryRun.stdout, new RegExp(`Feature: ${featureId}`));

  const apply = runNode(tempRoot, ['scripts/remove-feature.js', featureId, '--apply', '--confirm', featureId]);
  assertCommandOk(apply);
  assert.match(apply.stdout, /remove:feature: ok/);

  assert.equal(fs.existsSync(tempPath(tempRoot, `features/${featureId}.md`)), false);
  assert.equal(fs.existsSync(tempPath(tempRoot, `backend/modules/${featureId}`)), false);
  assert.equal(fs.existsSync(tempPath(tempRoot, `frontend/src/modules/${featureId}`)), false);
  assert.ok(fs.existsSync(tempPath(tempRoot, `ai/deletions/${featureId}`)));

  const features = readTempJson(tempRoot, 'ai/registry/features.json');
  assert.equal(features.features.some((feature) => feature.id === featureId), false);

  const modules = readTempJson(tempRoot, 'ai/registry/modules.json');
  assert.equal(modules.modules.some((module) => module.id === featureId || module.feature === featureId), false);

  const apiGraph = readTempJson(tempRoot, 'graph/api-graph.json');
  assert.equal(apiGraph.endpoints.some((endpoint) => endpoint.id === apiId || endpoint.module === featureId), false);

  const uiGraph = readTempJson(tempRoot, 'graph/ui-graph.json');
  assert.equal(uiGraph.screens.some((screen) => screen.id === screenId || screen.module === featureId), false);

  const backendRoutes = readTempJson(tempRoot, 'ai/generated/backend-routes.json');
  assert.equal((backendRoutes.modules || []).includes(featureId), false);
  assert.equal((backendRoutes.routes || []).some((route) => route.module === featureId), false);

  const frontendRoutes = readTempJson(tempRoot, 'ai/generated/frontend-routes.json');
  assert.equal((frontendRoutes.modules || []).includes(featureId), false);
  assert.equal((frontendRoutes.routes || []).some((route) => route.module === featureId), false);

  const apiClients = readTempJson(tempRoot, 'ai/generated/api-clients.json');
  assert.equal((apiClients.calls || []).some((call) => call.module === featureId), false);
  assert.equal((apiClients.moduleContracts || []).some((contract) => contract.module === featureId), false);

  for (const args of [
    ['tools/scan-backend-routes.js', '--check'],
    ['tools/scan-frontend-routes.js', '--check'],
    ['tools/scan-api-clients.js', '--check'],
    ['tools/ownership-syncer.js', '--check'],
    ['scripts/build-graph.js', '--check'],
    ['scripts/sync-memory.js', '--check'],
    ['tools/orphan-code-checker.js', featureId]
  ]) {
    assertCommandOk(runNode(tempRoot, args));
  }
});
