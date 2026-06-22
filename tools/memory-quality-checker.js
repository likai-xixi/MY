import {
  ensure,
  fileExists,
  finish,
  hasHeading,
  isCli,
  listFiles,
  readJson,
  readText
} from './common.js';
import { REQUIRED_HANDOVER_HEADINGS } from '../scripts/generate-handover.js';

const TASK_STATUSES = new Set(['todo', 'in_progress', 'blocked', 'verified', 'done']);
const REQUIRED_SESSION_HEADINGS = [
  '## Task',
  '## Status',
  '## Goal',
  '## Changed Files',
  '## Commands',
  '## Verification',
  '## Risks',
  '## Next Entry Point'
];

const PLACEHOLDER_PHRASES = [
  'Describe what changed.',
  'Update this list.',
  'Describe passing and failing verification.',
  'List residual risks.',
  'List the next concrete actions.'
];

function activeFeatureIds({ read = readJson, exists = fileExists } = {}) {
  if (!exists('ai/registry/features.json')) {
    return new Set();
  }
  try {
    const registry = read('ai/registry/features.json');
    return new Set((registry.features || [])
      .filter((feature) => feature.status !== 'removed')
      .map((feature) => feature.id));
  } catch {
    return new Set();
  }
}

function sectionText(text, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = text.match(new RegExp(`^${escaped}\\s*$([\\s\\S]*?)(?=^##\\s+|(?![\\s\\S]))`, 'm'));
  return match ? match[1].trim() : '';
}

function hasBullet(section) {
  return /^-\s+\S/m.test(section);
}

function hasCommand(section) {
  return /`[^`]+`/.test(section);
}

export function validateTasks({ read = readJson, exists = fileExists } = {}) {
  const errors = [];
  ensure(exists('memory/TASKS.json'), 'memory/TASKS.json is missing.', errors);
  if (errors.length > 0) {
    return errors;
  }

  let data;
  try {
    data = read('memory/TASKS.json');
  } catch (error) {
    return [`memory/TASKS.json is not valid JSON: ${error.message}`];
  }

  ensure(data.schemaVersion === 1, 'memory/TASKS.json schemaVersion must be 1.', errors);
  ensure(Array.isArray(data.tasks), 'memory/TASKS.json tasks must be an array.', errors);
  if (!Array.isArray(data.tasks)) {
    return errors;
  }

  const featureIds = activeFeatureIds({ read, exists });
  const seen = new Set();
  for (const task of data.tasks) {
    ensure(Boolean(task.id), 'task is missing id.', errors);
    ensure(!seen.has(task.id), `task id is duplicated: ${task.id}.`, errors);
    seen.add(task.id);
    ensure(Boolean(task.feature), `task ${task.id} is missing feature.`, errors);
    ensure(Boolean(task.title), `task ${task.id} is missing title.`, errors);
    ensure(TASK_STATUSES.has(task.status), `task ${task.id} has invalid status ${task.status}.`, errors);
    ensure(Boolean(task.owner), `task ${task.id} is missing owner.`, errors);
    ensure(Boolean(task.priority), `task ${task.id} is missing priority.`, errors);
    ensure(Boolean(task.statusReason), `task ${task.id} is missing statusReason.`, errors);
    ensure(Boolean(task.nextStep), `task ${task.id} is missing nextStep.`, errors);
    ensure(Array.isArray(task.blockedBy), `task ${task.id} blockedBy must be an array.`, errors);
    ensure(Array.isArray(task.verification) && task.verification.length > 0, `task ${task.id} must list verification.`, errors);
    ensure(Boolean(task.latestSession), `task ${task.id} is missing latestSession.`, errors);
    if (task.latestSession) {
      ensure(fileExists(task.latestSession), `task ${task.id} latestSession does not exist: ${task.latestSession}.`, errors);
    }
    ensure(typeof task.handoverRequired === 'boolean', `task ${task.id} handoverRequired must be boolean.`, errors);
    ensure(Boolean(task.updatedAt), `task ${task.id} is missing updatedAt.`, errors);
    if (task.feature) {
      const featureExists = featureIds.size > 0
        ? featureIds.has(task.feature) && fileExists(`features/${task.feature}.md`)
        : fileExists(`features/${task.feature}.md`);
      ensure(
        featureExists,
        `task ${task.id} references missing feature ${task.feature}.`,
        errors
      );
    }
  }

  if (featureIds.size > 0) {
    ensure(data.tasks.some((task) => task.status !== 'done'), 'memory/TASKS.json must keep at least one active or queued task while active features exist.', errors);
  }
  return errors;
}

export function validateHandoverQuality({ read = readText, exists = fileExists } = {}) {
  const errors = [];
  ensure(exists('memory/HANDOVER.md'), 'memory/HANDOVER.md is missing.', errors);
  if (errors.length > 0) {
    return errors;
  }

  const text = read('memory/HANDOVER.md');
  for (const heading of REQUIRED_HANDOVER_HEADINGS) {
    const section = sectionText(text, heading);
    ensure(section.length > 0, `memory/HANDOVER.md ${heading} must not be empty.`, errors);
  }

  for (const phrase of PLACEHOLDER_PHRASES) {
    ensure(!text.includes(phrase), `memory/HANDOVER.md still contains placeholder text: ${phrase}`, errors);
  }

  ensure(hasBullet(sectionText(text, '## Changed Files')), 'memory/HANDOVER.md Changed Files must list bullets.', errors);
  ensure(hasCommand(sectionText(text, '## Commands')), 'memory/HANDOVER.md Commands must include command literals.', errors);
  ensure(sectionText(text, '## Verification').toLowerCase().includes('check'), 'memory/HANDOVER.md Verification must mention checks.', errors);
  return errors;
}

export function validateSessions({ files = listFiles, read = readText } = {}) {
  const errors = [];
  const sessionFiles = files('memory/sessions', (file) => file.endsWith('.md') && !file.endsWith('/README.md'));
  ensure(sessionFiles.length > 0, 'memory/sessions must include at least one session note.', errors);
  for (const file of sessionFiles) {
    const text = read(file);
    for (const heading of REQUIRED_SESSION_HEADINGS) {
      ensure(hasHeading(text, heading), `${file} must include ${heading}.`, errors);
      ensure(sectionText(text, heading).length > 0, `${file} ${heading} must not be empty.`, errors);
    }
    ensure(/TASK-\d+/i.test(sectionText(text, '## Task')), `${file} Task must include a task id.`, errors);
    ensure(/`?(todo|in_progress|blocked|verified|done)`?/i.test(sectionText(text, '## Status')), `${file} Status must use a task status.`, errors);
  }
  return errors;
}

export function validateMemoryQuality() {
  return [
    ...validateTasks(),
    ...validateHandoverQuality(),
    ...validateSessions()
  ];
}

if (isCli(import.meta.url)) {
  finish('check:memory-quality', validateMemoryQuality());
}
