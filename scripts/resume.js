import fs from 'node:fs';
import path from 'node:path';
import { finish, isCli, listFiles, projectPath, readJson, readText } from '../tools/common.js';

function safeReadJson(relativePath, fallback, errors) {
  try {
    return readJson(relativePath);
  } catch (error) {
    errors.push(`${relativePath} is missing or invalid JSON: ${error.message}`);
    return fallback;
  }
}

function safeReadText(relativePath) {
  try {
    return readText(relativePath);
  } catch {
    return '';
  }
}

export const CLOSED_TASK_STATUSES = new Set(['done', 'verified', 'closed', 'completed']);

export function isOpenTask(task = {}) {
  return !CLOSED_TASK_STATUSES.has(String(task.status || '').toLowerCase());
}

export function latestSession(tasks = { tasks: [] }) {
  const declared = (tasks.tasks || []).find((task) => isOpenTask(task) && task.latestSession)?.latestSession;
  if (declared) {
    return declared;
  }
  const sessions = listFiles('memory/sessions', (file) => file.endsWith('.md') && !file.endsWith('/README.md'));
  const withTimes = sessions.map((file) => {
    try {
      return { file, mtime: fs.statSync(projectPath(file)).mtimeMs };
    } catch {
      return { file, mtime: 0 };
    }
  });
  withTimes.sort((a, b) => b.mtime - a.mtime || b.file.localeCompare(a.file));
  return withTimes[0]?.file || '';
}

function currentChange() {
  const current = safeReadJson('ai/changes/CURRENT_CHANGE.json', { current: '' }, []);
  return current.current || '';
}

export function summarizeTasks(tasks) {
  return (tasks.tasks || [])
    .filter(isOpenTask)
    .map((task) => `- ${task.id} [${task.status}] ${task.title} -> ${task.nextStep}`)
    .join('\n') || '- none';
}

export function buildResumeReport() {
  const errors = [];
  const tasks = safeReadJson('memory/TASKS.json', { tasks: [] }, errors);
  const features = safeReadJson('ai/registry/features.json', { features: [] }, errors);
  const change = currentChange();
  const session = latestSession(tasks);
  const projectState = safeReadText('memory/PROJECT_STATE.md');
  const activeFeature = projectState.match(/## Active Feature\s+`?([^`\n]+)`?/m)?.[1]?.trim() || 'not declared';

  const report = [
    '# Codex Resume Report',
    '',
    `Active feature: ${activeFeature}`,
    `Latest session: ${session || 'none'}`,
    `Current change: ${change || 'none'}`,
    '',
    '## Registered Features',
    ...(features.features || []).map((feature) => `- ${feature.id} [${feature.status}] ${feature.name}`),
    '',
    '## Open Tasks',
    summarizeTasks(tasks),
    '',
    '## Required Context To Read',
    '- `AGENTS.md`',
    '- `docs/chat-driven-codex-workflow.md`',
    '- `ai/registry/features.json`',
    '- `ai/registry/components.json`',
    '- `memory/PROJECT_STATE.md`',
    '- `memory/TASKS.json`',
    '- `memory/HANDOVER.md`',
    '- latest file under `memory/sessions/`',
    '- `graph/module-graph.json`',
    '- `graph/api-graph.json`',
    '- `graph/ui-graph.json`',
    '',
    '## Next Rule',
    'Classify the user request as add-feature, update-feature, remove-feature-dry-run, or remove-feature-apply before editing code.',
    ''
  ].join('\n');

  return { report, errors };
}

export function runResume() {
  const { report, errors } = buildResumeReport();
  console.log(report);
  if (errors.length > 0) {
    return errors;
  }
  const required = ['AGENTS.md', 'ai/registry/features.json', 'memory/HANDOVER.md', 'graph/module-graph.json'];
  return required.filter((file) => !fs.existsSync(projectPath(file))).map((file) => `${file} is missing.`);
}

if (isCli(import.meta.url)) {
  finish('resume', runResume());
}
