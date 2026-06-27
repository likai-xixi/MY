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
import { readFeatureRegistry, readProfile } from './project-config.js';

const REQUIRED_UI_STATES = ['loading', 'empty', 'success', 'error'];

function safeReadJson(relativePath, errors) {
  try {
    return readJson(relativePath);
  } catch (error) {
    errors.push(`${relativePath} is not valid JSON: ${error.message}`);
    return null;
  }
}

function asArray(value, label, errors) {
  if (!Array.isArray(value)) {
    errors.push(`${label} must be an array.`);
    return [];
  }
  return value;
}

function ensureUnique(items, label, keyFn, errors) {
  const seen = new Set();
  for (const item of items) {
    const key = keyFn(item);
    if (!key) {
      continue;
    }
    ensure(!seen.has(key), `${label} has duplicate id ${key}.`, errors);
    seen.add(key);
  }
}

function readBoundaryPolicy() {
  try {
    return readJson('ai/rules/module-boundary.json');
  } catch {
    return {};
  }
}

function realBackendRouteSources(policy = readBoundaryPolicy()) {
  const configured = policy.apiFactSources?.realBackendRouteSources;
  return new Set(Array.isArray(configured) && configured.length ? configured : ['java-annotation', 'js-router']);
}

function templateRoutePlaceholdersAllowed(profile = readProfile(), policy = readBoundaryPolicy()) {
  return (
    profile.templateSetup === true &&
    profile.locked !== true &&
    policy.apiFactSources?.allowMissingGeneratedRouteWhenTemplateSetup !== false
  );
}

function normalizedPath(value = '') {
  const withSlash = String(value).trim();
  if (!withSlash) {
    return '';
  }
  return withSlash.startsWith('/') ? withSlash : `/${withSlash}`;
}

function methodMatches(routeMethod = '', endpointMethod = '') {
  const route = String(routeMethod).toUpperCase();
  const endpoint = String(endpointMethod).toUpperCase();
  return route === endpoint || route === 'ANY';
}

function endpointRouteKey(method = '', path = '', module = '') {
  return `${String(method).toUpperCase()} ${normalizedPath(path)} ${module || ''}`;
}

function findMatchingBackendRoute(endpoint, backendRoutes = { routes: [] }) {
  return (backendRoutes.routes || []).find((route) => (
    methodMatches(route.method, endpoint.method) &&
    normalizedPath(route.path) === normalizedPath(endpoint.path) &&
    (!endpoint.module || route.module === endpoint.module)
  ));
}

function isRealScannedBackendRoute(route, sources) {
  return Boolean(route.file) && sources.has(route.source);
}

export function validateApiRouteScanConsistency({ endpoints = [], catalog = new Map(), backendRoutes = { routes: [] }, profile = readProfile(), policy = readBoundaryPolicy() } = {}) {
  const errors = [];
  if (templateRoutePlaceholdersAllowed(profile, policy)) {
    return errors;
  }

  const sources = realBackendRouteSources(policy);
  const routes = Array.isArray(backendRoutes.routes) ? backendRoutes.routes : [];

  for (const endpoint of endpoints) {
    if (!endpoint.id || !endpoint.method || !endpoint.path) {
      continue;
    }
    const catalogEntry = catalog.get(endpoint.id);
    if (!catalogEntry) {
      continue;
    }

    const matchingRoutes = routes.filter((route) => (
      methodMatches(route.method, endpoint.method) &&
      normalizedPath(route.path) === normalizedPath(endpoint.path) &&
      (!endpoint.module || route.module === endpoint.module)
    ));

    ensure(
      matchingRoutes.some((route) => isRealScannedBackendRoute(route, sources)),
      `api endpoint ${endpoint.id} declares ${endpoint.method} ${endpoint.path} in graph/API catalog but ai/generated/backend-routes.json has no real scanned backend route source. Add route code and run npm run scan:backend-routes, or keep this only while ai/project-profile.json templateSetup=true.`,
      errors
    );
  }

  return errors;
}

export function validateApiPermissionConsistency({ endpoints = [], backendRoutes = { routes: [] }, features = readFeatureRegistry(), highRiskCoverage = { entries: [] } } = {}) {
  const errors = [];
  const featuresById = new Map((features || []).filter((feature) => feature.status !== 'removed').map((feature) => [feature.id, feature]));
  const highRiskByApi = new Map((highRiskCoverage.entries || []).map((entry) => [
    entry.method ? endpointRouteKey(entry.method, entry.api) : normalizedPath(entry.api),
    entry
  ]));

  for (const endpoint of endpoints) {
    const route = findMatchingBackendRoute(endpoint, backendRoutes);
    const routePermission = route?.permission || '';
    if (routePermission) {
      ensure(endpoint.permission === routePermission, `api endpoint ${endpoint.id} permission must match backend route permission ${routePermission}.`, errors);
      const feature = featuresById.get(endpoint.module);
      if (feature) {
        ensure((feature.permissions || []).includes(routePermission), `api endpoint ${endpoint.id} permission ${routePermission} is missing from feature ${feature.id}.permissions.`, errors);
      }
    }

    const highRisk = highRiskByApi.get(endpointRouteKey(endpoint.method, endpoint.path)) || highRiskByApi.get(normalizedPath(endpoint.path));
    if (highRisk && String(highRisk.status || '') === 'required') {
      ensure(endpoint.permission === highRisk.backendPermission, `high-risk api endpoint ${endpoint.id} permission must match ${highRisk.backendPermission}.`, errors);
      ensure(endpoint.riskDomain === highRisk.riskDomain, `high-risk api endpoint ${endpoint.id} riskDomain must be ${highRisk.riskDomain}.`, errors);
    }
    if (endpoint.riskDomain) {
      ensure(Boolean(highRisk), `api endpoint ${endpoint.id} declares riskDomain ${endpoint.riskDomain} but is missing from ai/registry/high-risk-permission-coverage.json.`, errors);
    }
  }

  for (const entry of highRiskCoverage.entries || []) {
    if (entry.status !== 'required') {
      continue;
    }
    const endpoint = endpoints.find((candidate) => (
      normalizedPath(candidate.path) === normalizedPath(entry.api) &&
      (!entry.method || String(candidate.method).toUpperCase() === String(entry.method).toUpperCase())
    ));
    ensure(Boolean(endpoint), `high-risk permission coverage ${entry.api} is missing from graph/api-graph.json.`, errors);
  }

  const seenMethodPaths = new Set();
  for (const route of backendRoutes.routes || []) {
    if (!route.permission) {
      continue;
    }
    const key = endpointRouteKey(route.method, route.path, route.module);
    if (seenMethodPaths.has(key)) {
      continue;
    }
    seenMethodPaths.add(key);
    const endpoint = endpoints.find((candidate) => (
      methodMatches(route.method, candidate.method) &&
      normalizedPath(route.path) === normalizedPath(candidate.path) &&
      (!candidate.module || route.module === candidate.module)
    ));
    if (endpoint && !endpoint.permission) {
      errors.push(`api endpoint ${endpoint.id} has backend permission ${route.permission} but graph/api-graph.json is missing permission.`);
    }
  }

  return errors;
}

export function parseApiCatalog(text) {
  const entries = new Map();
  let current = null;
  for (const line of text.split(/\r?\n/)) {
    const heading = line.match(/^##\s+(.+?)\s*$/);
    if (heading) {
      current = {
        id: heading[1].replace(/`/g, '').trim(),
        method: '',
        path: '',
        owner: '',
        module: ''
      };
      entries.set(current.id, current);
      continue;
    }
    if (!current) {
      continue;
    }
    const field = line.match(/^-\s+([A-Za-z ]+):\s+`?([^`]+?)`?\s*$/);
    if (!field) {
      continue;
    }
    const key = field[1].toLowerCase().replace(/\s+/g, '');
    if (key === 'method') current.method = field[2].trim();
    if (key === 'path') current.path = field[2].trim();
    if (key === 'owner') current.owner = field[2].trim();
    if (key === 'module') current.module = field[2].trim();
  }
  return entries;
}

export function parseFrontendModule(text) {
  const id = text.match(/\bid:\s*['"]([^'"]+)['"]/)?.[1] || '';
  const route = text.match(/\broute:\s*['"]([^'"]+)['"]/)?.[1] || '';
  const api = text.match(/\bapi:\s*['"]([^'"]+)['"]/)?.[1] || '';
  const statesBlock = text.match(/\bstates:\s*\[([^\]]*)\]/s)?.[1] || '';
  const states = [...statesBlock.matchAll(/['"]([^'"]+)['"]/g)].map((match) => match[1]);
  return { id, route, api, states };
}

export function validateGraphs() {
  const errors = [];
  const moduleGraph = safeReadJson('graph/module-graph.json', errors);
  const apiGraph = safeReadJson('graph/api-graph.json', errors);
  const uiGraph = safeReadJson('graph/ui-graph.json', errors);
  if (!moduleGraph || !apiGraph || !uiGraph) {
    return errors;
  }

  ensure(moduleGraph.schemaVersion === 1, 'module graph schemaVersion must be 1.', errors);
  const moduleNodes = asArray(moduleGraph.nodes, 'module graph nodes', errors);
  const moduleEdges = asArray(moduleGraph.edges, 'module graph edges', errors);
  ensureUnique(moduleNodes, 'module graph nodes', (node) => node.id, errors);

  const nodeIds = new Set(moduleNodes.map((node) => node.id));
  const features = readFeatureRegistry();
  const allowedBackendPaths = new Set(features.flatMap((feature) => feature.backendModules || []));
  const allowedFrontendPaths = new Set(features.flatMap((feature) => feature.frontendModules || []));
  for (const node of moduleNodes) {
    ensure(Boolean(node.id), 'module graph node is missing id.', errors);
    ensure(Boolean(node.type), `module graph node ${node.id} is missing type.`, errors);
    ensure(Boolean(node.path), `module graph node ${node.id} is missing path.`, errors);
    ensure(Boolean(node.description), `module graph node ${node.id} is missing description.`, errors);
    if (node.path) {
      ensure(fileExists(node.path), `module graph node ${node.id} path does not exist: ${node.path}.`, errors);
    }
    if (node.type === 'backend-module') {
      const genericBackendPath = /^backend\/modules\/[^/]+$/.test(node.path);
      const registeredBackendPath = allowedBackendPaths.has(node.path);
      ensure(genericBackendPath || registeredBackendPath, `backend module node ${node.id} must live under a registered backend module path.`, errors);
    }
    if (node.type === 'frontend-module') {
      const genericFrontendPath = /^frontend\/src\/modules\/[^/]+$/.test(node.path);
      const registeredFrontendPath = allowedFrontendPaths.has(node.path);
      ensure(genericFrontendPath || registeredFrontendPath, `frontend module node ${node.id} must live under a registered frontend module path.`, errors);
    }
  }

  const edgeIds = new Set();
  for (const edge of moduleEdges) {
    const edgeId = `${edge.from}->${edge.to}:${edge.type}`;
    ensure(!edgeIds.has(edgeId), `module graph edge is duplicated: ${edgeId}.`, errors);
    edgeIds.add(edgeId);
    ensure(nodeIds.has(edge.from), `module graph edge has unknown from node ${edge.from}.`, errors);
    ensure(nodeIds.has(edge.to), `module graph edge has unknown to node ${edge.to}.`, errors);
    ensure(Boolean(edge.type), `module graph edge ${edge.from}->${edge.to} is missing type.`, errors);
  }

  for (const featureFile of listFiles('features', (file) => file.endsWith('.md') && !file.endsWith('/_template.md'))) {
    const slug = featureFile.replace(/^features\//, '').replace(/\.md$/, '');
    ensure(nodeIds.has(`feature:${slug}`), `feature ${featureFile} is missing feature:${slug} in module graph.`, errors);
  }

  for (const slug of listDirectories('backend/modules')) {
    ensure(nodeIds.has(`backend:${slug}`), `backend module ${slug} is missing backend:${slug} in module graph.`, errors);
    for (const layer of ['api', 'service', 'domain', 'repository']) {
      ensure(fileExists(`backend/modules/${slug}/${layer}/README.md`), `backend module ${slug} is missing ${layer}/README.md.`, errors);
    }
  }

  for (const slug of listDirectories('frontend/src/modules')) {
    ensure(nodeIds.has(`frontend:${slug}`), `frontend module ${slug} is missing frontend:${slug} in module graph.`, errors);
  }

  ensure(apiGraph.schemaVersion === 1, 'api graph schemaVersion must be 1.', errors);
  const endpoints = asArray(apiGraph.endpoints, 'api graph endpoints', errors);
  ensureUnique(endpoints, 'api graph endpoints', (endpoint) => endpoint.id, errors);

  const catalog = parseApiCatalog(readText('memory/API_CATALOG.md'));
  const backendRoutes = safeReadJson('ai/generated/backend-routes.json', errors);
  const apiIds = new Set(endpoints.map((endpoint) => endpoint.id));
  const methodPathIds = new Set();
  for (const endpoint of endpoints) {
    ensure(Boolean(endpoint.id), 'api endpoint is missing id.', errors);
    ensure(Boolean(endpoint.method), `api endpoint ${endpoint.id} is missing method.`, errors);
    ensure(Boolean(endpoint.path), `api endpoint ${endpoint.id} is missing path.`, errors);
    ensure(Boolean(endpoint.owner), `api endpoint ${endpoint.id} is missing owner.`, errors);
    ensure(Boolean(endpoint.module), `api endpoint ${endpoint.id} is missing module.`, errors);
    const methodPathId = `${endpoint.method} ${endpoint.path}`;
    ensure(!methodPathIds.has(methodPathId), `api graph has duplicate method/path ${methodPathId}.`, errors);
    methodPathIds.add(methodPathId);
    if (endpoint.module) {
      ensure(nodeIds.has(`backend:${endpoint.module}`), `api endpoint ${endpoint.id} references missing backend module ${endpoint.module}.`, errors);
    }
    const catalogEntry = catalog.get(endpoint.id);
    ensure(Boolean(catalogEntry), `api endpoint ${endpoint.id} is missing from memory/API_CATALOG.md.`, errors);
    if (catalogEntry) {
      ensure(catalogEntry.method === endpoint.method, `api catalog method for ${endpoint.id} does not match api graph.`, errors);
      ensure(catalogEntry.path === endpoint.path, `api catalog path for ${endpoint.id} does not match api graph.`, errors);
      ensure(catalogEntry.owner === endpoint.owner, `api catalog owner for ${endpoint.id} does not match api graph.`, errors);
      ensure(catalogEntry.module === endpoint.module, `api catalog module for ${endpoint.id} does not match api graph.`, errors);
    }
  }
  for (const catalogId of catalog.keys()) {
    ensure(apiIds.has(catalogId), `api catalog entry ${catalogId} is missing from graph/api-graph.json.`, errors);
  }
  if (backendRoutes) {
    errors.push(...validateApiRouteScanConsistency({ endpoints, catalog, backendRoutes }));
    const highRiskCoverage = safeReadJson('ai/registry/high-risk-permission-coverage.json', errors);
    if (highRiskCoverage) {
      errors.push(...validateApiPermissionConsistency({ endpoints, backendRoutes, features, highRiskCoverage }));
    }
  }

  ensure(uiGraph.schemaVersion === 1, 'ui graph schemaVersion must be 1.', errors);
  const screens = asArray(uiGraph.screens, 'ui graph screens', errors);
  ensureUnique(screens, 'ui graph screens', (screen) => screen.id, errors);
  const screenIds = new Set(screens.map((screen) => screen.id));
  const screenByModule = new Map(screens.map((screen) => [screen.module, screen]));

  for (const endpoint of endpoints) {
    for (const consumer of endpoint.consumers || []) {
      ensure(screenIds.has(consumer), `api endpoint ${endpoint.id} references unknown consumer screen ${consumer}.`, errors);
    }
  }

  for (const screen of screens) {
    ensure(Boolean(screen.id), 'ui screen is missing id.', errors);
    ensure(Boolean(screen.route), `ui screen ${screen.id} is missing route.`, errors);
    ensure(Boolean(screen.owner), `ui screen ${screen.id} is missing owner.`, errors);
    ensure(Boolean(screen.module), `ui screen ${screen.id} is missing module.`, errors);
    if (screen.virtual === true) {
      ensure(Boolean(screen.reason), `virtual ui screen ${screen.id} must include reason.`, errors);
    } else {
      ensure(Boolean(screen.file), `ui screen ${screen.id} must have a real file or declare virtual: true with reason.`, errors);
      if (screen.file) {
        ensure(fileExists(screen.file), `ui screen ${screen.id} file does not exist: ${screen.file}.`, errors);
        ensure(
          /^ruoyi-ui\/src\/views\/.+\.(vue|tsx|jsx|ts|js)$/.test(screen.file) || /^frontend\/src\/modules\/.+\.(vue|tsx|jsx|ts|js)$/.test(screen.file),
          `ui screen ${screen.id} file must be a frontend view/module file, not ${screen.file}.`,
          errors
        );
      }
    }
    if (screen.module) {
      ensure(nodeIds.has(`frontend:${screen.module}`), `ui screen ${screen.id} references missing frontend module ${screen.module}.`, errors);
    }
    const states = asArray(screen.states || [], `ui screen ${screen.id} states`, errors);
    for (const state of REQUIRED_UI_STATES) {
      ensure(states.includes(state), `ui screen ${screen.id} must include ${state} state.`, errors);
    }
    for (const apiId of screen.usesApi || []) {
      ensure(apiIds.has(apiId), `ui screen ${screen.id} references unknown API ${apiId}.`, errors);
    }
  }

  for (const moduleFile of listFiles('frontend/src/modules', (file) => file.endsWith('/module.ts'))) {
    const moduleContract = parseFrontendModule(readText(moduleFile));
    ensure(Boolean(moduleContract.id), `${moduleFile} is missing id.`, errors);
    if (!moduleContract.id) {
      continue;
    }
    const screen = screenByModule.get(moduleContract.id);
    ensure(Boolean(screen), `${moduleFile} has no matching ui graph screen for module ${moduleContract.id}.`, errors);
    if (screen) {
      ensure(screen.route === moduleContract.route, `${moduleFile} route does not match ui graph.`, errors);
      if (moduleContract.api) {
        ensure(screen.usesApi.includes(moduleContract.api), `${moduleFile} api ${moduleContract.api} is not listed in ui graph.`, errors);
        ensure(apiIds.has(moduleContract.api), `${moduleFile} api ${moduleContract.api} is missing from api graph.`, errors);
      }
      for (const state of REQUIRED_UI_STATES) {
        ensure(moduleContract.states.includes(state), `${moduleFile} must include ${state} state.`, errors);
      }
    }
  }

  return errors;
}

if (isCli(import.meta.url)) {
  finish('check:graph', validateGraphs());
}
