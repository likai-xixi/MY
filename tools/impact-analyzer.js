import { finish, formatJson, isCli, listFiles, readJson, readText, writeOrCheck } from './common.js';
import { parseFrontendModule } from './dependency-checker.js';
import { normalizeFeatureId, normalizeFeatureNameForMatch, parseFeatureInput, resolveFeatureIdentity, slugify } from '../scripts/new-feature.js';
import { readJsonOrDefault } from './scan-utils.js';
import { featurePaths, inferFeatureFromPath } from './project-config.js';

const TEXT_EXTENSIONS = /\.(md|js|jsx|json|ya?ml|ts|tsx|vue|java|kt|sql|xml|sh|css|scss)$/;

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function featureTokens(feature) {
  const slug = feature.id || feature;
  const name = feature.name || feature;
  return unique([
    slug,
    slug.replace(/-/g, '_'),
    name,
    ...(feature.apis || []),
    ...(feature.screens || []),
    ...(feature.dbTables || []),
    ...(feature.permissions || []),
    ...(feature.routes || []),
    ...(feature.components || [])
  ]);
}

function findReferences(tokens) {
  if (tokens.length === 0) {
    return [];
  }
  return listFiles('.', (file) => {
    if (file.startsWith('node_modules/') || file.startsWith('.git/')) {
      return false;
    }
    return TEXT_EXTENSIONS.test(file);
  }).filter((file) => {
    const text = readText(file);
    return tokens.some((token) => token && text.includes(token));
  });
}

function readFeatureFromRegistry(input) {
  const registry = readJsonOrDefault('ai/registry/features.json', { features: [] });
  const parsed = parseFeatureInput(input);
  const identity = resolveFeatureIdentity({ id: parsed.id, name: parsed.name || input });
  const requestedId = normalizeFeatureId(parsed.id || identity.id || input);
  const requestedName = normalizeFeatureNameForMatch(parsed.name || input);
  return (registry.features || []).find((feature) => {
    const names = [feature.name, ...(feature.aliases || [])].filter(Boolean).map(normalizeFeatureNameForMatch);
    return feature.id === requestedId
      || names.includes(requestedName)
      || feature.name === input
      || slugify(feature.name || '') === requestedId;
  }) || null;
}

function frontendModuleContracts() {
  return listFiles('frontend/src/modules', (file) => file.endsWith('/module.ts')).map((file) => {
    const parsed = parseFrontendModule(readText(file));
    return { file, ...parsed };
  });
}

function defaultEffectiveFeature(input, mode) {
  const identity = resolveFeatureIdentity({ name: input });
  if (identity.errors.length > 0 && mode !== 'add') {
    return { identity, feature: null };
  }
  const paths = featurePaths({ id: identity.id });
  return {
    identity,
    feature: {
      id: identity.id,
      name: identity.name,
      status: 'planned',
      featureBrief: paths.featureBrief,
      backendModules: paths.backendModules || [],
      frontendModules: paths.frontendModules || [],
      apis: [],
      screens: [],
      dbTables: [],
      permissions: [],
      components: [],
      routes: [],
      tests: [],
      docs: paths.generatedOwnershipFiles || [],
      sqlFiles: paths.sqlFiles || [],
      mapperXmlFiles: [],
      menuSqlFiles: paths.menuSqlFiles || [],
      permissionFiles: paths.permissionFiles || []
    }
  };
}

export function analyzeImpact({ name, mode = 'update' }) {
  const feature = readFeatureFromRegistry(name);
  const fallback = defaultEffectiveFeature(name, mode);
  const apiGraph = readJsonOrDefault('graph/api-graph.json', { endpoints: [] });
  const uiGraph = readJsonOrDefault('graph/ui-graph.json', { screens: [] });
  const backendRoutes = readJsonOrDefault('ai/generated/backend-routes.json', { routes: [] });
  const frontendRoutes = readJsonOrDefault('ai/generated/frontend-routes.json', { routes: [] });
  const apiClients = readJsonOrDefault('ai/generated/api-clients.json', { calls: [], moduleContracts: [] });
  const dbSchema = readJsonOrDefault('ai/generated/db-schema.json', { tables: [] });
  const permissionScan = readJsonOrDefault('ai/generated/permissions.json', { permissions: [] });
  const componentScan = readJsonOrDefault('ai/generated/component-usage.json', { sharedFiles: [], moduleComponentFiles: [] });

  const blockers = [];
  if (!feature && fallback.identity.errors.length > 0) {
    blockers.push(...fallback.identity.errors);
  }
  if (!feature && mode !== 'add') {
    const parsed = parseFeatureInput(name);
    blockers.push(`Feature ${parsed.id || parsed.name || name} is missing from ai/registry/features.json.`);
  }

  const effective = feature || fallback.feature;
  if (!effective) {
    return {
      schemaVersion: 1,
      generatedBy: 'tools/impact-analyzer.js',
      mode,
      feature: { id: '', name, status: 'unknown' },
      blockers,
      affected: {},
      allowedEditRoots: [],
      requiredCommands: ['npm run scan:all', 'npm run check']
    };
  }

  const apiEndpoints = (apiGraph.endpoints || []).filter((endpoint) => endpoint.module === effective.id || (effective.apis || []).includes(endpoint.id));
  const uiScreens = (uiGraph.screens || []).filter((screen) => screen.module === effective.id || (effective.screens || []).includes(screen.id));
  const contracts = frontendModuleContracts().filter((contract) => contract.id === effective.id || (effective.apis || []).includes(contract.api));
  const tokens = featureTokens(effective);
  const references = findReferences(tokens);

  const affected = {
    feature: effective.featureBrief,
    backendModules: effective.backendModules || [],
    frontendModules: effective.frontendModules || [],
    apiEndpoints: unique([...(effective.apis || []), ...apiEndpoints.map((endpoint) => endpoint.id)]),
    uiScreens: unique([...(effective.screens || []), ...uiScreens.map((screen) => screen.id)]),
    routes: unique([...(effective.routes || []), ...uiScreens.map((screen) => screen.route), ...contracts.map((contract) => contract.route)]),
    dbTables: unique([...(effective.dbTables || []), ...(dbSchema.tables || []).filter((table) => tokens.includes(table.name)).map((table) => table.name)]),
    permissions: unique([...(effective.permissions || []), ...(permissionScan.permissions || []).filter((permission) => tokens.includes(permission.code)).map((permission) => permission.code)]),
    components: effective.components || [],
    tests: effective.tests || [],
    docs: unique([...(effective.docs || []), ...(effective.sqlFiles || []), ...(effective.mapperXmlFiles || []), ...(effective.menuSqlFiles || []), ...(effective.permissionFiles || []), 'ai/registry/features.json', 'ai/registry/modules.json', 'graph/module-graph.json', 'graph/api-graph.json', 'graph/ui-graph.json', 'memory/API_CATALOG.md', 'memory/TASKS.json', 'memory/PROJECT_STATE.md', 'memory/HANDOVER.md', 'memory/CHANGELOG.md']),
    codeReferences: references,
    generatedScans: [
      'ai/generated/backend-routes.json',
      'ai/generated/frontend-routes.json',
      'ai/generated/api-clients.json',
      'ai/generated/db-schema.json',
      'ai/generated/permissions.json',
      'ai/generated/component-usage.json'
    ],
    backendDetectedRoutes: (backendRoutes.routes || []).filter((route) => route.module === effective.id),
    frontendDetectedRoutes: (frontendRoutes.routes || []).filter((route) => route.module === effective.id),
    apiClientDetectedCalls: [
      ...(apiClients.calls || []).filter((call) => call.module === effective.id),
      ...(apiClients.moduleContracts || []).filter((contract) => contract.module === effective.id)
    ],
    componentFiles: (componentScan.moduleComponentFiles || []).filter((component) => component.module === effective.id || component.file.includes(`/modules/${effective.id}/`) || inferFeatureFromPath(component.file, [effective]) === effective.id)
  };

  return {
    schemaVersion: 1,
    generatedBy: 'tools/impact-analyzer.js',
    mode,
    feature: {
      id: effective.id,
      name: effective.name,
      status: effective.status
    },
    blockers,
    affected,
    allowedEditRoots: unique([
      effective.featureBrief,
      ...(effective.backendModules || []),
      ...(effective.frontendModules || []),
      ...(effective.tests || []),
      ...(effective.docs || []),
      ...(effective.sqlFiles || []),
      ...(effective.mapperXmlFiles || []),
      ...(effective.menuSqlFiles || []),
      ...(effective.permissionFiles || []),
      'ai/registry/features.json',
      'ai/registry/modules.json',
      'ai/changes',
      'ai/generated',
      'graph',
      'memory',
      'features',
      'tests'
    ]),
    requiredCommands: [
      'npm run scan:all',
      'npm run close:change',
      'npm run check'
    ]
  };
}

export function renderImpact(impact) {
  return [
    `Feature: ${impact.feature.id}`,
    `Name: ${impact.feature.name}`,
    `Mode: ${impact.mode}`,
    '',
    'Blockers:',
    ...(impact.blockers.length ? impact.blockers.map((item) => `- ${item}`) : ['- none']),
    '',
    'Allowed edit roots:',
    ...(impact.allowedEditRoots.length ? impact.allowedEditRoots.map((item) => `- ${item}`) : ['- none']),
    '',
    'Backend modules:',
    ...(impact.affected.backendModules?.length ? impact.affected.backendModules.map((item) => `- ${item}`) : ['- none']),
    '',
    'Frontend modules:',
    ...(impact.affected.frontendModules?.length ? impact.affected.frontendModules.map((item) => `- ${item}`) : ['- none']),
    '',
    'APIs:',
    ...(impact.affected.apiEndpoints?.length ? impact.affected.apiEndpoints.map((item) => `- ${item}`) : ['- none']),
    '',
    'Screens:',
    ...(impact.affected.uiScreens?.length ? impact.affected.uiScreens.map((item) => `- ${item}`) : ['- none']),
    '',
    'Code references:',
    ...(impact.affected.codeReferences?.length ? impact.affected.codeReferences.map((item) => `- ${item}`) : ['- none']),
    '',
    'Required commands:',
    ...impact.requiredCommands.map((item) => `- ${item}`),
    ''
  ].join('\n');
}

function parseArgs(args) {
  const json = args.includes('--json');
  const write = args.includes('--write');
  const modeIndex = args.indexOf('--mode');
  const mode = modeIndex === -1 ? 'update' : args[modeIndex + 1] || 'update';
  const name = args.filter((arg, index) => {
    if (['--json', '--write', '--mode'].includes(arg)) {
      return false;
    }
    if (modeIndex !== -1 && index === modeIndex + 1) {
      return false;
    }
    return true;
  }).join(' ');
  return { name, json, write, mode };
}

if (isCli(import.meta.url)) {
  const { name, json, write, mode } = parseArgs(process.argv.slice(2));
  if (!name) {
    console.error('Usage: npm run impact -- <feature-id-or-name> [--mode update|add|remove] [--json] [--write]');
    process.exitCode = 1;
  } else {
    const impact = analyzeImpact({ name, mode });
    if (write) {
      const errors = [];
      writeOrCheck('ai/changes/latest-impact.json', formatJson(impact), false, errors);
      finish('impact:write', errors);
    }
    console.log(json ? JSON.stringify(impact, null, 2) : renderImpact(impact));
  }
}
