import {
  ensure,
  fileExists,
  finish,
  isCli,
  listDirectories,
  listFiles,
  readJson,
  readText
} from './common.js';
import { parseApiCatalog } from './dependency-checker.js';
import { readJsonOrDefault } from './scan-utils.js';
import { configuredPaths, inferFeatureFromPath, normalizePath } from './project-config.js';

function readJsonSafe(relativePath, fallback, errors) {
  try {
    return readJson(relativePath);
  } catch (error) {
    errors.push(`${relativePath} is not valid JSON or is missing: ${error.message}`);
    return fallback;
  }
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function assertUnique(items, label, keyFn, errors) {
  const seen = new Set();
  for (const item of items) {
    const key = keyFn(item);
    ensure(Boolean(key), `${label} item is missing id.`, errors);
    if (!key) {
      continue;
    }
    ensure(!seen.has(key), `${label} has duplicate id ${key}.`, errors);
    seen.add(key);
  }
}

function arrayField(object, field, label, errors) {
  if (!Array.isArray(object[field])) {
    errors.push(`${label}.${field} must be an array.`);
    return [];
  }
  return object[field];
}

function optionalArrayField(object, field, label, errors) {
  if (object[field] === undefined) {
    return [];
  }
  return arrayField(object, field, label, errors);
}

function moduleRegistryPaths(module) {
  return unique([
    module.backendPath,
    module.frontendPath,
    ...(module.paths || [])
  ].map((item) => item && normalizePath(item)));
}

export function routeShape(route) {
  const normalized = String(route || '').replace(/\\/g, '/').replace(/\/+/g, '/').replace(/\/$/g, '') || '/';
  return normalized.replace(/\{[^/{}]+\}/g, '{}');
}

export function hasRouteCoverage(route, coverage) {
  const exact = String(route || '');
  const shape = routeShape(route);
  return coverage.uiRoutes.has(exact)
    || coverage.apiPaths.has(exact)
    || coverage.backendPaths.has(exact)
    || coverage.uiRouteShapes.has(shape)
    || coverage.apiPathShapes.has(shape)
    || coverage.backendPathShapes.has(shape);
}

export function validateModuleRegistry({ read = readJson, exists = fileExists, directories = listDirectories } = {}) {
  const errors = [];
  let registry;
  let featureRegistry;
  try {
    registry = read('ai/registry/modules.json');
  } catch (error) {
    errors.push(`ai/registry/modules.json is not valid JSON or is missing: ${error.message}`);
    return errors;
  }
  try {
    featureRegistry = read('ai/registry/features.json');
  } catch (error) {
    errors.push(`ai/registry/features.json is not valid JSON or is missing: ${error.message}`);
    return errors;
  }

  ensure(registry.schemaVersion === 1, 'ai/registry/modules.json schemaVersion must be 1.', errors);
  ensure(Array.isArray(registry.modules), 'ai/registry/modules.json modules must be an array.', errors);
  const modules = Array.isArray(registry.modules) ? registry.modules : [];
  assertUnique(modules, 'module registry', (module) => module.id, errors);

  const activeFeatures = Array.isArray(featureRegistry.features)
    ? featureRegistry.features.filter((feature) => feature.status !== 'removed')
    : [];
  const featuresById = new Map(activeFeatures.map((feature) => [feature.id, feature]));
  const registeredBackendPaths = new Set();

  for (const module of modules) {
    ensure(Boolean(module.id), 'module registry item is missing id.', errors);
    ensure(Boolean(module.feature), `module registry ${module.id || '<missing>'} is missing feature.`, errors);
    ensure(Boolean(module.type), `module registry ${module.id || '<missing>'} is missing type.`, errors);
    ensure(Boolean(module.owner), `module registry ${module.id || '<missing>'} is missing owner.`, errors);

    const feature = featuresById.get(module.feature);
    ensure(Boolean(feature), `module registry ${module.id || '<missing>'} references unknown active feature ${module.feature || '<missing>'}.`, errors);

    if (module.backendPath) {
      const backendPath = normalizePath(module.backendPath);
      registeredBackendPaths.add(backendPath);
      ensure(exists(backendPath), `module registry ${module.id} backendPath does not exist: ${backendPath}.`, errors);
      if (feature) {
        ensure((feature.backendModules || []).map(normalizePath).includes(backendPath), `module registry ${module.id} backendPath ${backendPath} is not declared in feature ${feature.id}.backendModules.`, errors);
      }
    }

    if (module.frontendPath) {
      const frontendPath = normalizePath(module.frontendPath);
      ensure(exists(frontendPath), `module registry ${module.id} frontendPath does not exist: ${frontendPath}.`, errors);
      if (feature) {
        ensure((feature.frontendModules || []).map(normalizePath).includes(frontendPath), `module registry ${module.id} frontendPath ${frontendPath} is not declared in feature ${feature.id}.frontendModules.`, errors);
      }
    }

    for (const registeredPath of moduleRegistryPaths(module)) {
      if (registeredPath.startsWith('backend/modules/')) {
        registeredBackendPaths.add(registeredPath);
        ensure(exists(registeredPath), `module registry ${module.id} path does not exist: ${registeredPath}.`, errors);
        if (feature && registeredPath !== normalizePath(module.backendPath || '')) {
          ensure((feature.backendModules || []).map(normalizePath).includes(registeredPath), `module registry ${module.id} path ${registeredPath} is not declared in feature ${feature.id}.backendModules.`, errors);
        }
      }
    }
  }

  for (const slug of directories('backend/modules')) {
    const modulePath = `backend/modules/${slug}`;
    ensure(registeredBackendPaths.has(modulePath), `${modulePath} exists but is missing from ai/registry/modules.json.`, errors);
  }

  return unique(errors);
}

function validateFeatureLedger(errors) {
  const config = configuredPaths();
  const registry = readJsonSafe('ai/registry/features.json', { features: [] }, errors);
  const moduleGraph = readJsonSafe('graph/module-graph.json', { nodes: [] }, errors);
  const apiGraph = readJsonSafe('graph/api-graph.json', { endpoints: [] }, errors);
  const uiGraph = readJsonSafe('graph/ui-graph.json', { screens: [] }, errors);
  const backendRoutes = readJsonSafe('ai/generated/backend-routes.json', { routes: [] }, errors);
  const catalog = parseApiCatalog(readText('memory/API_CATALOG.md'));
  const components = readJsonOrDefault('ai/registry/components.json', { components: [] });
  const sharedCatalog = readJsonOrDefault('frontend/src/components/catalog.json', { components: [] });

  ensure(registry.schemaVersion === 1, 'ai/registry/features.json schemaVersion must be 1.', errors);
  ensure(Array.isArray(registry.features), 'ai/registry/features.json features must be an array.', errors);
  if (!Array.isArray(registry.features)) {
    return;
  }

  assertUnique(registry.features, 'feature registry', (feature) => feature.id, errors);
  const activeFeatures = registry.features.filter((feature) => feature.status !== 'removed');
  const featureIds = new Set(activeFeatures.map((feature) => feature.id));
  const apiIds = new Set((apiGraph.endpoints || []).map((endpoint) => endpoint.id));
  const apiPaths = new Set((apiGraph.endpoints || []).map((endpoint) => endpoint.path));
  const screenIds = new Set((uiGraph.screens || []).map((screen) => screen.id));
  const routes = new Set((uiGraph.screens || []).map((screen) => screen.route));
  const backendPaths = new Set((backendRoutes.routes || []).map((route) => route.path));
  const routeCoverage = {
    uiRoutes: routes,
    apiPaths,
    backendPaths,
    uiRouteShapes: new Set([...routes].map(routeShape)),
    apiPathShapes: new Set([...apiPaths].map(routeShape)),
    backendPathShapes: new Set([...backendPaths].map(routeShape))
  };
  const nodeIds = new Set((moduleGraph.nodes || []).map((node) => node.id));
  const componentIds = new Set([
    ...(components.components || []).flatMap((component) => [component.id, component.name]),
    ...(sharedCatalog.components || []).flatMap((component) => [component.id, component.name])
  ].filter(Boolean));

  for (const feature of registry.features) {
    ensure(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(feature.id || ''), `feature ${feature.id || '<missing>'} id must use lowercase ASCII kebab-case.`, errors);
    ensure(Boolean(feature.name), `feature ${feature.id} is missing name.`, errors);
    ensure(['planned', 'active', 'deprecated', 'removed'].includes(feature.status), `feature ${feature.id} has invalid status ${feature.status}.`, errors);
    if (feature.status === 'removed') {
      continue;
    }

    ensure(Boolean(feature.featureBrief), `feature ${feature.id} is missing featureBrief.`, errors);
    if (feature.featureBrief) {
      ensure(fileExists(feature.featureBrief), `feature ${feature.id} featureBrief does not exist: ${feature.featureBrief}.`, errors);
    }

    for (const field of ['backendModules', 'frontendModules', 'apis', 'screens', 'dbTables', 'permissions', 'components', 'routes', 'tests', 'docs', 'controllers', 'services', 'mappers', 'domainObjects', 'apiClients', 'sqlFiles', 'mapperXmlFiles', 'menuSqlFiles', 'permissionFiles']) {
      arrayField(feature, field, `feature ${feature.id}`, errors);
    }
    for (const field of ['aliases']) {
      optionalArrayField(feature, field, `feature ${feature.id}`, errors);
    }

    for (const modulePath of feature.backendModules || []) {
      ensure(fileExists(modulePath), `feature ${feature.id} backend module path does not exist: ${modulePath}.`, errors);
      ensure(nodeIds.has(`backend:${feature.id}`), `feature ${feature.id} backend ownership is missing from module graph.`, errors);
    }
    for (const modulePath of feature.frontendModules || []) {
      ensure(fileExists(modulePath), `feature ${feature.id} frontend module path does not exist: ${modulePath}.`, errors);
      ensure(nodeIds.has(`frontend:${feature.id}`), `feature ${feature.id} frontend ownership is missing from module graph.`, errors);
    }
    for (const apiId of feature.apis || []) {
      ensure(apiIds.has(apiId), `feature ${feature.id} references unknown API ${apiId}.`, errors);
      ensure(catalog.has(apiId), `feature ${feature.id} API ${apiId} is missing from memory/API_CATALOG.md.`, errors);
    }
    for (const screenId of feature.screens || []) {
      ensure(screenIds.has(screenId), `feature ${feature.id} references unknown UI screen ${screenId}.`, errors);
    }
    for (const route of feature.routes || []) {
      ensure(hasRouteCoverage(route, routeCoverage), `feature ${feature.id} route ${route} is missing from graph/ui-graph.json, graph/api-graph.json, or ai/generated/backend-routes.json.`, errors);
    }
    for (const component of feature.components || []) {
      ensure(componentIds.has(component), `feature ${feature.id} references unknown component ${component}.`, errors);
    }
    for (const doc of feature.docs || []) {
      ensure(fileExists(doc), `feature ${feature.id} doc does not exist: ${doc}.`, errors);
    }
    for (const ownedFile of [...(feature.controllers || []), ...(feature.services || []), ...(feature.mappers || []), ...(feature.domainObjects || []), ...(feature.apiClients || []), ...(feature.sqlFiles || []), ...(feature.mapperXmlFiles || []), ...(feature.menuSqlFiles || []), ...(feature.permissionFiles || []), ...(feature.tests || [])]) {
      ensure(fileExists(ownedFile), `feature ${feature.id} owned file does not exist: ${ownedFile}.`, errors);
    }
  }

  for (const featureFile of listFiles('features', (file) => file.endsWith('.md') && !file.endsWith('/_template.md'))) {
    const id = featureFile.replace(/^features\//, '').replace(/\.md$/, '');
    ensure(featureIds.has(id), `${featureFile} exists but is missing from ai/registry/features.json.`, errors);
  }

  if (config.adapter === 'generic') {
    for (const slug of listDirectories('backend/modules')) {
      ensure(activeFeatures.some((feature) => (feature.backendModules || []).includes(`backend/modules/${slug}`)), `backend/modules/${slug} exists but is not owned by any active feature registry entry.`, errors);
    }
    for (const slug of listDirectories('frontend/src/modules')) {
      ensure(activeFeatures.some((feature) => (feature.frontendModules || []).includes(`frontend/src/modules/${slug}`)), `frontend/src/modules/${slug} exists but is not owned by any active feature registry entry.`, errors);
    }
  } else {
    const generated = readJsonOrDefault('ai/generated/component-usage.json', { moduleComponentFiles: [] });
    for (const component of generated.moduleComponentFiles || []) {
      const featureId = component.module || inferFeatureFromPath(component.file, activeFeatures);
      ensure(!featureId || featureIds.has(featureId), `${component.file} appears to be feature-owned but is not registered to an active feature.`, errors);
    }
  }

  for (const endpoint of apiGraph.endpoints || []) {
    ensure(activeFeatures.some((feature) => feature.id === endpoint.module || (feature.apis || []).includes(endpoint.id)), `API ${endpoint.id} is not owned by any active feature registry entry.`, errors);
  }
  for (const screen of uiGraph.screens || []) {
    ensure(activeFeatures.some((feature) => feature.id === screen.module || (feature.screens || []).includes(screen.id)), `UI screen ${screen.id} is not owned by any active feature registry entry.`, errors);
  }
}

function validateComponentRegistry(errors) {
  const registry = readJsonSafe('ai/registry/components.json', { components: [] }, errors);
  ensure(registry.schemaVersion === 1, 'ai/registry/components.json schemaVersion must be 1.', errors);
  ensure(Array.isArray(registry.components), 'ai/registry/components.json components must be an array.', errors);
  if (!Array.isArray(registry.components)) {
    return;
  }
  assertUnique(registry.components, 'component registry', (component) => component.id, errors);
  for (const component of registry.components) {
    ensure(Boolean(component.name), `component ${component.id} is missing name.`, errors);
    ensure(Boolean(component.path), `component ${component.id} is missing path.`, errors);
    if (component.path) {
      ensure(fileExists(component.path), `component ${component.id} path does not exist: ${component.path}.`, errors);
    }
    ensure(Boolean(component.purpose), `component ${component.id} is missing purpose.`, errors);
    ensure(Array.isArray(component.usedBy), `component ${component.id} usedBy must be an array.`, errors);
    if (component.aliases !== undefined) {
      ensure(Array.isArray(component.aliases), `component ${component.id} aliases must be an array.`, errors);
    }
    if (component.props !== undefined) {
      ensure(Array.isArray(component.props), `component ${component.id} props must be an array.`, errors);
    }
    ensure(Boolean(component.status || component.lifecycle), `component ${component.id} must include status or lifecycle.`, errors);
  }
}

function validateDbAndPermissionLedgers(errors) {
  const db = readJsonSafe('ai/registry/db.json', { tables: [] }, errors);
  ensure(db.schemaVersion === 1, 'ai/registry/db.json schemaVersion must be 1.', errors);
  ensure(Array.isArray(db.tables), 'ai/registry/db.json tables must be an array.', errors);
  if (Array.isArray(db.tables)) {
    assertUnique(db.tables, 'db registry', (table) => table.name || table.id, errors);
    for (const table of db.tables) {
      ensure(Boolean(table.ownerFeature || table.feature), `db table ${table.name || table.id || '<missing>'} is missing ownerFeature.`, errors);
    }
  }

  const permissions = readJsonSafe('ai/registry/permissions.json', { permissions: [] }, errors);
  ensure(permissions.schemaVersion === 1, 'ai/registry/permissions.json schemaVersion must be 1.', errors);
  ensure(Array.isArray(permissions.permissions), 'ai/registry/permissions.json permissions must be an array.', errors);
  if (Array.isArray(permissions.permissions)) {
    assertUnique(permissions.permissions, 'permission registry', (permission) => permission.code || permission.id, errors);
    for (const permission of permissions.permissions) {
      ensure(Boolean(permission.ownerFeature || permission.feature), `permission ${permission.code || permission.id || '<missing>'} is missing ownerFeature.`, errors);
    }
  }
}


function validateFeatureIdDictionary(errors) {
  const dictionary = readJsonSafe('ai/registry/feature-id-dictionary.json', { aliases: [] }, errors);
  if (!dictionary || !Array.isArray(dictionary.aliases)) {
    errors.push('ai/registry/feature-id-dictionary.json aliases must be an array.');
    return;
  }
  const ids = new Set();
  for (const entry of dictionary.aliases) {
    ensure(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(entry.id || ''), `feature-id dictionary entry ${entry.name || '<missing>'} has invalid id ${entry.id || '<missing>'}.`, errors);
    ensure(Boolean(entry.name), `feature-id dictionary entry ${entry.id || '<missing>'} is missing name.`, errors);
    ensure(Array.isArray(entry.aliases), `feature-id dictionary entry ${entry.id || '<missing>'} aliases must be an array.`, errors);
    if (entry.id) {
      ensure(!ids.has(entry.id), `feature-id dictionary has duplicate id ${entry.id}.`, errors);
      ids.add(entry.id);
    }
  }
}

function validateGeneratedFiles(errors) {
  for (const file of [
    'ai/generated/backend-routes.json',
    'ai/generated/frontend-routes.json',
    'ai/generated/api-clients.json',
    'ai/generated/db-schema.json',
    'ai/generated/permissions.json',
    'ai/generated/component-usage.json'
  ]) {
    ensure(fileExists(file), `${file} is missing. Run npm run scan:all.`, errors);
  }
}

export function validateRegistry() {
  const errors = [];
  validateFeatureLedger(errors);
  errors.push(...validateModuleRegistry());
  validateComponentRegistry(errors);
  validateDbAndPermissionLedgers(errors);
  validateFeatureIdDictionary(errors);
  validateGeneratedFiles(errors);
  return unique(errors);
}

if (isCli(import.meta.url)) {
  finish('check:registry', validateRegistry());
}
