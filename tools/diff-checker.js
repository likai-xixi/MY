import { execFileSync } from 'node:child_process';
import { lstatSync } from 'node:fs';
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

const FULL_COMMIT_OID_PATTERN = /^[0-9a-f]{40}$/i;
const ZERO_OID = '0'.repeat(40);
const REGULAR_BLOB_MODES = new Set(['100644', '100755']);
const PROHIBITED_GIT_MODES = new Set(['120000', '160000']);
const SUPPORTED_GIT_MODES = new Set(['000000', ...REGULAR_BLOB_MODES, ...PROHIBITED_GIT_MODES]);
const SUPPORTED_RAW_STATUSES = new Set(['A', 'D', 'M', 'T']);

function isGeneratedPath(file) {
  return file.replace(/\\/g, '/').split('/').some((part) => GENERATED_DIRS.has(part));
}

function normalizeFile(file) {
  return String(file || '').trim().replace(/\\/g, '/').replace(/^\.\/+/, '');
}

function unique(items) {
  return [...new Set(items.map(normalizeFile).filter(Boolean))].sort((left, right) => left.localeCompare(right));
}

function runGitResult(args) {
  try {
    return {
      status: 0,
      stdout: execFileSync('git', ['-c', 'core.quotepath=false', ...args], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe']
      }).trim()
    };
  } catch (error) {
    return {
      status: error.status ?? 1,
      stdout: String(error.stdout || '').trim(),
      stderr: String(error.stderr || '').trim()
    };
  }
}

function runGit(args) {
  const result = runGitResult(args);
  return result.status === 0 ? result.stdout : '';
}

function runGitRaw(args) {
  try {
    return execFileSync('git', ['-c', 'core.quotepath=false', ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
  } catch (error) {
    const stderr = String(error.stderr || '').trim();
    throw new Error(`Git command failed: git ${args.join(' ')}${stderr ? `: ${stderr}` : ''}`);
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

function splitNulPaths(text, label) {
  const raw = String(text || '');
  if (!raw) return [];
  if (!raw.includes('\0')) {
    throw new Error(`${label} did not return NUL-delimited path evidence.`);
  }
  const fields = raw.split('\0');
  if (fields.at(-1) !== '') {
    throw new Error(`${label} returned truncated NUL-delimited path evidence.`);
  }
  fields.pop();
  return fields.filter(Boolean);
}

function parseRawDiff(text, source) {
  const fields = splitNulPaths(text, 'git diff --raw -z');
  if (fields.length % 2 !== 0) {
    throw new Error('git diff --raw -z returned an incomplete header/path pair.');
  }
  const entries = [];
  for (let index = 0; index < fields.length; index += 2) {
    const header = fields[index];
    const path = fields[index + 1];
    const match = header.match(/^:([0-7]{6}) ([0-7]{6}) ([0-9a-f]{40}) ([0-9a-f]{40}) ([ACDMRTUXB])(?:\d+)?$/i);
    if (!match) {
      throw new Error(`git diff --raw -z returned an invalid change header: ${JSON.stringify(header)}.`);
    }
    if (!isCanonicalRepositoryRoot(path)) {
      throw new Error(`Git changed path ${JSON.stringify(path)} is not a canonical repository-relative path.`);
    }
    entries.push({
      path,
      oldMode: match[1],
      newMode: match[2],
      oldOid: match[3].toLowerCase(),
      newOid: match[4].toLowerCase(),
      status: match[5].toUpperCase(),
      source
    });
  }
  return entries;
}

function worktreeGitMode(file) {
  const stats = lstatSync(file);
  if (stats.isSymbolicLink()) return '120000';
  if (stats.isFile()) return (stats.mode & 0o111) === 0 ? '100644' : '100755';
  if (stats.isDirectory()) return '040000';
  return '000000';
}

function mergeChangedEntries(entries) {
  const byPath = new Map();
  for (const entry of entries) {
    const existing = byPath.get(entry.path) || new Map();
    if (existing.has(entry.source)) {
      throw new Error(`Git change evidence contains duplicate ${entry.source} path ${entry.path}.`);
    }
    existing.set(entry.source, entry);
    byPath.set(entry.path, existing);
  }
  return [...byPath.entries()].map(([path, evidence]) => {
    const candidate = evidence.get('candidate') || null;
    const layers = ['candidate', 'worktree', 'untracked']
      .map((source) => evidence.get(source))
      .filter(Boolean);
    const primary = candidate || layers[0];
    return {
      ...primary,
      path,
      candidate,
      layers
    };
  }).sort((left, right) => left.path.localeCompare(right.path));
}

export function gitChangedEntries({
  baseRevision = '',
  runGitCommand = runGitRaw,
  gitRepository = isGitRepository(),
  readWorktreeMode = worktreeGitMode,
  hashWorktreeFile
} = {}) {
  if (!gitRepository) {
    return [];
  }
  const anchor = baseRevision || 'HEAD';
  const candidate = parseRawDiff(runGitCommand([
    'diff',
    '--cached',
    '--no-renames',
    '--raw',
    '-z',
    '--abbrev=40',
    '--diff-filter=ACDMRTUXB',
    anchor,
    '--'
  ]), 'candidate');
  const worktree = parseRawDiff(runGitCommand([
    'diff',
    '--no-renames',
    '--raw',
    '-z',
    '--abbrev=40',
    '--diff-filter=ACDMRTUXB',
    '--'
  ]), 'worktree');
  const untrackedPaths = splitNulPaths(
    runGitCommand(['ls-files', '--others', '--exclude-standard', '-z']),
    'git ls-files --others -z'
  );
  const hashFile = hashWorktreeFile || ((file) => String(runGitCommand([
    'hash-object',
    '--path', file,
    '--', file
  ])).trim().toLowerCase());
  const entries = [
    ...candidate,
    ...worktree,
    ...untrackedPaths.map((path) => {
      if (!isCanonicalRepositoryRoot(path)) {
        throw new Error(`Git untracked path ${JSON.stringify(path)} is not a canonical repository-relative path.`);
      }
      return {
        path,
        oldMode: '000000',
        newMode: readWorktreeMode(path),
        oldOid: ZERO_OID,
        newOid: ZERO_OID,
        status: 'A',
        source: 'untracked'
      };
    })
  ].map((entry) => {
    let finalOid = entry.newOid;
    if (REGULAR_BLOB_MODES.has(entry.newMode) && finalOid === ZERO_OID) {
      if (entry.source === 'candidate') {
        throw new Error(`Git index did not produce a full blob OID for changed file ${entry.path}.`);
      }
      finalOid = hashFile(entry.path);
      if (!FULL_COMMIT_OID_PATTERN.test(finalOid)) {
        throw new Error(`Git could not produce a full blob OID for changed file ${entry.path}.`);
      }
    }
    return {
      ...entry,
      newOid: finalOid,
      contentChanged: REGULAR_BLOB_MODES.has(entry.newMode)
        && entry.oldOid.toLowerCase() !== finalOid.toLowerCase()
    };
  });
  return mergeChangedEntries(entries);
}

export function gitChangedFiles(options = {}) {
  return gitChangedEntries(options).map((entry) => entry.path);
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

export function currentHeadRevision() {
  return runGit(['rev-parse', '--verify', 'HEAD^{commit}']);
}

export function validateBaseRevision(baseRevision, { runGitResultFn = runGitResult } = {}) {
  const rawRevision = String(baseRevision || '');
  const revision = rawRevision.trim();
  if (!revision) {
    return ['impact.baseRevision is required to bind evidence to an exact Git range.'];
  }
  if (rawRevision !== revision || !FULL_COMMIT_OID_PATTERN.test(revision)) {
    return ['impact.baseRevision must be a full fixed 40-character hexadecimal commit OID.'];
  }
  const resolved = runGitResultFn(['rev-parse', '--verify', `${revision}^{commit}`]);
  if (resolved.status !== 0 || String(resolved.stdout || '').trim().toLowerCase() !== revision.toLowerCase()) {
    return [`impact.baseRevision ${revision} is not a valid Git commit OID.`];
  }
  const ancestor = runGitResultFn(['merge-base', '--is-ancestor', revision, 'HEAD']);
  if (ancestor.status !== 0) {
    return [`impact.baseRevision ${revision} is not an ancestor of HEAD.`];
  }
  return [];
}

export function validateRevisionAncestry(ancestorRevision, descendantRevision, { runGitResultFn = runGitResult } = {}) {
  const rawAncestor = String(ancestorRevision || '');
  const rawDescendant = String(descendantRevision || '');
  const ancestor = rawAncestor.trim();
  const descendant = rawDescendant.trim();
  if (!ancestor || !descendant) {
    return ['review.baseRevision and impact.baseRevision are both required for revision binding.'];
  }
  if (rawAncestor !== ancestor || !FULL_COMMIT_OID_PATTERN.test(ancestor)) {
    return ['review.baseRevision must be a full fixed 40-character hexadecimal commit OID.'];
  }
  if (rawDescendant !== descendant || !FULL_COMMIT_OID_PATTERN.test(descendant)) {
    return ['impact.baseRevision must be a full fixed 40-character hexadecimal commit OID.'];
  }
  const result = runGitResultFn(['merge-base', '--is-ancestor', ancestor, descendant]);
  return result.status === 0
    ? []
    : [`review.baseRevision ${ancestor} is not an ancestor of impact.baseRevision ${descendant}.`];
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

export function collectChangedFiles({
  baseRevision = currentImpact()?.baseRevision || '',
  gitRepository = isGitRepository(),
  runGitCommand = runGitRaw,
  readWorktreeMode = worktreeGitMode,
  hashWorktreeFile
} = {}) {
  if (gitRepository) {
    return gitChangedFiles({
      baseRevision,
      runGitCommand,
      gitRepository: true,
      readWorktreeMode,
      hashWorktreeFile
    });
  }
  return unique(changedFilesFromRecord());
}

export function collectChangedEntries({
  baseRevision = currentImpact()?.baseRevision || '',
  gitRepository = isGitRepository(),
  runGitCommand = runGitRaw,
  readWorktreeMode = worktreeGitMode,
  hashWorktreeFile
} = {}) {
  if (!gitRepository) return [];
  return gitChangedEntries({
    baseRevision,
    runGitCommand,
    gitRepository: true,
    readWorktreeMode,
    hashWorktreeFile
  });
}

export function collectFileDiffs({
  files = collectChangedFiles(),
  baseRevision = currentImpact()?.baseRevision || '',
  gitRepository = isGitRepository(),
  runGitCommand = runGit
} = {}) {
  if (!gitRepository) {
    return new Map();
  }
  return new Map(unique(files).map((file) => {
    const diff = [
      baseRevision
        ? runGitCommand(['diff', '--cached', baseRevision, '--', file])
        : runGitCommand(['diff', '--cached', '--', file]),
      runGitCommand(['diff', '--', file])
    ].filter(Boolean).join('\n');
    return [file, diff];
  }));
}

function normalizeRoot(root) {
  return String(root || '').replace(/^\.\//, '').replace(/\\/g, '/').replace(/\/+$|^\/+/, '');
}

export function isCanonicalRepositoryRoot(root) {
  if (typeof root !== 'string' || !root || root !== root.trim()) {
    return false;
  }
  if (
    root === '.'
    || root.startsWith('./')
    || root.startsWith('/')
    || /^[A-Za-z]:/.test(root)
    || root.includes('\\')
    || root.endsWith('/')
    || root.includes('//')
  ) {
    return false;
  }
  return root.split('/').every((segment) => segment && segment !== '.' && segment !== '..');
}

function formatRoot(root) {
  return JSON.stringify(root) ?? String(root);
}

function validateRootEntries(roots, field) {
  return (Array.isArray(roots) ? roots : [])
    .filter((root) => !isCanonicalRepositoryRoot(root))
    .map((root) => 'impact.' + field + ' entry ' + formatRoot(root) + ' must be a canonical repository-relative path.');
}

export function checkEditRootValidity({ impact = currentImpact() } = {}) {
  if (!impact) {
    return [];
  }
  return unique([
    ...validateRootEntries(impact.allowedEditRoots, 'allowedEditRoots'),
    ...validateRootEntries(impact.forbiddenEditRoots, 'forbiddenEditRoots')
  ]);
}

export function isAllowedByRoot(file, root) {
  if (!isCanonicalRepositoryRoot(file) || !isCanonicalRepositoryRoot(root)) {
    return false;
  }
  const normalizedFile = normalizeRoot(file);
  const normalizedRoot = normalizeRoot(root);
  return normalizedFile === normalizedRoot || normalizedFile.startsWith(`${normalizedRoot}/`);
}

function rootsOverlap(left, right) {
  const normalizedLeft = normalizeRoot(left);
  const normalizedRight = normalizeRoot(right);
  if (!normalizedLeft || !normalizedRight) {
    return false;
  }
  return isAllowedByRoot(normalizedLeft, normalizedRight) || isAllowedByRoot(normalizedRight, normalizedLeft);
}

export function checkForbiddenEditRoots({ changedFiles = collectChangedFiles(), impact = currentImpact() } = {}) {
  if (!impact) {
    return [];
  }
  const rootErrors = checkEditRootValidity({ impact });
  if (rootErrors.length > 0 || changedFiles.length === 0) {
    return rootErrors;
  }
  const forbiddenRoots = Array.isArray(impact.forbiddenEditRoots) ? impact.forbiddenEditRoots : [];
  const errors = [];
  for (const file of changedFiles) {
    const root = forbiddenRoots.find((candidate) => isAllowedByRoot(file, candidate));
    if (root) {
      errors.push(`${file} is inside impact.forbiddenEditRoots entry ${normalizeRoot(root)}.`);
    }
  }
  return errors;
}

export function checkEditRootIntersections({ impact = currentImpact() } = {}) {
  if (!impact) {
    return [];
  }
  const rootErrors = checkEditRootValidity({ impact });
  if (rootErrors.length > 0) {
    return rootErrors;
  }
  const allowedRoots = Array.isArray(impact.allowedEditRoots) ? impact.allowedEditRoots : [];
  const forbiddenRoots = Array.isArray(impact.forbiddenEditRoots) ? impact.forbiddenEditRoots : [];
  const errors = [];
  for (const allowedRoot of allowedRoots) {
    for (const forbiddenRoot of forbiddenRoots) {
      if (rootsOverlap(allowedRoot, forbiddenRoot)) {
        errors.push(`impact.allowedEditRoots entry ${normalizeRoot(allowedRoot)} overlaps impact.forbiddenEditRoots entry ${normalizeRoot(forbiddenRoot)}.`);
      }
    }
  }
  return unique(errors);
}

export function checkAllowedEditRoots({ changedFiles = collectChangedFiles(), impact = currentImpact() } = {}) {
  if (!impact) {
    return changedFiles.length === 0
      ? []
      : ['Current change impact.json is missing. Run npm run impact -- <feature> -- --write or start a change record.'];
  }
  const rootErrors = checkEditRootValidity({ impact });
  if (rootErrors.length > 0 || changedFiles.length === 0) {
    return rootErrors;
  }
  const errors = [];
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

function checkChangedEntrySafety(changedEntries) {
  const errors = [];
  for (const entry of Array.isArray(changedEntries) ? changedEntries : []) {
    if (!entry || typeof entry !== 'object' || !isCanonicalRepositoryRoot(entry.path)) {
      errors.push('Git change evidence must contain canonical repository paths and raw modes.');
      continue;
    }
    const layers = Array.isArray(entry.layers) && entry.layers.length > 0 ? entry.layers : [entry];
    for (const layer of layers) {
      if (!layer || layer.path !== entry.path) {
        errors.push(`${entry.path} has mismatched layered Git change evidence.`);
        continue;
      }
      if (!SUPPORTED_GIT_MODES.has(layer.oldMode)) {
        errors.push(`${entry.path} has unsupported previous Git mode ${layer.oldMode || '<missing>'}.`);
        continue;
      }
      if (!SUPPORTED_GIT_MODES.has(layer.newMode)) {
        errors.push(`${entry.path} has unsupported Git mode ${layer.newMode || '<missing>'}.`);
        continue;
      }
      if (
        !FULL_COMMIT_OID_PATTERN.test(String(layer.oldOid || ''))
        || !FULL_COMMIT_OID_PATTERN.test(String(layer.newOid || ''))
        || !/^[ACDMRTUXB]$/.test(String(layer.status || ''))
      ) {
        errors.push(`${entry.path} has malformed raw Git object or status evidence.`);
        continue;
      }
      if (!SUPPORTED_RAW_STATUSES.has(layer.status)) {
        errors.push(`${entry.path} has unsupported raw Git status ${layer.status}; unresolved, broken, rename, and copy states must fail closed.`);
        continue;
      }
      if (PROHIBITED_GIT_MODES.has(layer.newMode)) {
        errors.push(`${entry.path} has prohibited Git mode ${layer.newMode}; symlinks and gitlinks cannot cross the edit-root gate.`);
      }
    }
  }
  return errors;
}

export function checkEditRootPolicy(options = {}) {
  const impact = options.impact === undefined ? currentImpact() : options.impact;
  const changedEntries = options.changedEntries === undefined && options.changedFiles === undefined
    ? collectChangedEntries({ baseRevision: impact?.baseRevision || '' })
    : (options.changedEntries || []);
  const changedFiles = options.changedFiles === undefined
    ? changedEntries.map((entry) => entry.path)
    : options.changedFiles;
  const rootErrors = checkEditRootValidity({ impact });
  if (rootErrors.length > 0) {
    return rootErrors;
  }
  const evidenceErrors = checkChangedEntrySafety(changedEntries);
  if (evidenceErrors.length > 0) {
    return evidenceErrors;
  }
  const intersectionErrors = checkEditRootIntersections({ impact });
  if (intersectionErrors.length > 0) {
    return intersectionErrors;
  }
  const forbiddenErrors = checkForbiddenEditRoots({ changedFiles, impact });
  if (forbiddenErrors.length > 0) {
    return forbiddenErrors;
  }
  return checkAllowedEditRoots({ changedFiles, impact });
}

export function checkBaseRevision({ changedFiles = collectChangedFiles(), impact = currentImpact() } = {}) {
  if (changedFiles.length === 0 || !isGitRepository()) {
    return [];
  }
  return validateBaseRevision(impact?.baseRevision);
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
    ...checkBaseRevision(),
    ...checkEditRootPolicy()
  ];
}

if (isCli(import.meta.url)) {
  finish('check:diff', checkDiff());
}
