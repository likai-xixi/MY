import {
  ensure,
  fileExists,
  finish,
  isCli,
  readJson,
  readText
} from './common.js';
import { collectChangedFiles, collectFileDiffs, validateBaseRevision } from './diff-checker.js';
import {
  markdownStructureRecords,
  nonSuccessProvenanceSuccessClaims,
  parseTopLevelStatus
} from './verification-provenance-checker.js';

const TEMPLATE_PHRASES = [
  'codex must fill',
  'continue implementation inside the allowed edit roots',
  'describe passing and failing verification',
  'describe what changed',
  'list residual risks',
  'list the next concrete actions',
  'pending implementation',
  'prepared by the chat-driven workflow',
  'run the required verification commands',
  'the change record was populated before the main gate',
  'todo',
  'tbd',
  'update this list'
];

const CONTROLLED_HANDOVER_HEADINGS = [
  '## Summary',
  '## Impact',
  '## Changed Files',
  '## Commands',
  '## Verification',
  '## Risks',
  '## Next Actions'
];

const SEMANTIC_GATES = [
  {
    name: 'API',
    touched: (file) => (
      isJavaController(file)
      || file.startsWith('ruoyi-ui/src/api/')
      || file.startsWith('frontend/src/api/')
      || (file.startsWith('ai/contracts/') && file.endsWith('.api.md'))
    ),
    artifacts: [
      'graph/api-graph.json',
      'memory/API_CATALOG.md',
      'ai/generated/backend-routes.json',
      'ai/generated/api-clients.json'
    ],
    artifactMatch: (file) => (
      file.startsWith('ruoyi-ui/src/api/') && file.endsWith('.contract.md')
      || (file.startsWith('ai/contracts/') && file.endsWith('.api.md'))
    ),
    noChangePattern: /\b(api|endpoint|route)s?\b[\s\S]{0,80}\b(no|without)\b[\s\S]{0,80}\b(contract|semantic|surface)?\s*changes?\b/i
  },
  {
    name: 'UI',
    touched: (file) => (
      file.startsWith('ruoyi-ui/src/views/')
      || file.startsWith('ruoyi-ui/src/router/')
      || file.startsWith('frontend/src/modules/')
      || (file.startsWith('ai/contracts/') && file.endsWith('.ui.md'))
    ),
    artifacts: [
      'graph/ui-graph.json',
      'ai/generated/frontend-routes.json'
    ],
    artifactMatch: (file) => (
      file.endsWith('/screen.md')
      || file.startsWith('features/')
      || (file.startsWith('ai/contracts/') && file.endsWith('.ui.md'))
    ),
    noChangePattern: /\b(ui|screen|route|frontend)\b[\s\S]{0,80}\b(no|without)\b[\s\S]{0,80}\b(contract|semantic|surface)?\s*changes?\b/i
  },
  {
    name: 'DB',
    touched: (file) => (
      file.startsWith('sql/')
      || file.endsWith('.sql')
      || (file.includes('/mapper/') && file.endsWith('.xml'))
      || (file.startsWith('ai/contracts/') && file.endsWith('.db.md'))
    ),
    artifacts: [
      'ai/generated/db-schema.json',
      'ai/registry/db.json'
    ],
    artifactMatch: (file) => (
      file.endsWith('.ownership.md')
      || (file.startsWith('ai/contracts/') && file.endsWith('.db.md'))
    ),
    noChangePattern: /\b(db|database|sql|schema|table)\b[\s\S]{0,80}\b(no|without)\b[\s\S]{0,80}\b(contract|semantic|surface)?\s*changes?\b/i
  },
  {
    name: 'permission',
    touched: (file) => (
      isJavaController(file)
      || file.startsWith('ruoyi-ui/src/views/')
      || file.startsWith('sql/')
      || (file.startsWith('ai/contracts/') && file.endsWith('.permission.md'))
    ),
    artifacts: [
      'ai/generated/permissions.json',
      'ai/registry/permissions.json'
    ],
    artifactMatch: (file) => (
      file.endsWith('.ownership.md')
      || (file.startsWith('ai/contracts/') && file.endsWith('.permission.md'))
    ),
    noChangePattern: /\b(permission|auth|menu)\b[\s\S]{0,80}\b(no|without)\b[\s\S]{0,80}\b(contract|semantic|surface)?\s*changes?\b/i
  },
  {
    name: 'component',
    touched: (file) => (
      file.startsWith('ruoyi-ui/src/components/')
      || file.startsWith('ruoyi-ui/src/layout/components/')
      || file.startsWith('frontend/src/components/')
      || file === 'ai/registry/components.json'
    ),
    artifacts: [
      'ai/registry/components.json',
      'ai/generated/component-usage.json',
      'frontend/src/components/catalog.json',
      'ruoyi-ui/src/components/catalog.json'
    ],
    artifactMatch: () => false,
    noChangePattern: /\b(component|shared ui)\b[\s\S]{0,80}\b(no|without)\b[\s\S]{0,80}\b(contract|semantic|surface)?\s*changes?\b/i
  }
];

function unique(items) {
  return [...new Set((items || []).map(normalizePath).filter(Boolean))].sort();
}

function normalizePath(file) {
  return String(file || '').trim().replace(/\\/g, '/').replace(/^\.\//, '');
}

function isCanonicalRepositoryFile(rawFile) {
  if (typeof rawFile !== 'string') {
    return false;
  }
  const file = normalizePath(rawFile);
  return Boolean(file)
    && rawFile === file
    && !file.startsWith('/')
    && !/^[A-Za-z]:/.test(file)
    && !file.split('/').some((part) => part === '.' || part === '..' || part === '')
    && !/[*?\[\]{}!]/.test(file)
    && !file.endsWith('/');
}

function validateRawChangedFiles({ files, label, errors }) {
  if (!Array.isArray(files)) {
    errors.push(`${label} files must be an array of exact canonical repository-relative paths.`);
    return [];
  }
  const seen = new Set();
  const validated = [];
  for (const [index, rawFile] of files.entries()) {
    if (typeof rawFile === 'string' && seen.has(rawFile)) {
      errors.push(`${label} contains duplicate raw file entry: ${rawFile}.`);
      continue;
    }
    if (typeof rawFile === 'string') {
      seen.add(rawFile);
    }
    if (!isCanonicalRepositoryFile(rawFile)) {
      errors.push(`${label} entry ${index + 1} must be one exact canonical repository-relative path: ${JSON.stringify(rawFile)}.`);
      continue;
    }
    validated.push(rawFile);
  }
  return validated.sort();
}

function currentChangeId({ readJsonFile = readJson } = {}) {
  try {
    return readJsonFile('ai/changes/CURRENT_CHANGE.json').current || '';
  } catch {
    return '';
  }
}

function readJsonSafe(relativePath, fallback, readJsonFile) {
  try {
    return readJsonFile(relativePath);
  } catch {
    return fallback;
  }
}

function readTextSafe(relativePath, readFile) {
  try {
    return readFile(relativePath);
  } catch {
    return '';
  }
}

function sectionText(text, heading) {
  const expected = heading.replace(/^##\s+/, '');
  const records = markdownStructureRecords(text);
  const start = records.find((record) => record.heading?.level === 2 && record.heading.text === expected);
  if (!start) {
    return '';
  }
  const end = records.find((record) => record.index > start.index && record.heading?.level === 2)?.index
    ?? records.length;
  return records.slice(start.index + 1, end).map((record) => record.text).join('\n').trim();
}

function hasHeading(text, heading) {
  const expected = heading.replace(/^##\s+/, '');
  return markdownStructureRecords(text)
    .some((record) => record.heading?.level === 2 && record.heading.text === expected);
}

function headingCount(text, heading) {
  const expected = heading.replace(/^##\s+/, '');
  return markdownStructureRecords(text)
    .filter((record) => record.heading?.level === 2 && record.heading.text === expected)
    .length;
}

function validateControlledHandoverSections({ handover, label, errors }) {
  for (const heading of CONTROLLED_HANDOVER_HEADINGS) {
    const count = headingCount(handover, heading);
    ensure(count === 1, `${label} must contain exactly one ${heading} section; found ${count}.`, errors);
  }
}

function validateNonSuccessProvenanceClaims({ text, label, errors }) {
  for (const contradiction of nonSuccessProvenanceSuccessClaims(text)) {
    errors.push(
      `${label}:${contradiction.line} uses non-success provenance [${contradiction.tag}] while claiming a successful result (${contradiction.assertion}) in the same record.`
    );
  }
}

function parseHandoverChangedFiles({ handover, label, errors }) {
  if (!hasHeading(handover, '## Changed Files')) {
    errors.push(`${label} must include ## Changed Files with one exact backticked file per bullet.`);
    return [];
  }
  const section = sectionText(handover, '## Changed Files');
  if (!section) {
    errors.push(`${label} ## Changed Files must not be empty.`);
    return [];
  }
  const files = [];
  const seen = new Set();
  for (const [index, line] of section.split('\n').entries()) {
    if (!line.trim()) continue;
    const match = line.match(/^\s*-\s+`([^`]+)`\s*$/);
    if (!match) {
      errors.push(`${label} cannot parse Changed Files line ${index + 1}: ${line.trim()}`);
      continue;
    }
    const rawFile = match[1];
    const file = normalizePath(rawFile);
    if (
      rawFile !== file
      || file.startsWith('/')
      || /^[A-Za-z]:/.test(file)
      || file.split('/').some((part) => part === '.' || part === '..')
      || /[*?\[\]{}!]/.test(file)
      || file.endsWith('/')
    ) {
      errors.push(`${label} Changed Files path must be one exact normalized file: ${rawFile}`);
      continue;
    }
    if (seen.has(file)) {
      errors.push(`${label} Changed Files contains duplicate file: ${file}`);
      continue;
    }
    seen.add(file);
    files.push(file);
  }
  return files;
}

function validateHandoverChangedFiles({ changedFiles, handover, label, errors }) {
  const listedFiles = parseHandoverChangedFiles({ handover, label, errors });
  const recorded = new Set(changedFiles);
  const listed = new Set(listedFiles);
  for (const file of changedFiles) {
    ensure(listed.has(file), `${label} ## Changed Files is missing recorded file: ${file}.`, errors);
  }
  for (const file of listedFiles) {
    ensure(recorded.has(file), `${label} ## Changed Files lists ${file}, which is not recorded in changed-files.json.`, errors);
  }
}

function containsTemplateText(text) {
  const lower = text.toLowerCase();
  return TEMPLATE_PHRASES.find((phrase) => lower.includes(phrase));
}

function hasCommand(text, commandPattern) {
  return commandPattern.test(text);
}

function isChangeRecordFile(file, id) {
  return file === 'ai/changes/CURRENT_CHANGE.json' || file.startsWith(`ai/changes/${id}/`);
}

function isMemoryCloseoutFile(file) {
  return [
    'memory/HANDOVER.md',
    'memory/CHANGELOG.md',
    'memory/PROJECT_STATE.md',
    'memory/TASKS.json'
  ].includes(file) || file.startsWith('memory/sessions/');
}

function isSubstantiveFile(file, id) {
  return !isChangeRecordFile(file, id) && !isMemoryCloseoutFile(file);
}

function isGovernanceFile(file) {
  return [
    'package.json',
    'AGENTS.md'
  ].includes(file)
    || file.startsWith('scripts/')
    || file.startsWith('tools/')
    || file.startsWith('tests/')
    || file.startsWith('agents/')
    || file.startsWith('ai/rules/')
    || file.startsWith('ai/adapters/')
    || file.startsWith('ai/rule-proposals/')
    || file === 'ai/project-profile.json'
    || file.startsWith('.github/workflows/');
}

function isJavaController(file) {
  return file.endsWith('Controller.java') || (file.includes('/controller/') && file.endsWith('.java'));
}

function referencesCurrentChange(text, id) {
  return text.includes(id) || text.includes(`ai/changes/${id}`);
}

function validateChangedFilesCoverage({ id, changedFiles, actualFiles, errors }) {
  const recorded = new Set(changedFiles);
  const actual = new Set(actualFiles);
  for (const file of actualFiles) {
    ensure(recorded.has(file), `${file} is changed in Git but missing from ai/changes/${id}/changed-files.json.`, errors);
  }
  for (const file of changedFiles) {
    ensure(actual.has(file), `${file} is recorded in ai/changes/${id}/changed-files.json but is not changed since impact.baseRevision.`, errors);
  }
}

function validateVerification({ id, changedFiles, verification, errors }) {
  ensure(verification.trim().length > 0, `ai/changes/${id}/verification.md must not be empty.`, errors);
  const substantiveFiles = changedFiles.filter((file) => isSubstantiveFile(file, id));
  const templatePhrase = containsTemplateText(verification);
  const parsedStatus = parseTopLevelStatus(verification);
  ensure(!templatePhrase, `ai/changes/${id}/verification.md still contains template evidence text: ${templatePhrase}`, errors);
  ensure(parsedStatus.fields.length === 1, `ai/changes/${id}/verification.md must contain exactly one top-level Status field.`, errors);
  ensure(
    !parsedStatus.unique || !['pending', 'prepared'].includes(parsedStatus.status),
    `ai/changes/${id}/verification.md must not have pending/prepared status after substantive changes.`,
    errors
  );
  validateNonSuccessProvenanceClaims({
    text: verification,
    label: `ai/changes/${id}/verification.md`,
    errors
  });

  if (substantiveFiles.length === 0) {
    return;
  }

  ensure(
    /(passed|failed|verified|exit code|ok|success|error)/i.test(verification),
    `ai/changes/${id}/verification.md must include concrete verification outcomes, not only command names.`,
    errors
  );
  ensure(
    hasHeading(verification, '## Evidence') || hasHeading(verification, '## Runtime Evidence') || hasHeading(verification, '## Acceptance Results') || hasHeading(verification, '## Results'),
    `ai/changes/${id}/verification.md must include an evidence/results section for substantive changes.`,
    errors
  );

  if (changedFiles.some(isGovernanceFile)) {
    ensure(hasCommand(verification, /`?(npm test|node --test)[^`\n]*`?/i), `ai/changes/${id}/verification.md must record test evidence for governance script/tool changes.`, errors);
    ensure(hasCommand(verification, /`?npm run check`?/i), `ai/changes/${id}/verification.md must record the full governance gate for governance changes.`, errors);
  }
}

function validateHandover({ id, changedFiles, handover, label, errors }) {
  ensure(handover.trim().length > 0, `${label} must not be empty.`, errors);
  const templatePhrase = containsTemplateText(handover);
  ensure(!templatePhrase, `${label} still contains template handover text: ${templatePhrase}`, errors);
  validateControlledHandoverSections({ handover, label, errors });
  validateNonSuccessProvenanceClaims({ text: handover, label, errors });
  validateHandoverChangedFiles({ changedFiles, handover, label, errors });
  for (const heading of ['## Impact', '## Verification', '## Risks', '## Next Actions']) {
    const section = sectionText(handover, heading);
    ensure(section.length > 0, `${label} must include non-empty ${heading}.`, errors);
  }
  if (changedFiles.filter((file) => isSubstantiveFile(file, id)).length > 0) {
    ensure(sectionText(handover, '## Impact').length > 20, `${label} Impact must describe the changed surface.`, errors);
    ensure(sectionText(handover, '## Verification').length > 20, `${label} Verification must describe the verification result.`, errors);
    ensure(sectionText(handover, '## Risks').length > 10, `${label} Risks must record residual risk or explicitly say none.`, errors);
    ensure(sectionText(handover, '## Next Actions').length > 10, `${label} Next Actions must record the next owner/action or explicitly say none.`, errors);
  }
}

function taskReferencesChange(task, id) {
  return JSON.stringify(task || {}).includes(id);
}

function isGovernanceChange(impact) {
  const featureId = typeof impact?.feature === 'object' ? impact.feature.id : impact?.feature;
  return impact?.mode === 'governance' || impact?.mode === 'rule-change' || featureId === 'platform';
}

function isPlatformTask(task) {
  const text = `${task?.id || ''} ${task?.feature || ''} ${task?.title || ''}`.toLowerCase();
  return task?.feature === 'platform' || text.includes('governance') || text.includes('platform');
}

function isCustomerTask(task) {
  return task?.id === 'TASK-CUSTOMER' || task?.feature === 'customer';
}

function validateTaskSync({ id, impact, tasks, errors }) {
  const syncedTasks = (tasks.tasks || []).filter((task) => taskReferencesChange(task, id));
  if (!isGovernanceChange(impact)) {
    return;
  }
  ensure(
    syncedTasks.some(isPlatformTask),
    `memory/TASKS.json must sync governance change ${id} to a platform/governance task.`,
    errors
  );
  for (const task of syncedTasks.filter(isCustomerTask)) {
    errors.push(`memory/TASKS.json must not sync governance change ${id} to ${task.id || task.feature}.`);
  }
}

function validateMemorySync({ id, impact, readFile, readJsonFile, exists, errors }) {
  ensure(exists('memory/HANDOVER.md'), 'memory/HANDOVER.md is missing.', errors);
  ensure(exists('memory/CHANGELOG.md'), 'memory/CHANGELOG.md is missing.', errors);
  ensure(exists('memory/TASKS.json'), 'memory/TASKS.json is missing.', errors);
  const handover = readTextSafe('memory/HANDOVER.md', readFile);
  const changelog = readTextSafe('memory/CHANGELOG.md', readFile);
  const tasks = readJsonSafe('memory/TASKS.json', { tasks: [] }, readJsonFile);

  ensure(referencesCurrentChange(handover, id), `memory/HANDOVER.md must reference current change ${id}.`, errors);
  ensure(referencesCurrentChange(changelog, id), `memory/CHANGELOG.md must record current change ${id}.`, errors);
  ensure(JSON.stringify(tasks).includes(id), `memory/TASKS.json must sync current change ${id}.`, errors);
  validateTaskSync({ id, impact, tasks, errors });
}

function diffForFile(file, fileDiffs) {
  if (!fileDiffs) {
    return '';
  }
  if (fileDiffs instanceof Map) {
    return fileDiffs.get(file) || '';
  }
  return fileDiffs[file] || '';
}

function changedDiffLines(diffText) {
  return String(diffText || '')
    .split('\n')
    .filter((line) => /^[+-]/.test(line))
    .filter((line) => !line.startsWith('+++') && !line.startsWith('---'))
    .map((line) => line.slice(1).trim());
}

function isCommentOnlyDiff(diffText) {
  const changedLines = changedDiffLines(diffText)
    .filter((line) => line.length > 0);
  if (changedLines.length === 0) {
    return false;
  }
  return changedLines.every((line) => (
    line.startsWith('//')
    || line.startsWith('/*')
    || line.startsWith('*')
    || line.startsWith('*/')
    || line.startsWith('#')
    || line.startsWith('<!--')
    || line.startsWith('--')
  ));
}

function semanticallyTouches(gate, file, fileDiffs) {
  if (!gate.touched(file)) {
    return false;
  }
  const diffText = diffForFile(file, fileDiffs);
  return !isCommentOnlyDiff(diffText);
}

function validateSemanticCoverage({ id, changedFiles, verification, handover, fileDiffs, errors }) {
  const combinedEvidence = `${verification}\n${handover}`;
  for (const gate of SEMANTIC_GATES) {
    const touched = changedFiles.some((file) => semanticallyTouches(gate, file, fileDiffs));
    if (!touched) {
      continue;
    }
    const artifactUpdated = changedFiles.some((file) => gate.artifacts.includes(file) || gate.artifactMatch(file));
    const noChangeRecorded = gate.noChangePattern.test(combinedEvidence);
    ensure(
      artifactUpdated || noChangeRecorded,
      `${gate.name} semantic surface changed in ${id}; update registry/graph/contract/generated scan/ownership files or record that the scan found no contract changes.`,
      errors
    );
  }
}

export function validateChangeHandoffIntegrity({
  id = currentChangeId(),
  actualFiles = null,
  fileDiffs = null,
  readFile = readText,
  readJsonFile = readJson,
  exists = fileExists,
  validateBaseRevisionFn = validateBaseRevision
} = {}) {
  const errors = [];
  ensure(Boolean(id), 'No change id provided and ai/changes/CURRENT_CHANGE.json has no current change.', errors);
  if (!id) {
    return errors;
  }

  const dir = `ai/changes/${id}`;
  ensure(exists(`${dir}/verification.md`), `${dir}/verification.md is missing.`, errors);
  ensure(exists(`${dir}/handover.md`), `${dir}/handover.md is missing.`, errors);
  const changed = readJsonSafe(`${dir}/changed-files.json`, { files: [] }, readJsonFile);
  const impact = readJsonSafe(`${dir}/impact.json`, { mode: '', feature: {} }, readJsonFile);
  const changedFiles = validateRawChangedFiles({
    files: changed.files,
    label: `${dir}/changed-files.json`,
    errors
  });
  ensure(changedFiles.length > 0, `${dir}/changed-files.json files must not be empty.`, errors);
  if (errors.length > 0) {
    return errors;
  }

  const verification = readTextSafe(`${dir}/verification.md`, readFile);
  const changeHandover = readTextSafe(`${dir}/handover.md`, readFile);
  errors.push(...validateBaseRevisionFn(impact.baseRevision));
  const resolvedActualFiles = actualFiles === null
    ? collectChangedFiles({ baseRevision: impact.baseRevision })
    : unique(actualFiles);
  const resolvedFileDiffs = fileDiffs === null
    ? collectFileDiffs({ files: resolvedActualFiles, baseRevision: impact.baseRevision })
    : fileDiffs;
  validateChangedFilesCoverage({ id, changedFiles, actualFiles: resolvedActualFiles, errors });
  validateVerification({ id, changedFiles, verification, errors });
  validateHandover({ id, changedFiles, handover: changeHandover, label: `${dir}/handover.md`, errors });
  validateMemorySync({ id, impact, readFile, readJsonFile, exists, errors });
  validateHandover({ id, changedFiles, handover: readTextSafe('memory/HANDOVER.md', readFile), label: 'memory/HANDOVER.md', errors });
  validateSemanticCoverage({ id, changedFiles, verification, handover: changeHandover, fileDiffs: resolvedFileDiffs, errors });
  return errors;
}

if (isCli(import.meta.url)) {
  const id = process.argv.slice(2).find((arg) => !arg.startsWith('--')) || currentChangeId();
  finish('check:change-handoff', validateChangeHandoffIntegrity({ id }));
}
