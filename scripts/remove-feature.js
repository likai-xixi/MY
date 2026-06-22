import fs from 'node:fs';
import path from 'node:path';
import {
  finish,
  formatJson,
  isCli,
  listFiles,
  projectPath,
  readJson,
  readText,
  writeOrCheck
} from '../tools/common.js';
import { normalizeFeatureId, normalizeFeatureNameForMatch, parseFeatureInput, resolveFeatureIdentity, slugify } from './new-feature.js';
import { featurePaths, unique as uniqueProject } from '../tools/project-config.js';
import { runBuildGraph } from './build-graph.js';
import { runSyncMemory } from './sync-memory.js';
import { runBackendRouteScan } from '../tools/scan-backend-routes.js';
import { runFrontendRouteScan } from '../tools/scan-frontend-routes.js';
import { runApiClientScan } from '../tools/scan-api-clients.js';
import { runDbSchemaScan } from '../tools/scan-db-schema.js';
import { runPermissionScan } from '../tools/scan-permissions.js';
import { runComponentScan } from '../tools/scan-components.js';
import { runOwnershipSync } from '../tools/ownership-syncer.js';

const TEXT_EXTENSIONS = new Set([
  '.md',
  '.js',
  '.json',
  '.yml',
  '.yaml',
  '.ts',
  '.tsx',
  '.jsx',
  '.vue',
  '.java',
  '.kt',
  '.sql',
  '.xml',
  '.sh',
  '.css',
  '.scss'
]);

const REMOVAL_DOC_ALLOWLIST = [
  'docs/codex-guide.md',
  'docs/business-development-playbook.md',
  'docs/chat-driven-codex-workflow.md',
  'memory/PROJECT_STATE.md'
];


const FEATURE_PATH_FIELDS = [
  'backendModules',
  'frontendModules',
  'controllers',
  'services',
  'mappers',
  'domainObjects',
  'apiClients',
  'sqlFiles',
  'mapperXmlFiles',
  'menuSqlFiles',
  'permissionFiles',
  'tests'
];

function flattenOwnershipPaths(feature = {}, slug = '') {
  const ownership = feature.ownership || {};
  return Object.entries(ownership).flatMap(([key, value]) => {
    if (!Array.isArray(value)) {
      return [];
    }
    if (key === 'docs') {
      return value.filter((item) => isDeletableFeatureDoc(item, slug));
    }
    return value;
  });
}

function registryOwnedPaths(feature = {}, slug = '') {
  return unique([
    feature.featureBrief,
    ...FEATURE_PATH_FIELDS.flatMap((field) => feature[field] || []),
    ...flattenOwnershipPaths(feature, slug),
    ...((feature.docs || []).filter((item) => isDeletableFeatureDoc(item, slug)))
  ]);
}

function extensionOf(file) {
  const index = file.lastIndexOf('.');
  return index === -1 ? file : file.slice(index);
}

function pathExists(relativePath) {
  return fs.existsSync(projectPath(relativePath));
}

function removePath(relativePath) {
  const absolute = projectPath(relativePath);
  if (!fs.existsSync(absolute)) {
    return;
  }
  fs.rmSync(absolute, { recursive: true, force: true });
}

function timestamp() {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function writeTextFile(relativePath, content) {
  const absolute = projectPath(relativePath);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, content);
}

function copyIntoDeletionBundle(sourcePath, bundleDir) {
  if (!pathExists(sourcePath)) {
    return;
  }
  const target = `${bundleDir}/files/${sourcePath}`;
  const sourceAbsolute = projectPath(sourcePath);
  const targetAbsolute = projectPath(target);
  fs.mkdirSync(path.dirname(targetAbsolute), { recursive: true });
  fs.cpSync(sourceAbsolute, targetAbsolute, { recursive: true, force: true });
}

function readOptionalJson(relativePath) {
  return pathExists(relativePath) ? readJson(relativePath) : null;
}

function buildRollbackMarkdown({ impact, bundleDir }) {
  return [
    '# Feature Deletion Rollback',
    '',
    `Feature: \`${impact.slug}\` (${impact.name || impact.slug})`,
    `Bundle: \`${bundleDir}\``,
    '',
    '## Restore Steps',
    '',
    '1. Restore copied files from `files/` to the same relative paths in the project root.',
    '2. Restore registry snapshots from `registry-before.json` if registry entries were removed incorrectly.',
    '3. Restore graph/API/UI/catalog entries from version control or from the change record impact file.',
    '4. Run `npm run build:graph`, `npm run sync:memory`, `npm run scan:all`, and `npm run check`.',
    '',
    '## Removed Files Snapshot',
    '',
    ...(impact.removeFiles || []).map((file) => `- \`${file}\``),
    ''
  ].join('\n');
}

function createDeletionBundle(impact, errors) {
  const bundleDir = `ai/deletions/${impact.slug}/${timestamp()}`;
  try {
    writeTextFile(`${bundleDir}/impact.json`, formatJson(impact));
    writeTextFile(`${bundleDir}/deleted-files-list.json`, formatJson({ schemaVersion: 1, feature: impact.slug, files: impact.removeFiles || [] }));
    writeTextFile(`${bundleDir}/registry-before.json`, formatJson({
      schemaVersion: 1,
      features: readOptionalJson('ai/registry/features.json'),
      modules: readOptionalJson('ai/registry/modules.json'),
      db: readOptionalJson('ai/registry/db.json'),
      permissions: readOptionalJson('ai/registry/permissions.json'),
      apiGraph: readOptionalJson('graph/api-graph.json'),
      uiGraph: readOptionalJson('graph/ui-graph.json')
    }));
    for (const relativePath of impact.removeFiles || []) {
      copyIntoDeletionBundle(relativePath, bundleDir);
    }
    writeTextFile(`${bundleDir}/rollback.md`, buildRollbackMarkdown({ impact, bundleDir }));
    return bundleDir;
  } catch (error) {
    errors.push(`Failed to create deletion rollback bundle: ${error.message}`);
    return '';
  }
}

function readJsonOrDefault(relativePath, fallback) {
  return pathExists(relativePath) ? readJson(relativePath) : fallback;
}

function unique(items) {
  return uniqueProject(items);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function catalogWithoutEndpoints(text, endpointIds) {
  const ids = new Set(endpointIds);
  const sections = text.split(/\n(?=##\s+)/);
  return sections
    .filter((section) => {
      const match = section.match(/^##\s+(.+?)\s*$/m);
      return !match || !ids.has(match[1].replace(/`/g, '').trim());
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trimEnd() + '\n';
}

function tokenSet({ slug, registryFeature, apiEndpointIds, uiScreenIds, extraTokens = [] }) {
  return new Set(unique([
    slug,
    slug.replace(/-/g, '_'),
    registryFeature?.name,
    ...(registryFeature?.routes || []),
    ...apiEndpointIds,
    ...uiScreenIds,
    ...extraTokens
  ]));
}

function scanDocReferences({ tokens }) {
  const needles = [...tokens].filter(Boolean);
  if (needles.length === 0) {
    return [];
  }

  return listFiles('.', (file) => {
    if (file.startsWith('node_modules/') || file.startsWith('.git/')) {
      return false;
    }
    return TEXT_EXTENSIONS.has(extensionOf(file));
  }).filter((file) => {
    const text = readText(file);
    return needles.some((needle) => text.includes(needle));
  });
}


function isDeletableFeatureDoc(relativePath, slug) {
  if (!relativePath) {
    return false;
  }
  return relativePath === `features/${slug}.md`
    || relativePath.startsWith(`features/${slug}/`)
    || relativePath === `docs/${slug}.md`
    || relativePath.startsWith(`docs/${slug}/`)
    || relativePath === `docs/features/${slug}.md`
    || relativePath.startsWith(`docs/features/${slug}/`)
    || relativePath.startsWith(`evidence/${slug}/`)
    || relativePath.startsWith(`tests/${slug}/`);
}

function findRegistryFeature(input) {
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

function resolveRemovalIdentity(input) {
  const registryFeature = findRegistryFeature(input);
  if (registryFeature) {
    return { slug: registryFeature.id, name: registryFeature.name || registryFeature.id, registryFeature, errors: [] };
  }
  const identity = resolveFeatureIdentity({ name: input });
  return { slug: identity.id, name: identity.name, registryFeature: null, errors: identity.errors };
}

function updateFeatureRegistryAfterRemoval(slug, errors) {
  if (!pathExists('ai/registry/features.json')) {
    return;
  }
  const registry = readJson('ai/registry/features.json');
  registry.features = (registry.features || []).filter((feature) => feature.id !== slug);
  writeOrCheck('ai/registry/features.json', formatJson(registry), false, errors);
}

function updateModuleRegistryAfterRemoval(slug, errors) {
  if (!pathExists('ai/registry/modules.json')) {
    return;
  }
  const registry = readJson('ai/registry/modules.json');
  registry.modules = (registry.modules || []).filter((module) => {
    const values = [module.id, module.feature, module.backendPath, module.frontendPath, ...(module.paths || [])].filter(Boolean);
    return !values.some((value) => value === slug || value.includes(`/${slug}`) || value.includes(`:${slug}`));
  });
  writeOrCheck('ai/registry/modules.json', formatJson(registry), false, errors);
}

function updateDbRegistryAfterRemoval(slug, errors) {
  if (!pathExists('ai/registry/db.json')) {
    return;
  }
  const registry = readJson('ai/registry/db.json');
  registry.tables = (registry.tables || []).filter((table) => (table.ownerFeature || table.feature) !== slug);
  writeOrCheck('ai/registry/db.json', formatJson(registry), false, errors);
}

function updatePermissionRegistryAfterRemoval(slug, errors) {
  if (!pathExists('ai/registry/permissions.json')) {
    return;
  }
  const registry = readJson('ai/registry/permissions.json');
  registry.permissions = (registry.permissions || []).filter((permission) => (permission.ownerFeature || permission.feature) !== slug);
  writeOrCheck('ai/registry/permissions.json', formatJson(registry), false, errors);
}

function updateTasksAfterRemoval(slug, errors) {
  if (!pathExists('memory/TASKS.json')) {
    return;
  }
  const data = readJson('memory/TASKS.json');
  data.tasks = (data.tasks || []).filter((task) => task.feature !== slug);
  writeOrCheck('memory/TASKS.json', formatJson(data), false, errors);
}

function activeFeatures() {
  const registry = readJsonOrDefault('ai/registry/features.json', { features: [] });
  return (registry.features || []).filter((feature) => feature.status !== 'removed');
}

function firstTaskId() {
  const data = readJsonOrDefault('memory/TASKS.json', { tasks: [] });
  return (data.tasks || []).find((task) => task.status !== 'done')?.id || 'none';
}

function buildProjectStateAfterRemoval() {
  const features = activeFeatures();
  const featureLines = features.length
    ? features.map((feature) => `- \`${feature.featureBrief || `features/${feature.id}.md`}\` — ${feature.name || feature.id}`)
    : ['- none'];
  return [
    '# Project State',
    '',
    '## Current Goal',
    '',
    'Maintain a chat-driven Codex App development template that lets the user add, adjust, and remove business features through conversation while repository gates enforce registry, graph, memory, component, and handoff consistency.',
    '',
    '## Status',
    '',
    'The governance layer is ready for a real backend/frontend project. Business examples can be replaced by production modules when the project base is selected.',
    '',
    '## Active Features',
    '',
    ...featureLines,
    '',
    '## Active Task',
    '',
    `\`${firstTaskId()}\` in \`memory/TASKS.json\``,
    '',
    '## Latest Session',
    '',
    '`memory/sessions/2026-06-21-final-template.md`',
    '',
    '## Next Actions',
    '',
    '- Place this scaffold at the root of the real project that Codex App will edit.',
    '- Tell Codex to read `AGENTS.md` and run `npm run resume` before business work.',
    '- Use chat requests for `新增功能`, `功能迭代`, `删除功能预分析`, and `确认删除`.',
    '- Run `npm run profile:detect`, `npm run profile:adopt -- <adapter>`, and `npm run profile:lock` when attaching a real project base.',
    '- Add runtime-specific backend, frontend, database, and UI tests when the real stack is selected.',
    '',
    '## Open Questions',
    '',
    '- Which backend framework will the real project use?',
    '- Which frontend framework will the real project use?',
    '- Which database and migration tool will own table changes?',
    '- Which UI component library will become the shared component base?',
    '',
    '## Last Verification',
    '',
    'Run `npm run check` after any governance or business change. Treat it as the main gate; add runtime-specific verification when real backend or frontend behavior exists.',
    ''
  ].join('\n');
}

function updateProjectStateAfterRemoval(errors) {
  writeOrCheck('memory/PROJECT_STATE.md', buildProjectStateAfterRemoval(), false, errors);
}

function buildRemovalHandover({ slug, name, impact }) {
  return [
    '# Handover',
    '',
    '## Summary',
    '',
    `Feature \`${slug}\` (${name}) has been removed from feature ownership, module ownership, API/UI graphs, generated scans, active tasks, project state, and the handoff trail.`,
    '',
    '## Changed Files',
    '',
    ...unique([...impact.removeFiles, ...impact.updateFiles]).map((file) => `- \`${file}\``),
    '',
    '## Commands',
    '',
    '- `npm run build:graph`',
    '- `npm run sync:memory`',
    '- `npm run scan:all`',
    `- \`npm run check:orphan -- ${slug}\``,
    '- `npm run close:change`',
    '- `npm run check`',
    '',
    '## Verification',
    '',
    'Run `npm run check` after the deletion pass. The orphan check must not report active code, registry, graph, project state, or task references for the removed feature.',
    '',
    '## Risks',
    '',
    '- External database objects, production menu rows, or runtime permissions must be listed in the registry before the deletion pass can remove or report them reliably.',
    '- Version control remains the recovery source for deleted paths.',
    '',
    '## Next Actions',
    '',
    '- Review the dry-run output before accepting any deletion pass.',
    '- Run stack-specific backend, frontend, migration, and permission checks after the real project base is attached.',
    ''
  ].join('\n');
}

function updateHandoverAfterRemoval({ slug, name, impact }, errors) {
  writeOrCheck('memory/HANDOVER.md', buildRemovalHandover({ slug, name, impact }), false, errors);
}

function updateChangelogAfterRemoval({ slug, name }, errors) {
  const current = pathExists('memory/CHANGELOG.md') ? readText('memory/CHANGELOG.md').trimEnd() : '# Changelog';
  const entry = [
    '',
    `## ${today()} — Feature Removal`,
    '',
    `- Removed feature \`${slug}\` (${name}) from feature registry, module registry, graph outputs, active task memory, project state, and handoff trail.`,
    '- Rebuilt generated scans and graph memory after the removal pass.',
    ''
  ].join('\n');
  writeOrCheck('memory/CHANGELOG.md', `${current}${entry}`, false, errors);
}

function scrubFeatureReferencesFromText(text, tokens) {
  const needles = [...tokens].filter(Boolean);
  if (needles.length === 0) {
    return text;
  }
  const lines = text.split('\n');
  const kept = lines.filter((line) => {
    const hit = needles.some((needle) => line.includes(needle));
    if (!hit) {
      return true;
    }
    return !/^\s*(-|\*|\d+\.|`|npm run|Read |Use |The scaffold|Business implementation)/.test(line);
  });
  return kept.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

function updateAllowlistedDocs({ tokens }, errors) {
  for (const file of REMOVAL_DOC_ALLOWLIST) {
    if (!pathExists(file)) {
      continue;
    }
    const next = scrubFeatureReferencesFromText(readText(file), tokens);
    writeOrCheck(file, next, false, errors);
  }
}

export function runGeneratedRefresh({ checkMode = false } = {}) {
  return [
    ...runBackendRouteScan({ checkMode }),
    ...runFrontendRouteScan({ checkMode }),
    ...runApiClientScan({ checkMode }),
    ...runDbSchemaScan({ checkMode }),
    ...runPermissionScan({ checkMode }),
    ...runComponentScan({ checkMode }),
    ...runOwnershipSync({ checkMode })
  ];
}

export function collectFeatureImpact({ name }) {
  const identity = resolveRemovalIdentity(name);
  const slug = identity.slug;
  if (!slug) {
    return {
      slug,
      name: identity.name,
      blockers: identity.errors.length ? identity.errors : ['Feature id is required.'],
      removeFiles: [],
      updateFiles: [],
      apiEndpoints: [],
      uiScreens: [],
      dbTables: [],
      permissions: [],
      routes: [],
      components: [],
      docReferences: [],
      allowedEditRoots: [],
      qaCommands: [],
      rollbackNotes: [],
      deletionBundle: ''
    };
  }

  const registryFeature = identity.registryFeature;
  const apiGraph = readJsonOrDefault('graph/api-graph.json', { endpoints: [] });
  const uiGraph = readJsonOrDefault('graph/ui-graph.json', { screens: [] });
  const adapterPaths = featurePaths({ id: slug });
  const registryPaths = registryFeature ? registryOwnedPaths(registryFeature, slug) : [];
  const defaultPaths = [
    adapterPaths.featureBrief,
    ...(adapterPaths.backendModules || []),
    ...(adapterPaths.frontendModules || []),
    ...(adapterPaths.sqlFiles || []),
    ...(adapterPaths.generatedOwnershipFiles || []),
    `features/${slug}.md`,
    `backend/modules/${slug}`,
    `frontend/src/modules/${slug}`,
    `ruoyi-ui/src/views/${slug}`,
    `ruoyi-ui/src/api/${slug}.contract.md`,
    `sql/${slug}.ownership.md`,
    `ai/contracts/${slug}.api.md`,
    `ai/contracts/${slug}.ui.md`,
    `ai/contracts/${slug}.db.md`,
    `ai/contracts/${slug}.permission.md`,
    `ai/contracts/${slug}.delete-ownership.md`,
    `evidence/${slug}`,
    `tests/${slug}`
  ];
  const featureFilePaths = unique([...registryPaths, ...defaultPaths]).filter(pathExists);

  const uiScreens = (uiGraph.screens || []).filter((screen) => screen.module === slug || (registryFeature?.screens || []).includes(screen.id));
  const uiScreenIds = unique([...(registryFeature?.screens || []), ...uiScreens.map((screen) => screen.id)]);
  const apiEndpoints = (apiGraph.endpoints || []).filter((endpoint) => {
    return endpoint.module === slug || (registryFeature?.apis || []).includes(endpoint.id) || (endpoint.consumers || []).some((consumer) => uiScreenIds.includes(consumer));
  });
  const apiEndpointIds = unique([...(registryFeature?.apis || []), ...apiEndpoints.map((endpoint) => endpoint.id)]);

  const externalConsumers = (apiGraph.endpoints || [])
    .filter((endpoint) => endpoint.module === slug)
    .flatMap((endpoint) => endpoint.consumers || [])
    .filter((consumer) => !uiScreenIds.includes(consumer));

  const updateFiles = [
    'ai/registry/features.json',
    'ai/registry/modules.json',
    'ai/generated/backend-routes.json',
    'ai/generated/frontend-routes.json',
    'ai/generated/api-clients.json',
    'ai/generated/db-schema.json',
    'ai/generated/permissions.json',
    'ai/generated/component-usage.json',
    'graph/module-graph.json',
    'graph/render-graph.mmd',
    'memory/MODULE_MAP.md',
    apiEndpointIds.length > 0 ? 'graph/api-graph.json' : '',
    apiEndpointIds.length > 0 ? 'memory/API_CATALOG.md' : '',
    uiScreenIds.length > 0 ? 'graph/ui-graph.json' : '',
    'memory/PROJECT_STATE.md',
    'memory/TASKS.json',
    'memory/HANDOVER.md',
    'memory/CHANGELOG.md',
    'ai/registry/db.json',
    'ai/registry/permissions.json'
  ];

  const blockers = [...identity.errors];
  if (featureFilePaths.length === 0 && apiEndpointIds.length === 0 && uiScreenIds.length === 0 && !registryFeature) {
    blockers.push(`No feature, backend module, frontend module, API endpoint, UI screen, or registry entry found for ${slug}.`);
  }
  for (const consumer of externalConsumers) {
    blockers.push(`API owned by ${slug} is still consumed by ${consumer}. Remove or replace that dependency first.`);
  }

  const extraTokens = [
    ...(registryFeature?.dbTables || []),
    ...(registryFeature?.permissions || []),
    ...(registryFeature?.routes || []),
    ...(registryFeature?.components || []),
    ...(registryFeature?.controllers || []),
    ...(registryFeature?.services || []),
    ...(registryFeature?.mappers || []),
    ...(registryFeature?.domainObjects || []),
    ...(registryFeature?.apiClients || []),
    ...(registryFeature?.sqlFiles || []),
    ...(registryFeature?.mapperXmlFiles || []),
    ...(registryFeature?.menuSqlFiles || []),
    ...(registryFeature?.permissionFiles || [])
  ];
  const tokens = tokenSet({ slug, registryFeature, apiEndpointIds, uiScreenIds, extraTokens });

  return {
    slug,
    name: identity.name,
    blockers,
    removeFiles: featureFilePaths,
    updateFiles: unique(updateFiles),
    apiEndpoints: apiEndpointIds,
    uiScreens: uiScreenIds,
    dbTables: registryFeature?.dbTables || [],
    permissions: registryFeature?.permissions || [],
    sqlFiles: registryFeature?.sqlFiles || [],
    mapperXmlFiles: registryFeature?.mapperXmlFiles || [],
    menuSqlFiles: registryFeature?.menuSqlFiles || [],
    permissionFiles: registryFeature?.permissionFiles || [],
    routes: registryFeature?.routes || [],
    components: registryFeature?.components || [],
    controllers: registryFeature?.controllers || [],
    services: registryFeature?.services || [],
    mappers: registryFeature?.mappers || [],
    domainObjects: registryFeature?.domainObjects || [],
    apiClients: registryFeature?.apiClients || [],
    docReferences: scanDocReferences({ tokens }),
    allowedEditRoots: unique([...featureFilePaths, ...updateFiles, ...REMOVAL_DOC_ALLOWLIST, 'ai/changes', 'ai/deletions']),
    qaCommands: [
      'npm run build:graph',
      'npm run sync:memory',
      'npm run scan:all',
      `npm run check:orphan -- ${slug}`,
      'npm run close:change',
      'npm run check'
    ],
    rollbackNotes: [
      'Restore the removed feature paths from version control.',
      'Restore removed feature registry, module registry, API graph, UI graph, and API catalog entries.',
      'A rollback bundle is created under ai/deletions/<feature>/<timestamp>/ before apply removes files.',
      'Run npm run build:graph, npm run sync:memory, npm run scan:all, and npm run check after rollback.'
    ],
    deletionBundle: `ai/deletions/${slug}/<timestamp>`,
    tokens: [...tokens]
  };
}

export function renderImpactText(impact) {
  const lines = [
    `Feature: ${impact.slug || '<invalid>'}`,
    `Name: ${impact.name || '<unknown>'}`,
    '',
    'Blockers:',
    ...(impact.blockers.length ? impact.blockers.map((item) => `- ${item}`) : ['- none']),
    '',
    'Remove files:',
    ...(impact.removeFiles.length ? impact.removeFiles.map((item) => `- ${item}`) : ['- none']),
    '',
    'Update files:',
    ...(impact.updateFiles.length ? impact.updateFiles.map((item) => `- ${item}`) : ['- none']),
    '',
    'Allowed edit roots:',
    ...(impact.allowedEditRoots.length ? impact.allowedEditRoots.map((item) => `- ${item}`) : ['- none']),
    '',
    'API endpoints:',
    ...(impact.apiEndpoints.length ? impact.apiEndpoints.map((item) => `- ${item}`) : ['- none']),
    '',
    'UI screens:',
    ...(impact.uiScreens.length ? impact.uiScreens.map((item) => `- ${item}`) : ['- none']),
    '',
    'Database tables:',
    ...(impact.dbTables.length ? impact.dbTables.map((item) => `- ${item}`) : ['- none']),
    '',
    'Permissions:',
    ...(impact.permissions.length ? impact.permissions.map((item) => `- ${item}`) : ['- none']),
    '',
    'Routes:',
    ...(impact.routes.length ? impact.routes.map((item) => `- ${item}`) : ['- none']),
    '',
    'Components:',
    ...(impact.components.length ? impact.components.map((item) => `- ${item}`) : ['- none']),
    '',
    'Controllers:',
    ...((impact.controllers || []).length ? impact.controllers.map((item) => `- ${item}`) : ['- none']),
    '',
    'Services:',
    ...((impact.services || []).length ? impact.services.map((item) => `- ${item}`) : ['- none']),
    '',
    'Mappers:',
    ...((impact.mappers || []).length ? impact.mappers.map((item) => `- ${item}`) : ['- none']),
    '',
    'API clients:',
    ...((impact.apiClients || []).length ? impact.apiClients.map((item) => `- ${item}`) : ['- none']),
    '',
    'SQL files:',
    ...((impact.sqlFiles || []).length ? impact.sqlFiles.map((item) => `- ${item}`) : ['- none']),
    '',
    'Mapper XML files:',
    ...((impact.mapperXmlFiles || []).length ? impact.mapperXmlFiles.map((item) => `- ${item}`) : ['- none']),
    '',
    'Menu SQL files:',
    ...((impact.menuSqlFiles || []).length ? impact.menuSqlFiles.map((item) => `- ${item}`) : ['- none']),
    '',
    'Permission files:',
    ...((impact.permissionFiles || []).length ? impact.permissionFiles.map((item) => `- ${item}`) : ['- none']),
    '',
    'Document references:',
    ...(impact.docReferences.length ? impact.docReferences.map((item) => `- ${item}`) : ['- none']),
    '',
    'QA commands:',
    ...impact.qaCommands.map((item) => `- ${item}`),
    '',
    'Rollback bundle:',
    `- ${impact.deletionBundle || `ai/deletions/${impact.slug || '<feature>'}/<timestamp>`}`,
    '',
    'Rollback notes:',
    ...impact.rollbackNotes.map((item) => `- ${item}`),
    ''
  ];
  return lines.join('\n');
}

export function applyFeatureRemoval(impact, { confirm = '' } = {}) {
  const errors = [];
  if (impact.blockers.length > 0) {
    return impact.blockers;
  }
  if (confirm !== impact.slug) {
    return [`Pass --confirm ${impact.slug} before applying removal.`];
  }

  const bundleDir = createDeletionBundle(impact, errors);
  if (errors.length > 0) {
    return errors;
  }
  impact.deletionBundle = bundleDir;

  for (const relativePath of impact.removeFiles) {
    removePath(relativePath);
  }

  const apiGraph = readJsonOrDefault('graph/api-graph.json', { schemaVersion: 1, endpoints: [] });
  apiGraph.endpoints = (apiGraph.endpoints || []).filter((endpoint) => !impact.apiEndpoints.includes(endpoint.id));
  writeOrCheck('graph/api-graph.json', formatJson(apiGraph), false, errors);

  const uiGraph = readJsonOrDefault('graph/ui-graph.json', { schemaVersion: 1, screens: [] });
  uiGraph.screens = (uiGraph.screens || []).filter((screen) => !impact.uiScreens.includes(screen.id));
  writeOrCheck('graph/ui-graph.json', formatJson(uiGraph), false, errors);

  if (impact.apiEndpoints.length > 0 && pathExists('memory/API_CATALOG.md')) {
    writeOrCheck('memory/API_CATALOG.md', catalogWithoutEndpoints(readText('memory/API_CATALOG.md'), impact.apiEndpoints), false, errors);
  }

  updateFeatureRegistryAfterRemoval(impact.slug, errors);
  updateModuleRegistryAfterRemoval(impact.slug, errors);
  updateDbRegistryAfterRemoval(impact.slug, errors);
  updatePermissionRegistryAfterRemoval(impact.slug, errors);
  updateTasksAfterRemoval(impact.slug, errors);
  updateProjectStateAfterRemoval(errors);
  updateHandoverAfterRemoval({ slug: impact.slug, name: impact.name, impact }, errors);
  updateChangelogAfterRemoval({ slug: impact.slug, name: impact.name }, errors);
  updateAllowlistedDocs({ tokens: new Set(impact.tokens || [impact.slug]) }, errors);

  errors.push(...runGeneratedRefresh({ checkMode: false }));
  errors.push(...runBuildGraph({ checkMode: false }));
  errors.push(...runSyncMemory({ checkMode: false }));
  return errors;
}

export function parseArgs(args) {
  const dryRun = args.includes('--dry-run') || !args.includes('--apply');
  const json = args.includes('--json');
  const apply = args.includes('--apply');
  const confirmFlagIndex = args.findIndex((arg) => arg === '--confirm' || arg === '--confirm-remove-feature');
  const confirm = confirmFlagIndex === -1 ? '' : args[confirmFlagIndex + 1] || '';
  const name = args
    .filter((arg, index) => {
      if (arg === '--dry-run' || arg === '--json' || arg === '--apply' || arg === '--confirm' || arg === '--confirm-remove-feature') {
        return false;
      }
      if (confirmFlagIndex !== -1 && index === confirmFlagIndex + 1) {
        return false;
      }
      return true;
    })
    .join(' ');
  return { name, dryRun, json, apply, confirm };
}

if (isCli(import.meta.url)) {
  const { name, dryRun, json, apply, confirm } = parseArgs(process.argv.slice(2));
  if (!name) {
    console.error('Usage: npm run remove:feature -- <feature-id-or-name> [--dry-run|--json|--apply --confirm <feature-id>]');
    process.exitCode = 1;
  } else {
    const impact = collectFeatureImpact({ name });
    if (json) {
      console.log(JSON.stringify(impact, null, 2));
    } else {
      console.log(renderImpactText(impact));
    }

    if (apply && !dryRun) {
      finish('remove:feature', applyFeatureRemoval(impact, { confirm }));
    } else {
      finish('remove:feature', impact.slug ? [] : impact.blockers);
    }
  }
}
