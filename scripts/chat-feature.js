import {
  finish,
  formatJson,
  isCli,
  projectPath,
  readJson,
  writeOrCheck
} from '../tools/common.js';
import { defaultProcessRunner } from '../tools/process-runner.js';
import { createFeature, normalizeFeatureNameForMatch, parseFeatureInput, resolveFeatureIdentity, titleFromSlug, plannedFeatureFiles, stripChatActionPrefix } from './new-feature.js';
import { startChange } from './start-change.js';
import { analyzeImpact } from '../tools/impact-analyzer.js';
import { collectFeatureImpact, applyFeatureRemoval } from './remove-feature.js';
import { finalizeChange } from './finalize-change.js';
import { featurePaths, unique } from '../tools/project-config.js';

export function runNpm(args, {
  processRunner = defaultProcessRunner,
  cwd = projectPath(),
  stdio = 'inherit'
} = {}) {
  const result = processRunner.run('npm', ['run', ...args], { cwd, stdio });
  if (!result.error && result.status === 0) {
    return result;
  }
  const reason = result.error?.message || result.signal || `exit code ${result.status}`;
  const resolved = result.resolvedCommand && result.resolvedCommand !== 'npm'
    ? ` resolved as ${result.resolvedCommand}`
    : '';
  throw new Error(`npm run ${args.join(' ')} failed${resolved}: ${reason}`);
}

function hasExplicitDeleteConfirmation(input = '') {
  const headline = String(input || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean) || '';
  return /^(?:确认删除|删除确认|确认移除|确认删除功能|确认删除模块)\s*(?:[:：|｜\-]\s*)?\S/u.test(headline);
}

function readRegistry() {
  try {
    return readJson('ai/registry/features.json');
  } catch {
    return { schemaVersion: 1, description: 'Machine-readable feature ledger.', features: [] };
  }
}

function saveRegistry(registry) {
  const errors = [];
  writeOrCheck('ai/registry/features.json', formatJson(registry), false, errors);
  return errors;
}

function findActiveFeatureByInput({ id = '', name = '' } = {}) {
  const registry = readRegistry();
  const parsed = parseFeatureInput(name || id);
  const identity = resolveFeatureIdentity({ id: id || parsed.id, name: name || parsed.name });
  const requestedIds = new Set([id, parsed.id, identity.id].filter(Boolean));
  const requestedNames = new Set([name, parsed.name, stripChatActionPrefix(name || id)].filter(Boolean).map(normalizeFeatureNameForMatch));
  return (registry.features || []).find((feature) => {
    if (feature.status === 'removed') {
      return false;
    }
    const featureNames = [feature.name, ...(feature.aliases || [])].filter(Boolean).map(normalizeFeatureNameForMatch);
    return requestedIds.has(feature.id)
      || featureNames.some((featureName) => requestedNames.has(featureName))
      || (identity.id && feature.id === identity.id);
  }) || null;
}


function readModulesRegistry() {
  try {
    return readJson('ai/registry/modules.json');
  } catch {
    return { schemaVersion: 1, description: 'Module ownership registry.', modules: [] };
  }
}

function saveModulesRegistry(registry) {
  const errors = [];
  writeOrCheck('ai/registry/modules.json', formatJson(registry), false, errors);
  return errors;
}

function currentChangeId() {
  try {
    return readJson('ai/changes/CURRENT_CHANGE.json').current || '';
  } catch {
    return '';
  }
}

function buildFeatureEntry(identity) {
  const paths = featurePaths({ id: identity.id });
  const docs = unique([
    paths.featureBrief,
    ...(paths.generatedOwnershipFiles || []),
    'memory/API_CATALOG.md',
    'graph/api-graph.json',
    'graph/ui-graph.json'
  ]);
  return {
    id: identity.id,
    name: identity.name,
    aliases: unique([identity.name]),
    status: 'active',
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
    docs,
    controllers: [],
    services: [],
    mappers: [],
    domainObjects: [],
    apiClients: paths.frontendApiFiles || [],
    sqlFiles: paths.sqlFiles || [],
    mapperXmlFiles: paths.mapperXmlFiles || [],
    menuSqlFiles: paths.menuSqlFiles || [],
    permissionFiles: paths.permissionFiles || [],
    ownership: {
      backend: paths.backendModules || [],
      frontend: paths.frontendModules || [],
      api: [],
      ui: [],
      database: [],
      permissions: [],
      menus: paths.menuSqlFiles || [],
      components: [],
      tests: [],
      docs,
      apiClients: paths.frontendApiFiles || [],
      controllers: [],
      services: [],
      mappers: [],
      domainObjects: []
    },
    lastChangedBy: currentChangeId(),
    updatedAt: new Date().toISOString().slice(0, 10)
  };
}

function upsertFeature({ id = '', name = '' }) {
  const identity = resolveFeatureIdentity({ id, name });
  if (identity.errors.length > 0) {
    return identity.errors;
  }
  const registry = readRegistry();
  const entry = buildFeatureEntry(identity);
  const existing = (registry.features || []).find((feature) => feature.id === identity.id);
  if (existing) {
    Object.assign(existing, {
      ...entry,
      aliases: unique([...(existing.aliases || []), ...(entry.aliases || []), identity.name]),
      apis: existing.apis || [],
      screens: existing.screens || [],
      dbTables: existing.dbTables || [],
      permissions: existing.permissions || [],
      components: existing.components || [],
      routes: existing.routes || [],
      tests: existing.tests || [],
      docs: unique([...(existing.docs || []), ...entry.docs]),
      controllers: existing.controllers || [],
      services: existing.services || [],
      mappers: existing.mappers || [],
      domainObjects: existing.domainObjects || [],
      apiClients: unique([...(existing.apiClients || []), ...(entry.apiClients || [])]),
      sqlFiles: unique([...(existing.sqlFiles || []), ...(entry.sqlFiles || [])]),
      mapperXmlFiles: unique([...(existing.mapperXmlFiles || []), ...(entry.mapperXmlFiles || [])]),
      menuSqlFiles: unique([...(existing.menuSqlFiles || []), ...(entry.menuSqlFiles || [])]),
      permissionFiles: unique([...(existing.permissionFiles || []), ...(entry.permissionFiles || [])]),
      ownership: { ...(existing.ownership || {}), ...(entry.ownership || {}) }
    });
  } else {
    registry.features = [...(registry.features || []), entry];
  }
  registry.features.sort((a, b) => a.id.localeCompare(b.id));
  return saveRegistry(registry);
}

function upsertModuleOwnership({ id = '', name = '' }) {
  const identity = resolveFeatureIdentity({ id, name });
  if (identity.errors.length > 0) {
    return identity.errors;
  }
  const paths = featurePaths({ id: identity.id });
  const registry = readModulesRegistry();
  const moduleEntry = {
    id: identity.id,
    name: identity.name,
    type: 'business-feature',
    feature: identity.id,
    backendPath: (paths.backendModules || [])[0] || '',
    frontendPath: (paths.frontendModules || [])[0] || '',
    paths: unique([...(paths.backendModules || []), ...(paths.frontendModules || []), ...(paths.sqlFiles || [])]),
    owner: 'workflow',
    adapter: paths.adapter || 'generic',
    updatedAt: new Date().toISOString().slice(0, 10)
  };
  registry.modules = (registry.modules || []).filter((module) => module.id !== identity.id);
  registry.modules.push(moduleEntry);
  registry.modules.sort((a, b) => a.id.localeCompare(b.id));
  return saveModulesRegistry(registry);
}

function writeChangeImpact(impact) {
  const current = currentChangeId();
  const errors = [];
  writeOrCheck(`ai/changes/${current}/impact.json`, formatJson(impact), false, errors);
  return errors;
}

function buildProjectState() {
  const registry = readRegistry();
  const active = (registry.features || []).filter((feature) => feature.status !== 'removed');
  const featureLines = active.length
    ? active.map((feature) => `- \`${feature.featureBrief || `features/${feature.id}.md`}\` — ${feature.name || feature.id}`)
    : ['- none'];
  const tasks = (() => {
    try {
      return readJson('memory/TASKS.json').tasks || [];
    } catch {
      return [];
    }
  })();
  const activeTask = tasks.find((task) => task.status !== 'done')?.id || 'none';
  return [
    '# Project State',
    '',
    '## Current Goal',
    '',
    'Maintain a chat-driven Codex App development template that lets the user add, update, and remove business features through conversation while repository gates enforce registry, graph, memory, component, and handoff consistency.',
    '',
    '## Status',
    '',
    'The governance layer is ready for a real backend/frontend project. Feature ownership is tracked through registry, graph, generated scans, change records, memory, and handover files.',
    '',
    '## Active Features',
    '',
    ...featureLines,
    '',
    '## Active Task',
    '',
    `\`${activeTask}\` in \`memory/TASKS.json\``,
    '',
    '## Latest Session',
    '',
    '`memory/sessions/2026-06-21-final-template.md`',
    '',
    '## Next Actions',
    '',
    '- Open the project in Codex App.',
    '- Ask Codex to read `AGENTS.md` and run `npm run resume` before business work.',
    '- Use chat requests for `新增功能`, `功能迭代`, `删除功能预分析`, and `确认删除`.',
    '- Run `npm run check` before trusting any completion claim.',
    '',
    '## Open Questions',
    '',
    '- Which runtime-specific backend, frontend, database, and browser checks should be added for the real stack?',
    '',
    '## Last Verification',
    '',
    'Run `npm run check` after any scaffold or business change. Treat it as a governance gate; add runtime-specific verification when real backend or frontend behavior exists.',
    ''
  ].join('\n');
}

function writeProjectState() {
  const errors = [];
  writeOrCheck('memory/PROJECT_STATE.md', buildProjectState(), false, errors);
  return errors;
}

function upsertTask({ id, name, mode = 'add' }) {
  const errors = [];
  let data;
  try {
    data = readJson('memory/TASKS.json');
  } catch {
    data = { schemaVersion: 1, tasks: [] };
  }
  const taskId = `TASK-${id.toUpperCase().replace(/[^A-Z0-9]+/g, '-')}`;
  const existing = (data.tasks || []).find((task) => task.id === taskId || task.feature === id);
  const next = {
    id: existing?.id || taskId,
    feature: id,
    title: `${mode === 'add' ? 'Implement' : 'Maintain'} ${name}`,
    status: existing?.status || 'todo',
    owner: existing?.owner || 'workflow',
    priority: existing?.priority || 'normal',
    statusReason: `Chat workflow prepared ${mode} change record ${currentChangeId()}.`,
    nextStep: 'Complete runtime implementation inside allowed edit roots and rerun npm run check.',
    blockedBy: existing?.blockedBy || [],
    verification: unique([...(existing?.verification || []), 'npm run check']),
    latestSession: existing?.latestSession || 'memory/sessions/2026-06-21-final-template.md',
    latestChange: currentChangeId(),
    handoverRequired: true,
    updatedAt: new Date().toISOString().slice(0, 10)
  };
  data.tasks = (data.tasks || []).filter((task) => task.id !== next.id && task.feature !== id);
  data.tasks.push(next);
  data.tasks.sort((a, b) => a.id.localeCompare(b.id));
  writeOrCheck('memory/TASKS.json', formatJson(data), false, errors);
  return errors;
}

function finalizeWorkflow({ summary, changedFiles, commands, risks = [], nextActions = [] }) {
  return finalizeChange({
    summary,
    changedFiles,
    commands,
    risks,
    nextActions,
    verificationStatus: 'prepared',
    verificationNote: 'Generated by the chat-driven workflow before the final `npm run check` gate.',
    updateMemory: true
  });
}

export function addFeatureWorkflow({ id = '', name = '' }) {
  const identity = resolveFeatureIdentity({ id, name });
  if (identity.errors.length > 0) {
    return identity.errors;
  }
  const existingFeature = findActiveFeatureByInput({ id: identity.id, name: identity.name });
  if (existingFeature) {
    console.log(`Feature ${existingFeature.id} already exists. Switching add request to update workflow.`);
    return updateFeatureWorkflow({ id: existingFeature.id, name: existingFeature.name || identity.name });
  }
  const errors = [];
  runNpm(['resume']);
  const change = startChange({ title: `新增功能：${identity.name}`, mode: 'add' });
  errors.push(...change.errors);
  const planned = plannedFeatureFiles({ id: identity.id, name: identity.name });
  errors.push(...createFeature({ id: identity.id, name: identity.name, dryRun: false }));
  errors.push(...upsertFeature({ id: identity.id, name: identity.name }));
  errors.push(...upsertModuleOwnership({ id: identity.id, name: identity.name }));
  errors.push(...upsertTask({ id: identity.id, name: identity.name, mode: 'add' }));
  const impact = analyzeImpact({ name: identity.id, mode: 'add' });
  errors.push(...writeChangeImpact(impact));
  if (errors.length > 0) {
    return errors;
  }
  runNpm(['build:graph']);
  runNpm(['sync:memory']);
  runNpm(['scan:all']);
  errors.push(...writeProjectState());
  errors.push(...finalizeWorkflow({
    summary: `Added feature scaffold and ownership records for \`${identity.id}\` (${identity.name}).`,
    changedFiles: unique([
      ...(planned.files || []).map((file) => file.relativePath),
      'ai/registry/features.json',
      'ai/registry/modules.json',
      'memory/TASKS.json',
      'memory/PROJECT_STATE.md',
      'memory/MODULE_MAP.md',
      'memory/HANDOVER.md',
      'memory/CHANGELOG.md',
      'graph/module-graph.json',
      'graph/render-graph.mmd',
      'ai/generated/backend-routes.json',
      'ai/generated/frontend-routes.json',
      'ai/generated/api-clients.json',
      'ai/generated/db-schema.json',
      'ai/generated/permissions.json',
      'ai/generated/component-usage.json'
    ]),
    commands: ['npm run resume', 'npm run build:graph', 'npm run sync:memory', 'npm run scan:all', 'npm run sync:ownership', 'npm run check'],
    nextActions: ['Implement runtime backend, frontend, database, permission, and tests inside the registered ownership paths.']
  }));
  if (errors.length > 0) {
    return errors;
  }
  runNpm(['check']);
  return errors;
}

function writePreparedUpdateRecord({ identity, impact }) {
  const current = currentChangeId();
  const errors = [];
  const plan = [
    '# Plan',
    '',
    'Mode: `update`',
    `Feature: \`${identity.id}\``,
    '',
    '1. Keep this change record open while runtime code is implemented.',
    '2. Edit only inside `impact.allowedEditRoots`.',
    '3. Reuse registered shared components before creating any module-local component.',
    '4. Run `npm run scan:all` so generated scans and ownership are refreshed.',
    '5. Run `npm run finalize:change` after code, registry, graph, memory, docs, and tests are updated.',
    '6. Run `npm run check`; do not close or claim completion until it passes.',
    '',
    '## Allowed Edit Roots',
    '',
    ...(impact.allowedEditRoots || []).map((root) => `- \`${root}\``),
    ''
  ].join('\n');
  writeOrCheck(`ai/changes/${current}/plan.md`, plan, false, errors);
  writeOrCheck(`ai/changes/${current}/verification.md`, '# Verification\n\n- Pending implementation. Run `npm run scan:all`, `npm run finalize:change`, and `npm run check` after code changes.\n', false, errors);
  writeOrCheck(`ai/changes/${current}/handover.md`, '# Handover\n\nPending implementation. This update change record intentionally remains open until runtime code and verification are complete.\n', false, errors);
  return errors;
}

export function updateFeatureWorkflow({ id = '', name = '' }) {
  const existingFeature = findActiveFeatureByInput({ id, name });
  const identity = existingFeature
    ? { id: existingFeature.id, slug: existingFeature.id, name: existingFeature.name || existingFeature.id, errors: [] }
    : resolveFeatureIdentity({ id, name });
  if (identity.errors.length > 0) {
    return identity.errors;
  }
  runNpm(['resume']);
  const change = startChange({ title: `功能迭代：${identity.name}`, mode: 'update' });
  const impact = analyzeImpact({ name: identity.id, mode: 'update' });
  const errors = [...change.errors, ...writeChangeImpact(impact), ...writePreparedUpdateRecord({ identity, impact })];
  if (impact.blockers.length > 0) {
    errors.push(...impact.blockers);
  }
  console.log(JSON.stringify(impact, null, 2));
  console.log(`Update change record remains open: ai/changes/${currentChangeId()}`);
  console.log('Next: implement inside impact.allowedEditRoots, then run npm run scan:all, npm run finalize:change, and npm run check.');
  return errors;
}

export function removeFeatureDryRunWorkflow({ id = '', name = '' }) {
  const input = id || name;
  if (!input) {
    return ['Feature id or name is required.'];
  }
  runNpm(['resume']);
  const parsed = parseFeatureInput(input);
  const display = parsed.name || parsed.id || input;
  const change = startChange({ title: `删除功能预分析：${display}`, mode: 'remove-dry-run' });
  const impact = collectFeatureImpact({ name: input });
  const errors = [...change.errors, ...writeChangeImpact({ schemaVersion: 1, mode: 'remove-dry-run', feature: { id: impact.slug, name: impact.name, status: 'active' }, ...impact })];
  errors.push(...finalizeWorkflow({
    summary: `Prepared deletion dry-run impact list for \`${impact.slug}\` (${impact.name}). No business files were deleted.`,
    changedFiles: [`ai/changes/${currentChangeId()}/request.md`, `ai/changes/${currentChangeId()}/impact.json`],
    commands: ['npm run resume', `npm run feature:remove -- ${impact.slug || input} --dry-run`, 'npm run close:change'],
    risks: ['Dry-run does not delete files. Review blockers and affected paths before sending a confirmation request.'],
    nextActions: [`Confirm deletion only with \`确认删除：${impact.slug || input}\` after reviewing the impact list.`]
  }));
  console.log(JSON.stringify(impact, null, 2));
  return errors;
}

export function removeFeatureApplyWorkflow({ id = '', name = '', confirm }) {
  const input = id || name;
  if (!input) {
    return ['Feature id or name is required.'];
  }
  const impact = collectFeatureImpact({ name: input });
  const confirmedFeature = confirm || (hasExplicitDeleteConfirmation(input) ? impact.slug : '');
  if (!confirmedFeature) {
    return ['Deletion apply requires explicit confirmation. Use `确认删除：<feature>` in chat or pass `--confirm <feature-id>`.'];
  }
  runNpm(['resume']);
  const errors = [];
  const current = currentChangeId();
  if (!current) {
    const change = startChange({ title: `确认删除：${impact.name || input}`, mode: 'remove-apply' });
    errors.push(...change.errors);
  }
  errors.push(...writeChangeImpact({ schemaVersion: 1, mode: 'remove-apply', feature: { id: impact.slug, name: impact.name, status: 'removed' }, ...impact }));
  errors.push(...applyFeatureRemoval(impact, { confirm: confirmedFeature }));
  if (errors.length > 0) {
    return errors;
  }
  errors.push(...writeChangeImpact({ schemaVersion: 1, mode: 'remove-apply', feature: { id: impact.slug, name: impact.name, status: 'removed' }, ...impact }));
  runNpm(['scan:all']);
  errors.push(...writeProjectState());
  errors.push(...finalizeWorkflow({
    summary: `Applied feature deletion for \`${impact.slug}\` (${impact.name}) and updated registry, graph, scans, memory, changelog, and handover.`,
    changedFiles: unique([
      ...(impact.removeFiles || []),
      ...(impact.updateFiles || []),
      impact.deletionBundle || '',
      'ai/registry/features.json',
      'ai/registry/modules.json',
      'memory/TASKS.json',
      'memory/PROJECT_STATE.md',
      'memory/MODULE_MAP.md',
      'memory/HANDOVER.md',
      'memory/CHANGELOG.md',
      'graph/module-graph.json',
      'graph/render-graph.mmd',
      'ai/generated/backend-routes.json',
      'ai/generated/frontend-routes.json',
      'ai/generated/api-clients.json',
      'ai/generated/db-schema.json',
      'ai/generated/permissions.json',
      'ai/generated/component-usage.json'
    ]),
    commands: ['npm run resume', `npm run feature:remove -- ${impact.slug} --apply --confirm ${impact.slug}`, 'npm run scan:all', 'npm run sync:ownership', `npm run check:orphan -- ${impact.slug}`, 'npm run check'],
    risks: ['Runtime database rows or production menu records can only be removed automatically when registered as owned files or ledger entries.'],
    nextActions: ['Review version control diff and run stack-specific runtime regression tests.']
  }));
  if (errors.length > 0) {
    return errors;
  }
  runNpm(['check:orphan', '--', impact.slug]);
  runNpm(['check']);
  return [];
}

function parseArgs(args) {
  const action = args[0] || '';
  const confirmIndex = args.indexOf('--confirm');
  const confirm = confirmIndex === -1 ? '' : args[confirmIndex + 1] || '';
  const idIndex = args.indexOf('--id');
  const explicitId = idIndex === -1 ? '' : args[idIndex + 1] || '';
  const nameIndex = args.indexOf('--name');
  const explicitName = nameIndex === -1 ? '' : args[nameIndex + 1] || '';
  const rest = args.slice(1).filter((arg, index) => {
    const absoluteIndex = index + 1;
    if (['--confirm', '--id', '--name'].includes(arg)) {
      return false;
    }
    if (confirmIndex !== -1 && absoluteIndex === confirmIndex + 1) {
      return false;
    }
    if (idIndex !== -1 && absoluteIndex === idIndex + 1) {
      return false;
    }
    if (nameIndex !== -1 && absoluteIndex === nameIndex + 1) {
      return false;
    }
    return true;
  }).join(' ');
  const parsed = parseFeatureInput(rest);
  return {
    action,
    id: explicitId || parsed.id,
    name: explicitName || parsed.name || rest,
    confirm
  };
}

if (isCli(import.meta.url)) {
  const { action, id, name, confirm } = parseArgs(process.argv.slice(2));
  let errors = [];
  if (action === 'add') {
    errors = addFeatureWorkflow({ id, name });
  } else if (action === 'update') {
    errors = updateFeatureWorkflow({ id, name });
  } else if (action === 'remove-dry-run') {
    errors = removeFeatureDryRunWorkflow({ id, name });
  } else if (action === 'remove-apply') {
    errors = removeFeatureApplyWorkflow({ id, name, confirm });
  } else {
    errors = ['Usage: node scripts/chat-feature.js add|update|remove-dry-run|remove-apply [新增功能：客户管理] [--id demo-feature --name 显示名称] [--confirm <id>]'];
  }
  finish(`ai:${action || 'feature'}`, errors);
}
