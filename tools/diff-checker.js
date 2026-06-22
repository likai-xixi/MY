import { execFileSync } from 'node:child_process';
import { fileExists, finish, isCli, listFiles, readJson, readText } from './common.js';

const TEXT_EXTENSIONS = new Set([
  '.md',
  '.js',
  '.json',
  '.yml',
  '.yaml',
  '.ts',
  '.tsx',
  '.vue',
  '.java',
  '.kt',
  '.xml',
  '.sql',
  '.css',
  '.scss',
  '.sh',
  '.gitignore',
  '.gitattributes',
  '.editorconfig'
]);

function extensionOf(file) {
  const index = file.lastIndexOf('.');
  return index === -1 ? file : file.slice(index);
}

const GENERATED_DIRS = new Set([
  '.git',
  '.vite',
  'build',
  'coverage',
  'dist',
  'node_modules',
  'target',
  'tmp'
]);

function isGeneratedPath(file) {
  return file.replace(/\\/g, '/').split('/').some((part) => GENERATED_DIRS.has(part));
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function runGit(args) {
  try {
    return execFileSync('git', ['-c', 'core.quotepath=false', ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

function isGitRepository() {
  return runGit(['rev-parse', '--is-inside-work-tree']) === 'true';
}


function readProfile() {
  try {
    return readJson('ai/project-profile.json');
  } catch {
    return { templateSetup: true };
  }
}

function checkGitRequired() {
  const profile = readProfile();
  if (profile.templateSetup === true) {
    return [];
  }
  if (isGitRepository()) {
    return [];
  }
  return ['Real project development requires a Git work tree. Initialize Git before relying on the diff range gate.'];
}

function gitChangedFiles() {
  if (!isGitRepository()) {
    return [];
  }
  const unstaged = runGit(['diff', '--name-only', '--diff-filter=ACMRTUXB', '--']);
  const staged = runGit(['diff', '--cached', '--name-only', '--diff-filter=ACMRTUXB', '--']);
  const untracked = runGit(['ls-files', '--others', '--exclude-standard']);
  return unique([
    ...unstaged.split('\n'),
    ...staged.split('\n'),
    ...untracked.split('\n')
  ].map((file) => file.trim().replace(/\\/g, '/')));
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
    return Array.isArray(changed.files) ? changed.files.map((file) => file.replace(/\\/g, '/')) : [];
  } catch {
    return [];
  }
}

export function collectChangedFiles() {
  const gitFiles = gitChangedFiles();
  return gitFiles.length > 0 ? gitFiles : changedFilesFromRecord();
}

function normalizeRoot(root) {
  return String(root || '').replace(/^\.\//, '').replace(/\\/g, '/').replace(/\/+$|^\/+/, '');
}

export function isAllowedByRoot(file, root) {
  const normalizedFile = normalizeRoot(file);
  const normalizedRoot = normalizeRoot(root);
  if (!normalizedRoot || normalizedRoot === '.') {
    return true;
  }
  return normalizedFile === normalizedRoot || normalizedFile.startsWith(`${normalizedRoot}/`);
}

export function checkAllowedEditRoots({ changedFiles = collectChangedFiles(), impact = currentImpact() } = {}) {
  const errors = [];
  if (changedFiles.length === 0) {
    return errors;
  }
  if (!impact) {
    return ['Current change impact.json is missing. Run npm run impact -- <feature> -- --write or start a change record.'];
  }
  const roots = Array.isArray(impact.allowedEditRoots) ? impact.allowedEditRoots : [];
  if (roots.length === 0) {
    return ['Current impact.json must include allowedEditRoots before changed files can pass the range gate.'];
  }
  for (const file of changedFiles) {
    if (!roots.some((root) => isAllowedByRoot(file, root))) {
      errors.push(`${file} is outside impact.allowedEditRoots.`);
    }
  }
  return errors;
}

export function checkTextHygiene() {
  const errors = [];
  const files = [
    ...listFiles('.', (file) => {
      if (isGeneratedPath(file)) {
        return false;
      }
      return TEXT_EXTENSIONS.has(extensionOf(file));
    })
  ];

  for (const file of files) {
    const text = readText(file);
    if (text.length > 0 && !text.endsWith('\n')) {
      errors.push(`${file} must end with a newline.`);
    }
    const lines = text.split('\n');
    lines.forEach((line, index) => {
      if (/[ \t]+$/.test(line)) {
        errors.push(`${file}:${index + 1} has trailing whitespace.`);
      }
    });
  }

  return errors;
}

export function checkDiff() {
  return [
    ...checkTextHygiene(),
    ...checkGitRequired(),
    ...checkAllowedEditRoots()
  ];
}

if (isCli(import.meta.url)) {
  finish('check:diff', checkDiff());
}
