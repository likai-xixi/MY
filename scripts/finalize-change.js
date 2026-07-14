import fs from 'node:fs';
import { finish, formatJson, isCli, projectPath, readJson, readText, writeOrCheck } from '../tools/common.js';
import { collectChangedFiles } from '../tools/diff-checker.js';
import { markdownStructureRecords, parseTopLevelStatus } from '../tools/verification-provenance-checker.js';

function unique(items) {
  return [...new Set((items || []).filter(Boolean).map((item) => String(item).replace(/\\/g, '/')))].sort();
}

function pathExists(relativePath) {
  return fs.existsSync(projectPath(relativePath));
}

function pathIsDirectory(relativePath) {
  try {
    return fs.statSync(projectPath(relativePath)).isDirectory();
  } catch {
    return false;
  }
}

const TEMPLATE_STATUSES = new Set(['prepared', 'pending']);
const PROJECT_TIME_ZONE = 'Asia/Shanghai';
const CONTROLLED_HANDOVER_HEADINGS = [
  '## Summary',
  '## Impact',
  '## Changed Files',
  '## Commands',
  '## Verification',
  '## Risks',
  '## Next Actions'
];

export function templatePhrase(text = '') {
  const parsed = parseTopLevelStatus(text);
  return parsed.unique && TEMPLATE_STATUSES.has(parsed.status)
    ? `Status: ${parsed.status}`
    : '';
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

export function filterChangedFileRecords(files) {
  return unique(files)
    .filter((file) => !file.startsWith('node_modules/') && !file.startsWith('.git/'))
    .filter((file) => !pathIsDirectory(file));
}

export function resolveFinalizedChangedFiles({ actualFiles = [] } = {}) {
  return filterChangedFileRecords(actualFiles);
}

function markdownList(items, empty = '- none') {
  return items.length ? items.map((item) => `- \`${item}\``) : [empty];
}

function sectionRanges(text, heading) {
  const expected = heading.replace(/^##\s+/, '');
  const records = markdownStructureRecords(text);
  const levelTwoHeadings = records.filter((record) => record.heading?.level === 2);
  return levelTwoHeadings
    .filter((record) => record.heading.text === expected)
    .map((record) => ({
      start: record.index,
      end: levelTwoHeadings.find((candidate) => candidate.index > record.index)?.index
        ?? records.length
    }));
}

export function controlledSectionDuplicates(text = '') {
  return CONTROLLED_HANDOVER_HEADINGS.filter((heading) => sectionRanges(text, heading).length > 1);
}

export function synchronizeChangedFilesSection(currentText = '', changedFiles = []) {
  const text = String(currentText || '').replace(/\r\n?/g, '\n').trimEnd();
  const blockLines = [
    '## Changed Files',
    '',
    ...markdownList(unique(changedFiles)),
    ''
  ];
  const lines = text.split('\n');
  const ranges = sectionRanges(text, '## Changed Files');
  if (ranges.length > 0) {
    const rangesByStart = new Map(ranges.map((range) => [range.start, range]));
    const synchronized = [];
    let index = 0;
    let inserted = false;
    while (index < lines.length) {
      const range = rangesByStart.get(index);
      if (!range) {
        synchronized.push(lines[index]);
        index += 1;
        continue;
      }
      if (!inserted) {
        synchronized.push(...blockLines);
        inserted = true;
      }
      index = range.end;
    }
    return `${synchronized.join('\n').trimEnd()}\n`;
  }
  const block = blockLines.join('\n');
  const insertion = text.match(/^## (?:Commands|Verification|Risks|Next Actions)\s*$/m);
  if (insertion && insertion.index !== undefined) {
    return `${text.slice(0, insertion.index).trimEnd()}\n\n${block}\n${text.slice(insertion.index).trimStart()}`.trimEnd() + '\n';
  }
  return `${text}\n\n${block}`.trimEnd() + '\n';
}

function writeSynchronizedHandover(relativePath, generatedContent, changedFiles, errors) {
  const current = readOptionalText(relativePath);
  const source = shouldReplaceGeneratedText(current.text, { exists: current.exists })
    ? generatedContent
    : current.text;
  const synchronized = synchronizeChangedFilesSection(source, changedFiles);
  const duplicates = controlledSectionDuplicates(synchronized);
  if (duplicates.length > 0) {
    errors.push(`${relativePath} contains duplicate controlled handover sections: ${duplicates.join(', ')}.`);
    return;
  }
  writeOrCheck(relativePath, synchronized, false, errors);
}

function commandList(items) {
  const values = items.length ? items : ['npm run check'];
  return values.map((item) => {
    const text = String(item || '').trim();
    const match = text.match(/^\[(local|ci|ci-planned|runtime-local|runtime-ci|not-run|inconclusive)\]\s*(.*)$/i);
    const provenance = match ? `[${match[1]}]` : '[not-run]';
    const command = match ? match[2] : text;
    return `- ${provenance} \`${command}\``;
  });
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
    '- [not-run] `npm run check` remains the final gate. The change record includes affected files and verification commands so `close:change` can enforce evidence instead of accepting an empty record.',
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


export function buildMemoryHandover({ id, summary, changedFiles, commands, risks = [], nextActions = [] }) {
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
    ...markdownList(changedFiles),
    '',
    '## Commands',
    '',
    ...commandList(commands),
    '',
    '## Verification',
    '',
    '- [not-run] `npm run check` is the remaining full governance gate. Read the current change record for the complete changed-files list and command evidence.',
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

export function projectCalendarDate(date = new Date(), timeZone = PROJECT_TIME_ZONE) {
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) {
    throw new TypeError('projectCalendarDate requires a valid date');
  }
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(value).map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function buildChangelogEntry({ id, summary, featureId, mode, today = projectCalendarDate() }) {
  const lines = [
    `## ${today} - ${mode || 'change'}`,
    '',
    `- Change: \`ai/changes/${id}\`.`,
    `- ${summary || 'Updated change record, registry, graph, generated scans, memory, and handover.'}`
  ];
  if (featureId) {
    lines.push(`- Feature: \`${featureId}\`.`);
  }
  return `${lines.join('\n')}\n`;
}

export function shouldAppendChangelog(currentText = '', id = '') {
  return Boolean(id) && !String(currentText).includes(`- Change: \`ai/changes/${id}\`.`);
}

function appendChangelog({ id, summary, featureId, mode }, errors) {
  const file = 'memory/CHANGELOG.md';
  const current = pathExists(file) ? readText(file).trimEnd() : '# Changelog';
  if (shouldAppendChangelog(current, id)) {
    const entry = buildChangelogEntry({ id, summary, featureId, mode });
    writeOrCheck(file, `${current}\n\n${entry}`, false, errors);
  }
}

function updateTaskMemory({ featureId, mode }, errors) {
  if (!pathExists('memory/TASKS.json')) {
    return;
  }
  const data = readJsonOrDefault('memory/TASKS.json', { schemaVersion: 1, tasks: [] });
  const now = projectCalendarDate();
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
  writeGeneratedMarkdown(`${dir}/plan.md`, buildPlan({ summary, mode, featureId }), {}, errors);
  writeGeneratedMarkdown(
    `${dir}/verification.md`,
    buildVerification({ commands, status: verificationStatus, evidence: verificationEvidence }),
    { force: forceVerification },
    errors
  );
  if (updateMemory) {
    appendChangelog({ id, summary, featureId, mode }, errors);
    updateTaskMemory({ featureId, mode }, errors);
    const provisionalFiles = resolveFinalizedChangedFiles({
      actualFiles: collectChangedFiles({ baseRevision: impact.baseRevision })
    });
    writeSynchronizedHandover(
      'memory/HANDOVER.md',
      buildMemoryHandover({ id, summary, changedFiles: provisionalFiles, commands, risks, nextActions }),
      provisionalFiles,
      errors
    );
  }

  const exactFiles = resolveFinalizedChangedFiles({
    actualFiles: collectChangedFiles({ baseRevision: impact.baseRevision })
  });
  writeOrCheck(`${dir}/changed-files.json`, formatJson({ schemaVersion: 1, files: exactFiles }), false, errors);
  writeSynchronizedHandover(
    `${dir}/handover.md`,
    buildChangeHandover({ summary, changedFiles: exactFiles, commands, risks, nextActions }),
    exactFiles,
    errors
  );
  const settledFiles = resolveFinalizedChangedFiles({
    actualFiles: collectChangedFiles({ baseRevision: impact.baseRevision })
  });
  writeOrCheck(`${dir}/changed-files.json`, formatJson({ schemaVersion: 1, files: settledFiles }), false, errors);
  writeSynchronizedHandover(
    `${dir}/handover.md`,
    buildChangeHandover({ summary, changedFiles: settledFiles, commands, risks, nextActions }),
    settledFiles,
    errors
  );
  if (updateMemory) {
    writeSynchronizedHandover(
      'memory/HANDOVER.md',
      buildMemoryHandover({ id, summary, changedFiles: settledFiles, commands, risks, nextActions }),
      settledFiles,
      errors
    );
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
