import fs from 'node:fs';
import { finish, formatJson, isCli, projectPath, readJson, readText, writeOrCheck } from '../tools/common.js';
import { collectChangedFiles } from '../tools/diff-checker.js';

function unique(items) {
  return [...new Set((items || []).filter(Boolean).map((item) => String(item).replace(/\\/g, '/')))].sort();
}

function pathExists(relativePath) {
  return fs.existsSync(projectPath(relativePath));
}

export function currentChangeId() {
  try {
    return readJson('ai/changes/CURRENT_CHANGE.json').current || '';
  } catch {
    return '';
  }
}

function readJsonOrDefault(relativePath, fallback) {
  try {
    return readJson(relativePath);
  } catch {
    return fallback;
  }
}

function flattenImpactFiles(impact) {
  const affected = impact.affected || {};
  return unique([
    affected.feature,
    ...(affected.backendModules || []),
    ...(affected.frontendModules || []),
    ...(affected.tests || []),
    ...(affected.docs || []),
    ...(affected.generatedScans || []),
    ...(impact.removeFiles || []),
    ...(impact.updateFiles || []),
    ...(impact.allowedEditRoots || []).filter((item) => pathExists(item) && !['ai/changes', 'ai/generated', 'graph', 'memory', 'features', 'tests'].includes(item))
  ]);
}

function changeRecordFiles(id) {
  return [
    `ai/changes/${id}/request.md`,
    `ai/changes/${id}/impact.json`,
    `ai/changes/${id}/plan.md`,
    `ai/changes/${id}/changed-files.json`,
    `ai/changes/${id}/verification.md`,
    `ai/changes/${id}/handover.md`,
    'ai/changes/CURRENT_CHANGE.json'
  ];
}

function markdownList(items, empty = '- none') {
  return items.length ? items.map((item) => `- \`${item}\``) : [empty];
}

function commandList(items) {
  return items.length ? items.map((item) => `- \`${item}\``) : ['- `npm run check`'];
}

function buildPlan({ summary, mode, featureId }) {
  return [
    '# Plan',
    '',
    `Mode: \`${mode || 'update'}\``,
    featureId ? `Feature: \`${featureId}\`` : 'Feature: not specified',
    '',
    '1. Read project memory and feature ownership.',
    '2. Restrict edits to `impact.allowedEditRoots`.',
    '3. Update code, registry, graph, generated scan files, memory, changelog, and handover together.',
    '4. Run the required verification commands and keep this change record complete.',
    '',
    '## Summary',
    '',
    summary || 'Change prepared by the chat-driven workflow.',
    ''
  ].join('\n');
}

function buildVerification({ commands, status = 'prepared', note = '' }) {
  return [
    '# Verification',
    '',
    `Status: ${status}`,
    '',
    '## Commands',
    '',
    ...commandList(commands),
    '',
    '## Evidence',
    '',
    note || 'The change record was populated before the main gate. `npm run check` is the required final verification command for this scaffold.',
    ''
  ].join('\n');
}

function buildChangeHandover({ summary, changedFiles, commands, risks = [], nextActions = [] }) {
  return [
    '# Handover',
    '',
    '## Summary',
    '',
    summary || 'Change record prepared by the chat-driven workflow.',
    '',
    '## Changed Files',
    '',
    ...markdownList(changedFiles),
    '',
    '## Commands',
    '',
    ...commandList(commands),
    '',
    '## Verification',
    '',
    '`npm run check` remains the final gate. The change record includes affected files and verification commands so `close:change` can enforce evidence instead of accepting an empty record.',
    '',
    '## Risks',
    '',
    ...(risks.length ? risks.map((risk) => `- ${risk}`) : ['- Business runtime behavior still requires stack-specific backend/frontend tests once real code is implemented.']),
    '',
    '## Next Actions',
    '',
    ...(nextActions.length ? nextActions.map((action) => `- ${action}`) : ['- Continue implementation inside the allowed edit roots and rerun `npm run check`.']),
    ''
  ].join('\n');
}


function buildMemoryHandover({ id, summary, changedFiles, commands, risks = [], nextActions = [] }) {
  return [
    '# Handover',
    '',
    '## Summary',
    '',
    `${summary || 'Project handover updated by the chat-driven workflow.'}`,
    '',
    `Current change record: \`ai/changes/${id}\`.`,
    '',
    '## Changed Files',
    '',
    ...markdownList(changedFiles.slice(0, 30)),
    changedFiles.length > 30 ? `- plus ${changedFiles.length - 30} additional files in the current change record.` : '',
    '',
    '## Commands',
    '',
    ...commandList(commands),
    '',
    '## Verification',
    '',
    'Use `npm run check` as the full governance gate. Read the current change record for the complete changed-files list and command evidence.',
    '',
    '## Risks',
    '',
    ...(risks.length ? risks.map((risk) => `- ${risk}`) : ['- Runtime behavior still needs stack-specific tests when real code exists.']),
    '',
    '## Next Actions',
    '',
    ...(nextActions.length ? nextActions.map((action) => `- ${action}`) : ['- Continue the next concrete task from `memory/TASKS.json`.']),
    ''
  ].filter((line) => line !== '').join('\n') + '\n';
}

function appendChangelog({ summary, featureId, mode }, errors) {
  const file = 'memory/CHANGELOG.md';
  const current = pathExists(file) ? readText(file).trimEnd() : '# Changelog';
  const today = new Date().toISOString().slice(0, 10);
  const entry = [
    '',
    `## ${today} — ${mode || 'change'}`,
    '',
    `- ${summary || 'Updated change record, registry, graph, generated scans, memory, and handover.'}`,
    featureId ? `- Feature: \`${featureId}\`.` : '',
    ''
  ].filter((line) => line !== '').join('\n');
  if (!current.includes(summary || '__never__')) {
    writeOrCheck(file, `${current}${entry}\n`, false, errors);
  }
}

function updateTaskMemory({ featureId, mode }, errors) {
  if (!pathExists('memory/TASKS.json')) {
    return;
  }
  const data = readJsonOrDefault('memory/TASKS.json', { schemaVersion: 1, tasks: [] });
  const now = new Date().toISOString().slice(0, 10);
  const id = currentChangeId();
  for (const task of data.tasks || []) {
    if (!featureId || task.feature === featureId) {
      task.latestChange = id;
      task.updatedAt = now;
      task.verification = Array.from(new Set([...(task.verification || []), 'npm run check']));
      if (mode === 'remove-apply' || mode === 'remove') {
        task.statusReason = `Feature removal workflow ${id} updated ownership and orphan checks.`;
      }
    }
  }
  writeOrCheck('memory/TASKS.json', formatJson(data), false, errors);
}

export function finalizeChange({
  id = currentChangeId(),
  summary = '',
  changedFiles = [],
  commands = ['npm run scan:all', 'npm run close:change', 'npm run check'],
  verificationStatus = 'prepared',
  verificationNote = '',
  risks = [],
  nextActions = [],
  updateMemory = true
} = {}) {
  const errors = [];
  if (!id) {
    return ['No active change id. Run npm run start:change first.'];
  }
  const dir = `ai/changes/${id}`;
  const impact = readJsonOrDefault(`${dir}/impact.json`, { schemaVersion: 1, mode: 'update', feature: {}, affected: {}, allowedEditRoots: ['ai/changes'] });
  const featureId = impact.feature?.id || impact.slug || impact.feature || '';
  const mode = impact.mode || 'update';
  const gitOrRecorded = collectChangedFiles();
  const files = unique([
    ...changedFiles,
    ...gitOrRecorded,
    ...flattenImpactFiles(impact),
    ...changeRecordFiles(id)
  ]).filter((file) => !file.startsWith('node_modules/') && !file.startsWith('.git/'));

  const safeFiles = files.length ? files : changeRecordFiles(id);
  writeOrCheck(`${dir}/changed-files.json`, formatJson({ schemaVersion: 1, files: safeFiles }), false, errors);
  writeOrCheck(`${dir}/plan.md`, buildPlan({ summary, mode, featureId }), false, errors);
  writeOrCheck(`${dir}/verification.md`, buildVerification({ commands, status: verificationStatus, note: verificationNote }), false, errors);
  writeOrCheck(`${dir}/handover.md`, buildChangeHandover({ summary, changedFiles: safeFiles, commands, risks, nextActions }), false, errors);

  if (updateMemory) {
    writeOrCheck('memory/HANDOVER.md', buildMemoryHandover({ id, summary, changedFiles: safeFiles, commands, risks, nextActions }), false, errors);
    appendChangelog({ summary, featureId, mode }, errors);
    updateTaskMemory({ featureId, mode }, errors);
  }
  return errors;
}

function parseArgs(args) {
  const idIndex = args.indexOf('--id');
  const summaryIndex = args.indexOf('--summary');
  const commandIndex = args.indexOf('--command');
  const id = idIndex === -1 ? currentChangeId() : args[idIndex + 1] || '';
  const summary = summaryIndex === -1 ? '' : args[summaryIndex + 1] || '';
  const commands = commandIndex === -1 ? ['npm run scan:all', 'npm run close:change', 'npm run check'] : args.slice(commandIndex + 1).filter((item) => !item.startsWith('--'));
  return { id, summary, commands };
}

if (isCli(import.meta.url)) {
  const { id, summary, commands } = parseArgs(process.argv.slice(2));
  finish('finalize:change', finalizeChange({ id, summary, commands }));
}
