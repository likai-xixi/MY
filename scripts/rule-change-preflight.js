import fs from 'node:fs';
import path from 'node:path';
import {
  fileExists,
  finish,
  isCli,
  projectPath,
  readJson
} from '../tools/common.js';
import { validateRuleObjects } from '../tools/rule-object-checker.js';

const COMPLETE_STATUSES = new Set(['complete', 'completed', 'done', 'passed', 'verified']);

function currentChangeId(readJsonFile = readJson) {
  try {
    return readJsonFile('ai/changes/CURRENT_CHANGE.json').current || '';
  } catch {
    return '';
  }
}

function readJsonSafe(readJsonFile, file, fallback) {
  try {
    return readJsonFile(file);
  } catch {
    return fallback;
  }
}

function asList(value) {
  return Array.isArray(value) ? value : [];
}

function markdownList(items, empty = '- none') {
  return items.length ? items.map((item) => `- \`${item}\``) : [empty];
}

function policyBlock(title, value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  return [
    `**${title}**`,
    '',
    '```json',
    text,
    '```'
  ];
}

function beforeSalesOrderState(readJsonFile) {
  const gates = readJsonSafe(readJsonFile, 'ai/roadmap/phase-gates.json', { gates: {} });
  const backlog = readJsonSafe(readJsonFile, 'ai/roadmap/enhancement-backlog.json', { items: [] });
  const gate = gates.gates?.beforeSalesOrder || {};
  const statuses = new Map(asList(backlog.items).map((item) => [item.id, item.status]));
  const required = asList(gate.required);
  return {
    status: gate.status || 'unknown',
    required,
    incomplete: required.filter((id) => !COMPLETE_STATUSES.has(statuses.get(id)))
  };
}

export function buildRulePreflight({
  ids = [],
  readJsonFile = readJson,
  exists = fileExists,
  validate = validateRuleObjects
} = {}) {
  const changeId = currentChangeId(readJsonFile);
  const registry = readJsonSafe(readJsonFile, 'ai/registry/rule-objects.json', { objects: [] });
  const selectedIds = new Set(ids.filter(Boolean));
  const objects = asList(registry.objects).filter((object) => selectedIds.size === 0 || selectedIds.has(object.id));
  const missingSelected = [...selectedIds].filter((id) => !objects.some((object) => object.id === id));
  const checkerErrors = validate({ readJsonFile, exists });
  const gate = beforeSalesOrderState(readJsonFile);
  const warnings = [];
  if (selectedIds.size === 0) {
    warnings.push('No rule object ids were supplied; preflight covers all registered rule objects.');
  }
  for (const id of missingSelected) {
    checkerErrors.push(`Requested rule object ${id} does not exist.`);
  }

  const lines = [
    '# Rule Change Preflight',
    '',
    `Current change: \`${changeId || '<none>'}\``,
    `Status: \`${checkerErrors.length ? 'blocking' : 'ok'}\``,
    '',
    '## Checker',
    '',
    `Blocking issues: ${checkerErrors.length}`,
    ...markdownList(checkerErrors, '- none'),
    '',
    '## Warnings',
    '',
    ...markdownList(warnings, '- none'),
    '',
    '## Gate State',
    '',
    `beforeSalesOrder: \`${gate.status}\``,
    '',
    'Required items:',
    ...markdownList(gate.required),
    '',
    'Incomplete items:',
    ...markdownList(gate.incomplete),
    '',
    '## Rule Objects',
    ''
  ];

  for (const object of objects) {
    lines.push(
      `### ${object.id}`,
      '',
      `- Name: ${object.name}`,
      `- Type: \`${object.objectType}\``,
      `- Owner feature: \`${object.ownerFeature}\``,
      `- Lifecycle: \`${object.lifecycleStatus}\``,
      `- Version: \`${object.version || '<none>'}\``,
      `- Blocking mode: \`${object.blockingMode}\``,
      `- Created by: \`${object.createdByChange}\``,
      `- Updated by: \`${object.updatedByChange}\``,
      '',
      'Source contracts:',
      ...markdownList(asList(object.sourceContracts)),
      '',
      'Owned files:',
      ...markdownList(asList(object.ownedFiles)),
      '',
      'Tests:',
      ...markdownList(asList(object.tests)),
      '',
      'Immutable fields:',
      ...markdownList(asList(object.immutableFields)),
      '',
      ...policyBlock('Change policy', object.changePolicy),
      '',
      ...policyBlock('Delete policy', object.deletePolicy),
      '',
      ...policyBlock('Snapshot policy', object.snapshotPolicy),
      '',
      'Supersedes:',
      ...markdownList(asList(object.supersedes)),
      '',
      'Superseded by:',
      ...markdownList(asList(object.supersededBy)),
      '',
      `Notes: ${object.notes || ''}`,
      ''
    );
  }

  return { text: `${lines.join('\n')}\n`, errors: checkerErrors, warnings };
}

export function writeRulePreflight({ ids = [], readJsonFile = readJson, exists = fileExists } = {}) {
  const changeId = currentChangeId(readJsonFile);
  if (!changeId) {
    return ['No active change id. Run npm run start:change first.'];
  }
  const { text, errors } = buildRulePreflight({ ids, readJsonFile, exists });
  const file = `ai/changes/${changeId}/rule-preflight.md`;
  const absolute = projectPath(file);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, text);
  console.log(`Wrote ${file}`);
  return errors;
}

if (isCli(import.meta.url)) {
  finish('rule:preflight', writeRulePreflight({ ids: process.argv.slice(2) }));
}
