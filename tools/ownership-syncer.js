import path from 'node:path';
import { finish, formatJson, isCli, listFiles, readJson, writeOrCheck } from './common.js';
import { readJsonOrDefault, readSafe } from './scan-utils.js';
import { configuredPaths, inferFeatureFromPath, listFilesUnderRoots, readFeatureRegistry, unique } from './project-config.js';

const PERMISSION_REGEX = /\b[a-z][a-z0-9-]*:[a-z][a-z0-9-]*(?::[a-z][a-z0-9-*]*)+\b/g;

const OWNERSHIP_ARRAY_FIELDS = [
  'apis',
  'screens',
  'dbTables',
  'permissions',
  'components',
  'routes',
  'tests',
  'docs',
  'controllers',
  'services',
  'mappers',
  'domainObjects',
  'apiClients',
  'sqlFiles',
  'mapperXmlFiles',
  'menuSqlFiles',
  'permissionFiles'
];

const OWNERSHIP_KEYS = [
  'backend',
  'frontend',
  'api',
  'ui',
  'database',
  'permissions',
  'menus',
  'components',
  'tests',
  'docs',
  'apiClients',
  'controllers',
  'services',
  'mappers',
  'domainObjects'
];

function normalize(value = '') {
  return String(value).replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/+$/g, '');
}

export function hasRepeatedRoutePath(value = '') {
  const segments = normalize(value)
    .replace(/^\/+|\/+$/g, '')
    .split('/')
    .filter(Boolean);
  if (segments.length < 4 || segments.length % 2 !== 0) {
    return false;
  }
  const midpoint = segments.length / 2;
  return segments.slice(0, midpoint).every((segment, index) => segment === segments[index + midpoint]);
}

function activeFeaturesById(features = readFeatureRegistry()) {
  return new Map((features || []).filter((feature) => feature.status !== 'removed').map((feature) => [feature.id, feature]));
}

function inferFeature(file, text = '', features = readFeatureRegistry()) {
  const fromPath = inferFeatureFromPath(file, features);
  if (fromPath) {
    return fromPath;
  }
  const normalizedFile = normalize(file).toLowerCase();
  const normalizedText = String(text || '').toLowerCase();
  for (const feature of features || []) {
    if (feature.status === 'removed') {
      continue;
    }
    const candidates = [feature.id, feature.name, ...(feature.aliases || [])].filter(Boolean).map((item) => String(item).toLowerCase());
    if (candidates.some((candidate) => normalizedFile.includes(candidate) || normalizedText.includes(candidate))) {
      return feature.id;
    }
  }
  return '';
}

function hasRegisteredPermissionPrefix(code, features) {
  const prefix = String(code).split(':')[0];
  return (features || []).some((feature) => feature.status !== 'removed' && feature.id === prefix);
}

function addValue(bucket, featureId, field, value) {
  if (!featureId || !field || !value) {
    return;
  }
  const normalized = normalize(value);
  if (field === 'routes' && hasRepeatedRoutePath(normalized)) {
    return;
  }
  bucket[featureId] ||= Object.fromEntries(OWNERSHIP_ARRAY_FIELDS.map((key) => [key, []]));
  bucket[featureId][field].push(normalized);
}

function addValues(bucket, featureId, field, values = []) {
  const items = Array.isArray(values) ? values : [values];
  for (const value of items) {
    addValue(bucket, featureId, field, value);
  }
}

function classifyJavaFile(file, text) {
  const normalized = normalize(file);
  const base = path.basename(normalized);
  if (/Controller\.(java|kt)$/.test(base) || /@(RestController|Controller)\b/.test(text)) {
    return 'controllers';
  }
  if (/Mapper\.(java|kt)$/.test(base) || /@Mapper\b/.test(text) || normalized.includes('/mapper/')) {
    return 'mappers';
  }
  if (/Service(?:Impl)?\.(java|kt)$/.test(base) || normalized.includes('/service/')) {
    return 'services';
  }
  if (normalized.includes('/domain/') || normalized.includes('/entity/') || /@(TableName|Entity)\b/.test(text)) {
    return 'domainObjects';
  }
  return '';
}

function isMapperXml(file) {
  const normalized = normalize(file);
  return normalized.endsWith('.xml') && (normalized.includes('/mapper/') || /Mapper\.xml$/.test(normalized));
}

function isFrontendApiFile(file) {
  const normalized = normalize(file);
  return /\.(ts|js)$/.test(normalized) && (
    normalized.startsWith('ruoyi-ui/src/api/')
    || normalized.includes('/api/')
    || normalized.endsWith('.api.ts')
    || normalized.endsWith('.api.js')
  );
}

function isMenuSql(text) {
  return /sys_menu|menu_name|perms\b|parent_id/i.test(text);
}

function scanLiveOwnership(features) {
  const config = configuredPaths();
  const bucket = {};

  const backendFiles = listFilesUnderRoots(config.backendScanRoots, (file) => /\.(java|kt|xml)$/.test(file));
  for (const file of backendFiles) {
    const text = readSafe(file);
    const featureId = inferFeature(file, text, features);
    if (!featureId) {
      continue;
    }
    const field = classifyJavaFile(file, text);
    if (field) {
      addValue(bucket, featureId, field, file);
    }
    if (isMapperXml(file)) {
      addValue(bucket, featureId, 'mapperXmlFiles', file);
    }
  }

  const frontendFiles = listFilesUnderRoots(config.frontendScanRoots, (file) => /\.(ts|tsx|js|jsx|vue)$/.test(file));
  for (const file of frontendFiles) {
    const text = readSafe(file);
    const featureId = inferFeature(file, text, features);
    if (!featureId) {
      continue;
    }
    if (isFrontendApiFile(file)) {
      addValue(bucket, featureId, 'apiClients', file);
    }
    if (file.includes('/components/')) {
      addValue(bucket, featureId, 'components', file);
    }
    for (const match of text.matchAll(PERMISSION_REGEX)) {
      if (!hasRegisteredPermissionPrefix(match[0], features)) {
        continue;
      }
      addValue(bucket, featureId, 'permissions', match[0]);
      addValue(bucket, featureId, 'permissionFiles', file);
    }
  }

  const sqlAndXmlFiles = listFilesUnderRoots(config.dbScanRoots, (file) => /\.(sql|xml)$/.test(file));
  for (const file of sqlAndXmlFiles) {
    const text = readSafe(file);
    const featureId = inferFeature(file, text, features);
    if (!featureId) {
      continue;
    }
    if (file.endsWith('.sql')) {
      addValue(bucket, featureId, 'sqlFiles', file);
      if (isMenuSql(text)) {
        addValue(bucket, featureId, 'menuSqlFiles', file);
      }
      PERMISSION_REGEX.lastIndex = 0;
      if (PERMISSION_REGEX.test(text) || isMenuSql(text)) {
        addValue(bucket, featureId, 'permissionFiles', file);
      }
      PERMISSION_REGEX.lastIndex = 0;
    }
    if (isMapperXml(file)) {
      addValue(bucket, featureId, 'mapperXmlFiles', file);
    }
  }

  return bucket;
}

function scanGeneratedOwnership(bucket, features) {
  const backendRoutes = readJsonOrDefault('ai/generated/backend-routes.json', { routes: [] });
  for (const route of backendRoutes.routes || []) {
    if (!route.module) {
      continue;
    }
    addValue(bucket, route.module, 'routes', route.path);
    addValue(bucket, route.module, 'controllers', route.file);
  }

  const frontendRoutes = readJsonOrDefault('ai/generated/frontend-routes.json', { routes: [] });
  for (const route of frontendRoutes.routes || []) {
    if (!route.module) {
      continue;
    }
    addValue(bucket, route.module, 'routes', route.route);
    addValues(bucket, route.module, 'apis', route.api || []);
  }

  const apiClients = readJsonOrDefault('ai/generated/api-clients.json', { calls: [], moduleContracts: [] });
  for (const call of apiClients.calls || []) {
    if (!call.module) {
      continue;
    }
    addValue(bucket, call.module, 'apiClients', call.file);
    addValue(bucket, call.module, 'apis', call.path);
  }
  for (const contract of apiClients.moduleContracts || []) {
    if (!contract.module) {
      continue;
    }
    addValue(bucket, contract.module, 'apiClients', contract.file);
    addValue(bucket, contract.module, 'apis', contract.api);
  }

  const dbSchema = readJsonOrDefault('ai/generated/db-schema.json', { tables: [] });
  for (const table of dbSchema.tables || []) {
    if (!table.module) {
      continue;
    }
    addValue(bucket, table.module, 'dbTables', table.name);
    addValue(bucket, table.module, table.file?.endsWith('.xml') ? 'mapperXmlFiles' : 'sqlFiles', table.file);
  }

  const permissionScan = readJsonOrDefault('ai/generated/permissions.json', { permissions: [] });
  for (const permission of permissionScan.permissions || []) {
    if (!permission.module) {
      continue;
    }
    addValue(bucket, permission.module, 'permissions', permission.code);
    addValue(bucket, permission.module, 'permissionFiles', permission.file);
    if (permission.file?.endsWith('.sql') && isMenuSql(readSafe(permission.file))) {
      addValue(bucket, permission.module, 'menuSqlFiles', permission.file);
    }
  }

  const componentScan = readJsonOrDefault('ai/generated/component-usage.json', { moduleComponentFiles: [], imports: [] });
  for (const component of componentScan.moduleComponentFiles || []) {
    if (!component.module) {
      continue;
    }
    addValue(bucket, component.module, 'components', component.file);
  }
  for (const imported of componentScan.imports || []) {
    if (!imported.module) {
      continue;
    }
    addValue(bucket, imported.module, 'components', imported.source);
  }

  const active = activeFeaturesById(features);
  for (const featureId of Object.keys(bucket)) {
    if (!active.has(featureId)) {
      delete bucket[featureId];
    }
  }
}

function mergeSorted(existing = [], discovered = []) {
  return unique([...(existing || []), ...(discovered || [])]).sort();
}

function syncTopLevelAndOwnership(feature, discovered) {
  for (const field of OWNERSHIP_ARRAY_FIELDS) {
    const merged = mergeSorted(feature[field], discovered[field]);
    feature[field] = field === 'routes' ? merged.filter((route) => !hasRepeatedRoutePath(route)) : merged;
  }
  feature.ownership ||= {};
  for (const key of OWNERSHIP_KEYS) {
    feature.ownership[key] = Array.isArray(feature.ownership[key]) ? feature.ownership[key] : [];
  }

  feature.ownership.backend = mergeSorted(feature.ownership.backend, feature.backendModules || []);
  feature.ownership.frontend = mergeSorted(feature.ownership.frontend, feature.frontendModules || []);
  feature.ownership.api = mergeSorted(feature.ownership.api, feature.apis || []);
  feature.ownership.ui = mergeSorted(feature.ownership.ui, feature.screens || []);
  feature.ownership.database = mergeSorted(feature.ownership.database, [...(feature.dbTables || []), ...(feature.sqlFiles || [])]);
  feature.ownership.permissions = mergeSorted(feature.ownership.permissions, [...(feature.permissions || []), ...(feature.permissionFiles || [])]);
  feature.ownership.menus = mergeSorted(feature.ownership.menus, feature.menuSqlFiles || []);
  feature.ownership.components = mergeSorted(feature.ownership.components, feature.components || []);
  feature.ownership.tests = mergeSorted(feature.ownership.tests, feature.tests || []);
  feature.ownership.docs = mergeSorted(feature.ownership.docs, feature.docs || []);
  feature.ownership.apiClients = mergeSorted(feature.ownership.apiClients, feature.apiClients || []);
  feature.ownership.controllers = mergeSorted(feature.ownership.controllers, feature.controllers || []);
  feature.ownership.services = mergeSorted(feature.ownership.services, feature.services || []);
  feature.ownership.mappers = mergeSorted(feature.ownership.mappers, [...(feature.mappers || []), ...(feature.mapperXmlFiles || [])]);
  feature.ownership.domainObjects = mergeSorted(feature.ownership.domainObjects, feature.domainObjects || []);
}

function buildNextUiGraph() {
  const graph = readJsonOrDefault('graph/ui-graph.json', { schemaVersion: 1, screens: [] });
  graph.screens = (graph.screens || []).filter((screen) => !hasRepeatedRoutePath(screen.route));
  return graph;
}

function buildNextRegistry() {
  const registry = readJsonOrDefault('ai/registry/features.json', { schemaVersion: 1, features: [] });
  const features = registry.features || [];
  const bucket = scanLiveOwnership(features);
  scanGeneratedOwnership(bucket, features);

  for (const feature of features) {
    if (feature.status === 'removed') {
      continue;
    }
    const discovered = bucket[feature.id] || Object.fromEntries(OWNERSHIP_ARRAY_FIELDS.map((key) => [key, []]));
    syncTopLevelAndOwnership(feature, discovered);
  }
  registry.features = features.sort((a, b) => String(a.id).localeCompare(String(b.id)));
  return registry;
}

export function runOwnershipSync({ checkMode = false } = {}) {
  const errors = [];
  const next = buildNextRegistry();
  writeOrCheck('ai/registry/features.json', formatJson(next), checkMode, errors);
  writeOrCheck('graph/ui-graph.json', formatJson(buildNextUiGraph()), checkMode, errors);
  return errors;
}

if (isCli(import.meta.url)) {
  finish('sync:ownership', runOwnershipSync({ checkMode: process.argv.includes('--check') }));
}
