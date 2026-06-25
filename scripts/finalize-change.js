import fs from 'node:fs';
import { finish, formatJson, isCli, projectPath, readJson, readText, writeOrCheck } from '../tools/common.js';
import { collectChangedFiles } from '../tools/diff-checker.js';

function unique(items) {
  return [...new Set((items || []).filter(Boolean).map((item) => String(item).replace(/\\/g, '/')))].sort();
}

function pathExists(relativePath) {
  return fs.existsSync(projectPath(relativePath));
}

function pathIsFile(relativePath) {
  try {
    return fs.statSync(projectPath(relativePath)).isFile();
  } catch {
    return false;
  }
}

function pathIsDirectory(relativePath) {
  try {
    return fs.statSync(projectPath(relativePath)).isDirectory();
  } catch {
    return false;
  }
}

const TEMPLATE_PHRASES = [
  'Status: prepared',
  'Status: pending',
  'Pending',
  'Pending implementation',
  'The change record was populated before the main gate',
  'Change record prepared by the chat-driven workflow',
  'Describe passing and failing verification',
  'List residual risks',
  'List the next concrete actions'
];

export function templatePhrase(text = '') {
  const lower = String(text).toLowerCase();
  return TEMPLATE_PHRASES.find((phrase) => lower.includes(phrase.toLowerCase())) || '';
}

export function shouldReplaceGeneratedText(currentText = '', { exists = true, force = false } = {}) {
  if (force) {
    return true;
  }
  if (!exists) {
    return true;
  }
  if (!String(currentText).trim()) {
    return true;
  }
  return Boolean(templatePhrase(currentText));
}

function readOptionalText(relativePath) {
  try {
    return { exists: true, text: readText(relativePath) };
  } catch {
    return { exists: false, text: '' };
  }
}

function writeGeneratedMarkdown(relativePath, content, { force = false } = {}, errors) {
  const current = readOptionalText(relativePath);
  if (!shouldReplaceGeneratedText(current.text, { exists: current.exists, force })) {
    return;
  }
  writeOrCheck(relativePath, content, false, errors);
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
    ...(impact.allowedEditRoots || []).filter((item) => pathIsFile(item) && !['ai/changes', 'ai/generated', 'graph', 'memory', 'features', 'tests'].includes(item))
  ]);
}

export function filterChangedFileRecords(files) {
  return unique(files)
    .filter((file) => !file.startsWith('node_modules/') && !file.startsWith('.git/'))
    .filter((file) => !pathIsDirectory(file));
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

function buildVerification({ commands, status = 'prepared', evidence = '' }) {
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
    evidence || 'The change record was populated before the main gate. `npm run check` is the required final verification command for this scaffold.',
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
    '## Impact',
    '',
    changedFiles.length
      ? `This change affects ${changedFiles.length} recorded path(s). See changed-files.json for the complete coverage list.`
      : 'No file impact has been recorded yet.',
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
    ...(nextActions.length ? nextActions.map((action) => `- ${action}`) : ['- Add real verification evidence before closing this change, then rerun `npm run check`.']),
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
    '## Impact',
    '',
    changedFiles.length
      ? `Current change \`${id}\` affects ${changedFiles.length} recorded path(s). See \`ai/changes/${id}/changed-files.json\` for exact coverage.`
      : `Current change \`${id}\` has no recorded file impact yet.`,
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

function appendChangelog({ id, summary, featureId, mode }, errors) {
  const file = 'memory/CHANGELOG.md';
  const current = pathExists(file) ? readText(file).trimEnd() : '# Changelog';
  const today = new Date().toISOString().slice(0, 10);
  const entry = [
    '',
    `## ${today} — ${mode || 'change'}`,
    '',
    `- Change: \`ai/changes/${id}\`.`,
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
  verificationEvidence = '',
  forceVerification = false,
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
  const files = filterChangedFileRecords([
    ...changedFiles,
    ...gitOrRecorded,
    ...flattenImpactFiles(impact),
    ...changeRecordFiles(id)
  ]);

  const safeFiles = files.length ? files : changeRecordFiles(id);
  writeOrCheck(`${dir}/changed-files.json`, formatJson({ schemaVersion: 1, files: safeFiles }), false, errors);
  writeOrCheck(`${dir}/plan.md`, buildPlan({ summary, mode, featureId }), false, errors);
  writeGeneratedMarkdown(
    `${dir}/verification.md`,
    buildVerification({ commands, status: verificationStatus, evidence: verificationEvidence }),
    { force: forceVerification },
    errors
  );
  writeGeneratedMarkdown(
    `${dir}/handover.md`,
    buildChangeHandover({ summary, changedFiles: safeFiles, commands, risks, nextActions }),
    {},
    errors
  );

  if (updateMemory) {
    writeOrCheck('memory/HANDOVER.md', buildMemoryHandover({ id, summary, changedFiles: safeFiles, commands, risks, nextActions }), false, errors);
    appendChangelog({ id, summary, featureId, mode }, errors);
    updateTaskMemory({ featureId, mode }, errors);
  }
  return errors;
}

export function parseArgs(args) {
  const parsed = {
    id: currentChangeId(),
    summary: '',
    commands: [],
    verificationStatus: 'prepared',
    verificationEvidence: '',
    forceVerification: false
  };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--id') {
      parsed.id = args[index + 1] || '';
      index += 1;
    } else if (arg === '--summary') {
      parsed.summary = args[index + 1] || '';
      index += 1;
    } else if (arg === '--status') {
      parsed.verificationStatus = args[index + 1] || 'prepared';
      index += 1;
    } else if (arg === '--evidence') {
      parsed.verificationEvidence = args[index + 1] || '';
      index += 1;
    } else if (arg === '--force-verification') {
      parsed.forceVerification = true;
    } else if (arg === '--command') {
      while (args[index + 1] && !args[index + 1].startsWith('--')) {
        parsed.commands.push(args[index + 1]);
        index += 1;
      }
    }
  }
  if (parsed.commands.length === 0) {
    parsed.commands = ['npm run scan:all', 'npm run close:change', 'npm run check'];
  }
  return parsed;
}

if (isCli(import.meta.url)) {
  finish('finalize:change', finalizeChange(parseArgs(process.argv.slice(2))));
}
