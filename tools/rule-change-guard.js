import { execFileSync } from 'node:child_process';
import { finish, isCli, readJson } from './common.js';

const PROTECTED_PREFIXES = [
  '.codex/skills/',
  '.github/workflows/',
  'AGENTS.md',
  'package.json',
  'scripts/',
  'tools/',
  'ai/rules/',
  'ai/adapters/',
  'ai/project-profile.json'
];

const RULE_MODES = new Set([
  'baseline',
  'governance',
  'profile',
  'rules',
  'rule-change',
  'template'
]);

function runGit(args) {
  try {
    return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

function isGitRepository() {
  return runGit(['rev-parse', '--is-inside-work-tree']) === 'true';
}

function gitChangedFiles() {
  if (!isGitRepository()) {
    return [];
  }
  const unstaged = runGit(['diff', '--name-only', '--diff-filter=ACMRTUXB', '--']);
  const staged = runGit(['diff', '--cached', '--name-only', '--diff-filter=ACMRTUXB', '--']);
  const untracked = runGit(['ls-files', '--others', '--exclude-standard']);
  return [...new Set([...unstaged.split('\n'), ...staged.split('\n'), ...untracked.split('\n')]
    .map((file) => file.trim().replace(/\\/g, '/'))
    .filter(Boolean))];
}

function currentChangeId() {
  try {
    return readJson('ai/changes/CURRENT_CHANGE.json').current || '';
  } catch {
    return '';
  }
}

function currentImpact() {
  const id = currentChangeId();
  if (!id) {
    return null;
  }
  try {
    return readJson(`ai/changes/${id}/impact.json`);
  } catch {
    return null;
  }
}

function changedFilesFromRecord() {
  const id = currentChangeId();
  if (!id) {
    return [];
  }
  try {
    const changed = readJson(`ai/changes/${id}/changed-files.json`);
    return Array.isArray(changed.files) ? changed.files : [];
  } catch {
    return [];
  }
}

function collectChangedFiles() {
  const gitFiles = gitChangedFiles();
  return gitFiles.length > 0 ? gitFiles : changedFilesFromRecord();
}

function protectedPath(file) {
  return PROTECTED_PREFIXES.some((prefix) => file === prefix || file.startsWith(prefix));
}

export function validateRuleChangeGuard({ files = collectChangedFiles(), impact = currentImpact() } = {}) {
  const errors = [];
  const protectedFiles = files.filter(protectedPath);
  if (protectedFiles.length === 0) {
    return errors;
  }
  const mode = impact?.mode || '';
  if (!RULE_MODES.has(mode)) {
    for (const file of protectedFiles) {
      errors.push(`${file} is a protected governance file. Use a profile or rule-change record before editing scanner, rule, script, workflow, package, skill, or project profile files.`);
    }
  }
  return errors;
}

if (isCli(import.meta.url)) {
  finish('check:rule-lock', validateRuleChangeGuard());
}
