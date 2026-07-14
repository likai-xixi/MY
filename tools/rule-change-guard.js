import { finish, isCli, readJson } from './common.js';
import { collectChangedFiles as collectActualChangedFiles } from './diff-checker.js';

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

const STRICT_RULE_CHANGE_FILES = new Set([
  'ai/registry/test-ownership-exceptions.json'
]);

const RULE_MODES = new Set([
  'baseline',
  'governance',
  'profile',
  'rules',
  'rule-change',
  'template'
]);

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

function protectedPath(file) {
  return STRICT_RULE_CHANGE_FILES.has(file)
    || PROTECTED_PREFIXES.some((prefix) => file === prefix || file.startsWith(prefix));
}

export function validateRuleChangeGuard({ files = collectActualChangedFiles(), impact = currentImpact() } = {}) {
  const errors = [];
  const normalizedFiles = files.map((file) => String(file || '').replace(/\\/g, '/'));
  const protectedFiles = normalizedFiles.filter(protectedPath);
  if (protectedFiles.length === 0) {
    return errors;
  }
  const mode = impact?.mode || '';
  const strictFiles = protectedFiles.filter((file) => STRICT_RULE_CHANGE_FILES.has(file));
  if (mode !== 'rule-change') {
    for (const file of strictFiles) {
      errors.push(`${file} is a protected governance registry and requires an active rule-change record before editing.`);
    }
  }
  if (!RULE_MODES.has(mode)) {
    for (const file of protectedFiles.filter((file) => !STRICT_RULE_CHANGE_FILES.has(file))) {
      errors.push(`${file} is a protected governance file. Use a profile or rule-change record before editing scanner, rule, script, workflow, package, skill, or project profile files.`);
    }
  }
  return errors;
}

if (isCli(import.meta.url)) {
  finish('check:rule-lock', validateRuleChangeGuard());
}
