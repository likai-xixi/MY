import fs from 'node:fs';
import path from 'node:path';
import { finish, isCli, projectPath } from '../tools/common.js';
import { configuredPaths, featurePaths, genericFeaturePaths, javaPackageSegment, pascalCase, ruoyiFeaturePaths } from '../tools/project-config.js';

export const FEATURE_ID_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

export function slugify(value) {
  return value
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function normalizeFeatureId(value) {
  const id = slugify(value || '');
  return FEATURE_ID_PATTERN.test(id) ? id : '';
}

export function titleFromSlug(slug) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(' ');
}

function hasNonAscii(value) {
  return /[^\x00-\x7F]/.test(value || '');
}

const CHAT_ACTION_PREFIX_RE = /^(?:删除功能预分析|删除预分析|确认删除|新增功能|新增模块|新建功能|新建模块|创建功能|创建模块|增加功能|增加模块|功能迭代|迭代功能|修改功能|更新功能|删除功能|删除模块)\s*(?:[:：|｜\-]\s*)?/;

function headline(rawValue = '') {
  const line = String(rawValue || '')
    .split(/\r?\n/)
    .map((item) => item.trim())
    .find(Boolean) || '';
  return line
    .replace(/\s+(?:业务要求|需求|我要改|我要增加|请实现|要求)\s*[:：].*$/u, '')
    .trim();
}

export function stripChatActionPrefix(rawValue = '') {
  return headline(rawValue).replace(CHAT_ACTION_PREFIX_RE, '').trim();
}

export function normalizeFeatureNameForMatch(value = '') {
  return stripChatActionPrefix(value)
    .replace(/[\s`'"“”‘’\[\]【】()（）<>《》，,。.;；:：|｜/\\\-]+/g, '')
    .toLowerCase();
}

function loadFeatureIdDictionary() {
  const fallback = { suffixes: [], aliases: [] };
  try {
    const raw = fs.readFileSync(projectPath('ai/registry/feature-id-dictionary.json'), 'utf8');
    const parsed = JSON.parse(raw);
    return {
      suffixes: Array.isArray(parsed.suffixes) ? parsed.suffixes : [],
      aliases: Array.isArray(parsed.aliases) ? parsed.aliases : []
    };
  } catch {
    return fallback;
  }
}

function trimBusinessSuffix(value, suffixes = []) {
  let next = value;
  let changed = true;
  while (changed) {
    changed = false;
    for (const suffix of suffixes) {
      const normalizedSuffix = normalizeFeatureNameForMatch(suffix);
      if (normalizedSuffix && next.length > normalizedSuffix.length && next.endsWith(normalizedSuffix)) {
        next = next.slice(0, -normalizedSuffix.length);
        changed = true;
      }
    }
  }
  return next;
}

export function resolveFeatureIdFromDisplayName(displayName = '') {
  const cleaned = stripChatActionPrefix(displayName);
  if (!hasNonAscii(cleaned)) {
    return normalizeFeatureId(cleaned);
  }

  const normalized = normalizeFeatureNameForMatch(cleaned);
  if (!normalized) {
    return '';
  }

  const dictionary = loadFeatureIdDictionary();
  const base = trimBusinessSuffix(normalized, dictionary.suffixes);
  const candidates = [];

  for (const entry of dictionary.aliases) {
    const id = normalizeFeatureId(entry.id || '');
    if (!id) {
      continue;
    }
    const aliases = [entry.name, ...(entry.aliases || [])].filter(Boolean);
    for (const alias of aliases) {
      const aliasName = normalizeFeatureNameForMatch(alias);
      const aliasBase = trimBusinessSuffix(aliasName, dictionary.suffixes);
      if (!aliasName) {
        continue;
      }
      if (normalized === aliasName || normalized === aliasBase || base === aliasName || base === aliasBase) {
        return id;
      }
      if ((aliasName.length >= 2 && normalized.includes(aliasName)) || (aliasBase.length >= 2 && normalized.includes(aliasBase))) {
        candidates.push({ id, score: Math.max(aliasName.length, aliasBase.length), alias: aliasName });
      }
    }
  }

  candidates.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  return candidates[0]?.id || '';
}

function readKeyValue(raw, key) {
  const match = raw.match(new RegExp(`(?:^|\\s)${key}=([^\\s]+)`));
  return match ? match[1].trim() : '';
}

function stripKeyValues(raw) {
  return raw.replace(/(?:^|\s)(id|name)=([^\s]+)/g, '').trim();
}

export function parseFeatureInput(rawValue = '') {
  const originalRaw = headline(rawValue);
  const raw = stripChatActionPrefix(originalRaw);
  if (!raw) {
    return { id: '', name: '', raw: originalRaw };
  }

  const keyedId = readKeyValue(raw, 'id');
  const keyedName = readKeyValue(raw, 'name');
  if (keyedId || keyedName) {
    return {
      id: keyedId,
      name: keyedName || stripKeyValues(raw),
      raw: originalRaw
    };
  }

  for (const separator of ['|', '：', ':']) {
    const index = raw.indexOf(separator);
    if (index > 0) {
      const left = raw.slice(0, index).trim();
      const right = raw.slice(index + separator.length).trim();
      if (FEATURE_ID_PATTERN.test(left) && right) {
        return { id: left, name: right, raw: originalRaw };
      }
    }
  }

  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length > 1 && FEATURE_ID_PATTERN.test(parts[0]) && hasNonAscii(raw)) {
    return { id: parts[0], name: parts.slice(1).join(' '), raw: originalRaw };
  }

  return { id: '', name: raw, raw: originalRaw };
}

export function resolveFeatureIdentity({ id = '', name = '' } = {}) {
  const parsed = parseFeatureInput(name || id);
  const explicitId = id || parsed.id;
  const displayName = (name && id ? stripChatActionPrefix(name) : parsed.name).trim();
  const dictionaryId = explicitId ? '' : resolveFeatureIdFromDisplayName(displayName);
  const normalizedId = normalizeFeatureId(explicitId || dictionaryId || displayName);
  const errors = [];

  if (!normalizedId) {
    errors.push('Feature id is required and must use ASCII kebab-case, for example: demo-feature. For Chinese-only names, add an entry in ai/registry/feature-id-dictionary.json or use --id demo-feature --name 显示名称.');
  }
  if (explicitId && !FEATURE_ID_PATTERN.test(normalizeFeatureId(explicitId))) {
    errors.push(`Feature id is invalid: ${explicitId}. Use lowercase ASCII kebab-case.`);
  }
  if (!explicitId && hasNonAscii(displayName) && !dictionaryId) {
    errors.push(`Feature name ${displayName} needs a stable ASCII feature id. Add it to ai/registry/feature-id-dictionary.json or use --id demo-feature --name ${displayName}.`);
  }

  return {
    id: normalizedId,
    slug: normalizedId,
    name: displayName || titleFromSlug(normalizedId),
    errors
  };
}

export function buildFeatureBrief({ slug, title }) {
  return [
    `# Feature Brief: ${title}`,
    '',
    '## Identity',
    '',
    `- ID: \`${slug}\``,
    `- Name: ${title}`,
    '',
    '## Problem',
    '',
    'Describe the user or operator problem.',
    '',
    '## Users',
    '',
    '- Primary user',
    '',
    '## Proposed Scope',
    '',
    '- Smallest useful behavior',
    '',
    '## Non-goals',
    '',
    '- Out-of-scope behavior',
    '',
    '## Ownership',
    '',
    '- Backend, frontend, API, UI, database, permission, menu, component, test, and documentation ownership must be registered in `ai/registry/features.json` before code is considered complete.',
    '- API, UI, database, permission, and deletion ownership contracts must live under `ai/contracts/<feature>.*.md`.',
    '- Paths must use the feature ID, not the display name.',
    '',
    '## Acceptance Criteria',
    '',
    '- The feature has a clear backend, frontend, API/UI, data, permission, test, documentation, and deletion ownership boundary where applicable.',
    '- `npm run check` passes after implementation.',
    '',
    '## Backend Impact',
    '',
    `Use the active project adapter paths for \`${slug}\`. Generic projects use \`backend/modules/${slug}/{api,service,domain,repository}/\`; RuoYi projects use the paths recorded in the feature registry.`,
    '',
    '## Frontend Impact',
    '',
    `Use the active project adapter paths for \`${slug}\`. Generic projects use \`frontend/src/modules/${slug}/\`; RuoYi projects use \`ruoyi-ui/src/views/${slug}/\` and the matching API contract path.`,
    '',
    '## Memory And Graph Updates',
    '',
    '- Update `memory/PROJECT_STATE.md` with this active feature.',
    '- Update `memory/HANDOVER.md` before handoff.',
    '- Run `npm run build:graph` after adding or removing feature/backend/frontend modules.',
    '- Update `graph/api-graph.json` or `graph/ui-graph.json` when API or UI boundaries change.',
    '',
    '## Verification',
    '',
    '- `npm run check`',
    ''
  ].join('\n');
}

export function buildApiOwnershipContract({ slug, title }) {
  return [
    `# ${title} API Ownership Contract`,
    '',
    `Feature ID: \`${slug}\``,
    '',
    '## Owned Endpoints',
    '',
    '- Register every backend endpoint in `graph/api-graph.json` and `memory/API_CATALOG.md` before implementation is complete.',
    '- Register every frontend API client in `ai/registry/features.json` under `apiClients`.',
    '',
    '## Boundary Rules',
    '',
    '- Other modules may call only documented API endpoints, not internal service, mapper, or repository code.',
    '- API IDs must use `<feature>.<action>`, for example `' + slug + '.list`.',
    '',
    '## Verification',
    '',
    '- `npm run scan:api-clients`',
    '- `npm run check:registry`',
    ''
  ].join('\n');
}

export function buildUiOwnershipContract({ slug, title }) {
  return [
    `# ${title} UI Ownership Contract`,
    '',
    `Feature ID: \`${slug}\``,
    '',
    '## Owned Screens',
    '',
    '- Register routes and screens in `graph/ui-graph.json` and `ai/registry/features.json`.',
    '- Page-local components are allowed only when they are feature-specific and not reusable controls.',
    '',
    '## Shared Component Rule',
    '',
    '- Before creating table, form, modal, drawer, upload, select, search, pagination, or date controls, check `ai/registry/components.json` and component catalogs first.',
    '- If a new reusable component is required, register its id, name, aliases, purpose, props, usedBy, and path before use.',
    '',
    '## Verification',
    '',
    '- `npm run scan:frontend-routes`',
    '- `npm run check:components`',
    '- `npm run check:component-similarity`',
    ''
  ].join('\n');
}

export function buildDbOwnershipContract({ slug, title }) {
  return [
    `# ${title} Database Ownership Contract`,
    '',
    `Feature ID: \`${slug}\``,
    '',
    '## Owned Database Objects',
    '',
    '- Register tables in `ai/registry/db.json` and `ai/registry/features.json` under `dbTables`.',
    '- Register SQL, migration, seed, and mapper XML files under `sqlFiles`, `mapperXmlFiles`, `menuSqlFiles`, or `permissionFiles`.',
    '',
    '## Delete Rule',
    '',
    '- A feature can only be fully removed when database, menu, permission, mapper XML, and seed ownership are registered.',
    '',
    '## Verification',
    '',
    '- `npm run scan:db`',
    '- `npm run check:ownership`',
    ''
  ].join('\n');
}

export function buildPermissionOwnershipContract({ slug, title }) {
  return [
    `# ${title} Permission Ownership Contract`,
    '',
    `Feature ID: \`${slug}\``,
    '',
    '## Owned Permission Codes',
    '',
    `- Expected pattern: \`${slug}:*:list\`, \`${slug}:*:query\`, \`${slug}:*:add\`, \`${slug}:*:edit\`, \`${slug}:*:remove\`.`,
    '- Register real permission codes in `ai/registry/permissions.json` and `ai/registry/features.json`.',
    '',
    '## Menu Ownership',
    '',
    '- Register menu SQL files and `sys_menu` rows before treating the feature as complete.',
    '',
    '## Verification',
    '',
    '- `npm run scan:permissions`',
    '- `npm run check:ownership`',
    ''
  ].join('\n');
}

export function buildDeleteOwnershipContract({ slug, title }) {
  return [
    `# ${title} Delete Ownership Contract`,
    '',
    `Feature ID: \`${slug}\``,
    '',
    '## Deletion Preconditions',
    '',
    '- Run deletion dry-run before applying removal.',
    '- Stop deletion if any external module still depends on this feature\'s API, UI, database, permission, component, or internal code.',
    '- Delete only files registered under feature ownership or adapter-generated ownership paths.',
    '',
    '## Must Be Listed Before Removal',
    '',
    '- Backend modules, controllers, services, mappers, domain objects, mapper XML files.',
    '- Frontend pages, routes, API clients, page-local components.',
    '- Tables, SQL files, menu SQL, permission codes, dictionary types, tests, and docs.',
    '',
    '## Verification',
    '',
    '- `npm run feature:remove -- <feature> --dry-run`',
    '- `npm run feature:remove -- <feature> --apply --confirm <feature>`',
    '- `npm run check:orphan -- <feature>`',
    '- `npm run check`',
    ''
  ].join('\n');
}

function plannedContractFiles({ slug, title }) {
  return [
    { relativePath: `ai/contracts/${slug}.api.md`, content: buildApiOwnershipContract({ slug, title }) },
    { relativePath: `ai/contracts/${slug}.ui.md`, content: buildUiOwnershipContract({ slug, title }) },
    { relativePath: `ai/contracts/${slug}.db.md`, content: buildDbOwnershipContract({ slug, title }) },
    { relativePath: `ai/contracts/${slug}.permission.md`, content: buildPermissionOwnershipContract({ slug, title }) },
    { relativePath: `ai/contracts/${slug}.delete-ownership.md`, content: buildDeleteOwnershipContract({ slug, title }) }
  ];
}

export function buildBackendReadme({ title, adapter = 'generic', slug, scope = '' }) {
  if (adapter === 'ruoyi') {
    const scopeTitle = scope === 'controller' ? 'Controller Boundary' : 'Business Boundary';
    const scopeRule = scope === 'controller'
      ? 'This folder owns HTTP controllers, request/response DTO mapping, and permission annotations for the feature.'
      : 'This folder owns domain objects, service contracts, service implementations, mapper contracts, and business rules for the feature.';
    return [
      `# ${title} RuoYi ${scopeTitle}`,
      '',
      `Feature ID: \`${slug}\``,
      `Java package segment: \`${javaPackageSegment(slug)}\``,
      '',
      scopeRule,
      '',
      scope === 'controller'
        ? '- Keep controller classes under `ruoyi-admin/src/main/java/com/ruoyi/web/controller/business/<feature>/`.'
        : '- Keep business classes under `ruoyi-business/src/main/java/com/ruoyi/business/<feature>/` unless the real project deliberately uses `ruoyi-system`.',
      '- Mapper XML, menu SQL, permissions, and database objects must be registered in `ai/registry/features.json`.',
      '- Do not create duplicate cross-module helpers; move reusable code to the approved shared layer and register it.',
      ''
    ].join('\n');
  }
  return [
    `# ${title} Backend`,
    '',
    'Use this folder for backend boundaries related to this feature.',
    '',
    '- `api/` describes transport contracts.',
    '- `service/` coordinates use cases.',
    '- `domain/` owns business rules.',
    '- `repository/` owns persistence contracts.',
    ''
  ].join('\n');
}

export function buildBackendLayerReadme({ title, layer }) {
  const descriptions = {
    api: 'transport contracts, request validation, response shape, and endpoint ownership',
    service: 'use-case orchestration and application workflows',
    domain: 'business rules, entities, invariants, and domain errors',
    repository: 'persistence contracts and adapters'
  };
  return [
    `# ${title} ${titleFromSlug(layer)}`,
    '',
    `Use this folder for ${descriptions[layer]}.`,
    ''
  ].join('\n');
}

export function buildFrontendReadme({ title, adapter = 'generic', slug }) {
  if (adapter === 'ruoyi') {
    return [
      `# ${title} RuoYi Frontend Ownership`,
      '',
      `Feature ID: \`${slug}\``,
      '',
      'Use this folder for RuoYi pages, list forms, dialogs, route-level state, and page-specific components related to this feature.',
      '',
      '- Shared controls must be registered before being created under the shared component root.',
      '- Page-local components are allowed only when they are not reusable controls.',
      ''
    ].join('\n');
  }
  return [
    `# ${title} Frontend`,
    '',
    'Use this folder for frontend screens and state related to this feature.',
    '',
    'Track loading, empty, success, and error states when relevant.',
    ''
  ].join('\n');
}

export function buildFrontendScreenContract({ slug, title }) {
  return [
    `# ${title} Screen Contract`,
    '',
    '## Route',
    '',
    `Proposed route: \`/${slug}\``,
    '',
    '## States',
    '',
    '- loading',
    '- empty',
    '- success',
    '- error',
    '',
    '## API Usage',
    '',
    'List API ids from `graph/api-graph.json` when this screen calls backend behavior.',
    '',
    '## Verification',
    '',
    'Add frontend build, unit, browser, or screenshot checks when a runtime stack is selected.',
    ''
  ].join('\n');
}

function buildRuoyiApiContract({ slug, title }) {
  return [
    `# ${title} RuoYi API Contract`,
    '',
    `Feature ID: \`${slug}\``,
    '',
    'When runtime API code is implemented, replace or complement this contract with `ruoyi-ui/src/api/<feature>.js` or `.ts` and register endpoints in `graph/api-graph.json` plus `memory/API_CATALOG.md`.',
    '',
    '## Expected Ownership',
    '',
    `- Frontend API module: \`ruoyi-ui/src/api/${slug}.js\` or \`ruoyi-ui/src/api/${slug}.ts\``,
    `- Backend controller package segment: \`${javaPackageSegment(slug)}\``,
    `- Java class prefix: \`${pascalCase(slug)}\``,
    ''
  ].join('\n');
}

function buildRuoyiSqlOwnership({ slug, title }) {
  return [
    `# ${title} RuoYi SQL/Menu/Permission Ownership`,
    '',
    `Feature ID: \`${slug}\``,
    '',
    'Register real SQL files, `sys_menu` rows, permission codes, mapper XML files, and database tables in `ai/registry/features.json` before implementation is considered complete.',
    '',
    '## Expected Permission Pattern',
    '',
    `- \`${slug}:*:list\``,
    `- \`${slug}:*:query\``,
    `- \`${slug}:*:add\``,
    `- \`${slug}:*:edit\``,
    `- \`${slug}:*:remove\``,
    ''
  ].join('\n');
}

function plannedGenericFiles({ slug, title }) {
  return [
    { relativePath: `features/${slug}.md`, content: buildFeatureBrief({ slug, title }) },
    ...plannedContractFiles({ slug, title }),
    { relativePath: `backend/modules/${slug}/README.md`, content: buildBackendReadme({ title, slug }) },
    ...['api', 'service', 'domain', 'repository'].map((layer) => ({
      relativePath: `backend/modules/${slug}/${layer}/README.md`,
      content: buildBackendLayerReadme({ title, layer })
    })),
    { relativePath: `frontend/src/modules/${slug}/README.md`, content: buildFrontendReadme({ title, slug }) },
    { relativePath: `frontend/src/modules/${slug}/screen.md`, content: buildFrontendScreenContract({ slug, title }) }
  ];
}

function plannedRuoyiFiles({ slug, title }) {
  const paths = featurePaths({ id: slug });
  return [
    { relativePath: `features/${slug}.md`, content: buildFeatureBrief({ slug, title }) },
    ...plannedContractFiles({ slug, title }),
    { relativePath: `${paths.backendModules[0]}/README.md`, content: buildBackendReadme({ title, adapter: 'ruoyi', slug, scope: 'business' }) },
    { relativePath: `${paths.backendModules[1]}/README.md`, content: buildBackendReadme({ title, adapter: 'ruoyi', slug, scope: 'controller' }) },
    { relativePath: `ruoyi-ui/src/views/${slug}/README.md`, content: buildFrontendReadme({ title, adapter: 'ruoyi', slug }) },
    { relativePath: `ruoyi-ui/src/views/${slug}/screen.md`, content: buildFrontendScreenContract({ slug, title }) },
    { relativePath: `ruoyi-ui/src/api/${slug}.contract.md`, content: buildRuoyiApiContract({ slug, title }) },
    { relativePath: `sql/${slug}.ownership.md`, content: buildRuoyiSqlOwnership({ slug, title }) }
  ];
}

export function plannedFeatureFiles({ id = '', name = '', adapter = '' }) {
  const identity = resolveFeatureIdentity({ id, name });
  if (identity.errors.length > 0) {
    return { slug: identity.slug, id: identity.id, title: identity.name, name: identity.name, files: [], paths: null, errors: identity.errors };
  }
  const slug = identity.id;
  const title = identity.name;
  const activeAdapter = adapter || configuredPaths().adapter;
  const paths = activeAdapter === 'ruoyi' ? ruoyiFeaturePaths({ id: slug }) : genericFeaturePaths({ id: slug });
  return {
    slug,
    id: slug,
    title,
    name: title,
    adapter: activeAdapter,
    paths,
    files: activeAdapter === 'ruoyi' ? plannedRuoyiFiles({ slug, title }) : plannedGenericFiles({ slug, title }),
    errors: []
  };
}

export function createFeature({
  id = '',
  name = '',
  dryRun = false,
  exists = fs.existsSync,
  mkdir = fs.mkdirSync,
  writeFile = fs.writeFileSync
}) {
  const { slug, title, files, errors: identityErrors = [] } = plannedFeatureFiles({ id, name });
  if (identityErrors.length > 0) {
    return identityErrors;
  }
  if (!slug) {
    return ['Feature id is required.'];
  }

  const errors = [];
  for (const file of files) {
    const absolute = projectPath(file.relativePath);
    if (exists(absolute)) {
      errors.push(`${file.relativePath} already exists.`);
    }
  }

  if (errors.length > 0) {
    return errors;
  }

  if (!dryRun) {
    for (const file of files) {
      const absolute = projectPath(file.relativePath);
      mkdir(path.dirname(absolute), { recursive: true });
      writeFile(absolute, file.content);
    }
  }

  const action = dryRun ? 'Would create' : 'Created';
  console.log(`Feature id: ${slug}`);
  console.log(`Feature name: ${title}`);
  for (const file of files) {
    console.log(`${action} ${file.relativePath}`);
  }
  console.log('Next: fill the feature brief, run npm run build:graph, update API/UI graphs as needed, then run npm run check.');

  return [];
}

export function parseFeatureCliArgs(args) {
  const dryRun = args.includes('--dry-run');
  const idIndex = args.indexOf('--id');
  const nameIndex = args.indexOf('--name');
  const id = idIndex === -1 ? '' : args[idIndex + 1] || '';
  const name = nameIndex === -1 ? '' : args[nameIndex + 1] || '';
  const rest = args.filter((arg, index) => {
    if (arg === '--dry-run' || arg === '--id' || arg === '--name') {
      return false;
    }
    if (idIndex !== -1 && index === idIndex + 1) {
      return false;
    }
    if (nameIndex !== -1 && index === nameIndex + 1) {
      return false;
    }
    return true;
  }).join(' ');
  const parsed = parseFeatureInput(rest);
  return {
    id: id || parsed.id,
    name: name || parsed.name || rest,
    dryRun
  };
}

if (isCli(import.meta.url)) {
  const { id, name, dryRun } = parseFeatureCliArgs(process.argv.slice(2));
  if (!id && !name) {
    console.error('Usage: npm run new:feature -- [新增功能：客户管理] | [--id demo-feature --name 显示名称] | [demo-feature:显示名称] [--dry-run]');
    process.exitCode = 1;
  } else {
    finish('new:feature', createFeature({ id, name, dryRun }));
  }
}
