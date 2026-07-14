import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { lstatSync, readFileSync } from 'node:fs';
import { TextDecoder } from 'node:util';
import {
  fileExists,
  finish,
  isCli
} from './common.js';
import { collectChangedEntries, validateBaseRevision } from './diff-checker.js';

export const LEGACY_BASELINE_PATH = 'ai/rules/ruoyi-legacy-baseline.json';
const HASH_ALGORITHM = 'sha256:utf8-no-bom-lf';
const FULL_COMMIT_OID_PATTERN = /^[0-9a-f]{40}$/i;
const REGULAR_BLOB_MODES = new Set(['100644', '100755']);
const CONTENT_CHANGE_STATUSES = new Set(['A', 'M', 'T']);
const COMPONENT_CHECKS = new Set(['component', 'similarity']);
const COMPONENT_ROOTS = [
  'ruoyi-ui/src/views/system/',
  'ruoyi-ui/src/views/tool/'
];
const BOUNDARY_ROOTS = [
  'ruoyi-ui/src/router/index.js',
  ...COMPONENT_ROOTS
];

export function canonicalSourceText(value) {
  let text;
  if (typeof value === 'string') {
    text = value;
  } else if (value instanceof Uint8Array) {
    try {
      text = new TextDecoder('utf-8', { fatal: true }).decode(value);
    } catch (error) {
      throw new Error('Source contains invalid UTF-8 bytes.', { cause: error });
    }
  } else if (value === undefined || value === null) {
    text = '';
  } else {
    throw new TypeError('Source must be a UTF-8 Buffer, Uint8Array, or string.');
  }
  return text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
}

export function canonicalSha256(value) {
  return crypto.createHash('sha256').update(canonicalSourceText(value), 'utf8').digest('hex');
}

function readStrictJson(file) {
  return JSON.parse(canonicalSourceText(readFileSync(file)));
}

export function normalizeRepoPath(value) {
  return String(value || '').replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/{2,}/g, '/');
}

function blank(value) {
  return typeof value !== 'string' || value.trim().length === 0;
}

function exactPathSyntaxError(file) {
  if (blank(file)) return 'file is required';
  const normalized = normalizeRepoPath(file);
  if (
    file !== file.trim()
    || normalized !== file
    || normalized.startsWith('/')
    || /^[A-Za-z]:/.test(normalized)
    || normalized.split('/').some((segment) => segment === '.' || segment === '..')
    || /[*?\[\]{}!]/.test(normalized)
    || /[\0\r\n]/.test(normalized)
    || normalized.endsWith('/')
  ) {
    return 'must be an exact file path in normalized form without glob, parent, absolute, or directory syntax';
  }
  return '';
}

function exactPathError(file, roots) {
  const syntaxError = exactPathSyntaxError(file);
  if (syntaxError) return syntaxError;
  const normalized = normalizeRepoPath(file);
  const inRoot = roots.some((root) => root.endsWith('/') ? normalized.startsWith(root) : normalized === root);
  return inRoot ? '' : `must stay inside the approved RuoYi legacy roots: ${roots.join(', ')}`;
}

function defaultBaseline() {
  return {
    schemaVersion: 1,
    adapter: 'ruoyi',
    hashAlgorithm: HASH_ALGORITHM,
    componentFiles: [],
    boundaryFindings: []
  };
}

function activeImpactBaseRevision() {
  const current = readStrictJson('ai/changes/CURRENT_CHANGE.json').current || '';
  if (!current) throw new Error('CURRENT_CHANGE.json does not declare an active change');
  return String(readStrictJson(`ai/changes/${current}/impact.json`).baseRevision || '');
}

function runGitResult(args) {
  try {
    return {
      status: 0,
      stdout: execFileSync('git', args, {
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

export function validateLegacySourceCommit(commit, baseRevision, { runGitResultFn = runGitResult } = {}) {
  if (!FULL_COMMIT_OID_PATTERN.test(String(baseRevision || ''))) {
    throw new Error('impact.baseRevision must be a full fixed 40-character commit OID before legacy evidence can be used');
  }
  const typeResult = runGitResultFn(['cat-file', '-t', commit]);
  if (typeResult.status !== 0) {
    throw new Error(`Git object ${commit} is unavailable; repository history may be shallow`);
  }
  const type = String(typeResult.stdout || '').trim();
  if (type !== 'commit') {
    throw new Error(`Git object ${commit} is ${type || 'unknown'}, not a commit`);
  }
  const ancestor = runGitResultFn(['merge-base', '--is-ancestor', commit, baseRevision]);
  if (ancestor.status !== 0) {
    throw new Error(`Git cannot prove commit ${commit} is an ancestor of impact.baseRevision ${baseRevision}; post-base, shallow, or unrelated history cannot become legacy evidence`);
  }
}

function readCommittedFileFromGit(commit, file) {
  return execFileSync('git', ['show', `${commit}:${file}`], {
    stdio: ['ignore', 'pipe', 'pipe']
  });
}

function readCurrentFileFromGit(file) {
  const output = execFileSync('git', ['-c', 'core.quotepath=false', 'ls-files', '--stage', '-z', '--', file], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
  const records = output.split('\0').filter(Boolean);
  if (records.length !== 1) {
    throw new Error(`Git index does not contain exactly one entry for ${file}`);
  }
  const match = records[0].match(/^([0-7]{6}) ([0-9a-f]{40}) ([0-3])\t(.+)$/i);
  if (!match || match[3] !== '0' || match[4] !== file) {
    throw new Error(`Git index returned malformed or unmerged blob evidence for ${file}`);
  }
  const mode = match[1];
  const oid = match[2].toLowerCase();
  const content = REGULAR_BLOB_MODES.has(mode)
    ? execFileSync('git', ['cat-file', 'blob', oid], { stdio: ['ignore', 'pipe', 'pipe'] })
    : null;
  return { mode, oid, content };
}

function validateWorktreeMatchesIndexFromGit(file, current) {
  const stats = lstatSync(file);
  const worktreeMode = stats.isSymbolicLink()
    ? '120000'
    : stats.isFile()
      ? ((stats.mode & 0o111) === 0 ? '100644' : '100755')
      : stats.isDirectory()
        ? '040000'
        : '000000';
  if (worktreeMode !== current.mode) {
    throw new Error(`working tree mode ${worktreeMode} differs from Git index mode ${current.mode} for ${file}`);
  }
  if (!REGULAR_BLOB_MODES.has(worktreeMode)) return;
  const worktreeOid = String(execFileSync('git', ['hash-object', '--path', file, '--', file], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  })).trim().toLowerCase();
  if (!FULL_COMMIT_OID_PATTERN.test(worktreeOid)) {
    throw new Error(`Git could not produce a full worktree blob OID for ${file}`);
  }
  if (worktreeOid !== current.oid) {
    throw new Error(`working tree blob ${worktreeOid} differs from Git index blob ${current.oid} for ${file}`);
  }
}

function readCommittedFileModeFromGit(commit, file) {
  const output = execFileSync('git', ['-c', 'core.quotepath=false', 'ls-tree', '-z', commit, '--', file], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
  const records = output.split('\0').filter(Boolean);
  if (records.length !== 1) {
    throw new Error(`Git tree ${commit} does not contain exactly one entry for ${file}`);
  }
  const match = records[0].match(/^([0-7]{6}) (blob|commit) [0-9a-f]{40}\t(.+)$/i);
  if (!match || match[3] !== file) {
    throw new Error(`Git tree ${commit} returned malformed mode evidence for ${file}`);
  }
  return match[1];
}

function validateCommonEntry(entry, label, roots, ids, errors, {
  exists,
  readCurrentFile,
  validateWorktreeMatch,
  validateSourceCommit,
  readCommittedFile,
  readCommittedFileMode,
  baseRevision
}) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    errors.push(`${label} must be an object.`);
    return false;
  }
  if (blank(entry.id)) {
    errors.push(`${label}.id is required.`);
  } else if (ids.has(entry.id)) {
    errors.push(`${label}.id is duplicated: ${entry.id}.`);
  } else {
    ids.add(entry.id);
  }
  const pathError = exactPathError(entry.file, roots);
  if (pathError) errors.push(`${label}.file ${pathError}.`);
  if (blank(entry.reason)) errors.push(`${label}.reason is required.`);
  const sourceCommitValid = /^[0-9a-f]{40}$/i.test(String(entry.sourceCommit || ''));
  if (!sourceCommitValid) {
    errors.push(`${label}.sourceCommit must be a full 40-character Git commit hash.`);
  }
  const sha256Valid = /^[0-9a-f]{64}$/i.test(String(entry.sha256 || ''));
  if (!sha256Valid) {
    errors.push(`${label}.sha256 must be a 64-character SHA256 value.`);
  }
  if (pathError || !entry.file) return false;
  if (!exists(entry.file)) {
    errors.push(`${label}.file does not exist: ${entry.file}.`);
    return false;
  }
  let current;
  try {
    current = readCurrentFile(entry.file);
  } catch (error) {
    errors.push(`${label}.file Git index blob cannot be read for ${entry.file}: ${error.message}`);
    return false;
  }
  if (!current || typeof current !== 'object' || !REGULAR_BLOB_MODES.has(current.mode)) {
    errors.push(`${label}.file current Git mode ${current?.mode || '<missing>'} is not a regular blob; symlinks and gitlinks cannot be legacy evidence.`);
    return false;
  }
  if (!FULL_COMMIT_OID_PATTERN.test(String(current.oid || ''))) {
    errors.push(`${label}.file Git index blob OID is malformed for ${entry.file}.`);
    return false;
  }
  let worktreeMatches = true;
  try {
    validateWorktreeMatch(entry.file, current);
  } catch (error) {
    worktreeMatches = false;
    errors.push(`${label}.file working tree cannot be validated against the Git index for ${entry.file}: ${error.message}`);
  }
  let actual;
  try {
    actual = canonicalSha256(current.content);
  } catch (error) {
    errors.push(`${label}.file Git index blob cannot be hashed as canonical UTF-8: ${entry.file}: ${error.message}`);
    return false;
  }
  if (actual !== String(entry.sha256 || '').toLowerCase()) {
    errors.push(`${label}.sha256 hash mismatch for ${entry.file}: expected ${entry.sha256}, actual ${actual}.`);
    return false;
  }
  if (!worktreeMatches) return false;
  if (sourceCommitValid && sha256Valid) {
    let committedSource;
    try {
      validateSourceCommit(entry.sourceCommit, baseRevision);
      const committedMode = readCommittedFileMode(entry.sourceCommit, entry.file);
      if (!REGULAR_BLOB_MODES.has(committedMode)) {
        errors.push(`${label}.sourceCommit historical Git mode ${committedMode || '<missing>'} is not a regular blob for ${entry.sourceCommit}:${entry.file}; symlinks and gitlinks cannot be legacy evidence.`);
        return false;
      }
      committedSource = readCommittedFile(entry.sourceCommit, entry.file);
    } catch (error) {
      errors.push(`${label}.sourceCommit cannot resolve ${entry.sourceCommit}:${entry.file}: ${error.message}`);
      return false;
    }
    let committedHash;
    try {
      committedHash = canonicalSha256(committedSource);
    } catch (error) {
      errors.push(`${label}.sourceCommit cannot be hashed as canonical UTF-8 for ${entry.sourceCommit}:${entry.file}: ${error.message}`);
      return false;
    }
    if (committedHash !== String(entry.sha256).toLowerCase()) {
      errors.push(`${label}.sourceCommit hash mismatch for ${entry.sourceCommit}:${entry.file}: expected ${entry.sha256}, actual ${committedHash}.`);
      return false;
    }
    let baseSource;
    try {
      const baseMode = readCommittedFileMode(baseRevision, entry.file);
      if (!REGULAR_BLOB_MODES.has(baseMode)) {
        errors.push(`${label}.impact.baseRevision Git mode ${baseMode || '<missing>'} is not a regular blob for ${baseRevision}:${entry.file}.`);
        return false;
      }
      baseSource = entry.sourceCommit.toLowerCase() === String(baseRevision).toLowerCase()
        ? committedSource
        : readCommittedFile(baseRevision, entry.file);
    } catch (error) {
      errors.push(`${label}.impact.baseRevision cannot resolve ${baseRevision}:${entry.file}: ${error.message}`);
      return false;
    }
    let baseHash;
    try {
      baseHash = canonicalSha256(baseSource);
    } catch (error) {
      errors.push(`${label}.impact.baseRevision cannot be hashed as canonical UTF-8 for ${baseRevision}:${entry.file}: ${error.message}`);
      return false;
    }
    if (baseHash !== String(entry.sha256).toLowerCase()) {
      errors.push(`${label}.impact.baseRevision hash mismatch for ${baseRevision}:${entry.file}: expected ${entry.sha256}, actual ${baseHash}.`);
      return false;
    }
  }
  return true;
}

export function inspectLegacyBaseline({
  read = readStrictJson,
  exists = fileExists,
  readCurrentFile = readCurrentFileFromGit,
  validateWorktreeMatch = validateWorktreeMatchesIndexFromGit,
  validateBaseRevisionFn = validateBaseRevision,
  validateSourceCommit = validateLegacySourceCommit,
  readCommittedFile = readCommittedFileFromGit,
  readCommittedFileMode = readCommittedFileModeFromGit,
  baseRevision,
  readActiveBaseRevision = activeImpactBaseRevision
} = {}) {
  const errors = [];
  let legacyCutoff = baseRevision;
  if (legacyCutoff === undefined) {
    try {
      legacyCutoff = readActiveBaseRevision();
    } catch (error) {
      errors.push(`Legacy baseline requires active impact.baseRevision: ${error.message}`);
      legacyCutoff = '';
    }
  }
  try {
    const baseErrors = validateBaseRevisionFn(legacyCutoff);
    if (!Array.isArray(baseErrors)) {
      throw new Error('base revision validator did not return an error array');
    }
    errors.push(...baseErrors);
  } catch (error) {
    errors.push(`Legacy baseline impact.baseRevision validation failed: ${error.message}`);
  }
  let baseline;
  try {
    baseline = read(LEGACY_BASELINE_PATH);
  } catch (error) {
    errors.push(`${LEGACY_BASELINE_PATH} is missing or invalid JSON: ${error.message}`);
    baseline = defaultBaseline();
  }

  if (!baseline || typeof baseline !== 'object' || Array.isArray(baseline)) {
    errors.push(`${LEGACY_BASELINE_PATH} root must be a JSON object.`);
    baseline = defaultBaseline();
  }

  if (baseline.schemaVersion !== 1) errors.push(`${LEGACY_BASELINE_PATH} schemaVersion must be 1.`);
  if (baseline.adapter !== 'ruoyi') errors.push(`${LEGACY_BASELINE_PATH} adapter must be ruoyi.`);
  if (baseline.hashAlgorithm !== HASH_ALGORITHM) {
    errors.push(`${LEGACY_BASELINE_PATH} hashAlgorithm must be ${HASH_ALGORITHM}.`);
  }
  if (!Array.isArray(baseline.componentFiles)) {
    errors.push(`${LEGACY_BASELINE_PATH} componentFiles must be an array.`);
    baseline.componentFiles = [];
  }
  if (!Array.isArray(baseline.boundaryFindings)) {
    errors.push(`${LEGACY_BASELINE_PATH} boundaryFindings must be an array.`);
    baseline.boundaryFindings = [];
  }

  const ids = new Set();
  const validatedCommits = new Set();
  const validateSourceCommitOnce = (commit, cutoff) => {
    const key = `${String(commit).toLowerCase()}\0${String(cutoff).toLowerCase()}`;
    if (validatedCommits.has(key)) return;
    validateSourceCommit(commit, cutoff);
    validatedCommits.add(key);
  };
  const componentKeys = new Set();
  for (const [index, entry] of baseline.componentFiles.entries()) {
    const label = `${LEGACY_BASELINE_PATH} componentFiles[${index}]`;
    validateCommonEntry(entry, label, COMPONENT_ROOTS, ids, errors, {
      exists,
      readCurrentFile,
      validateWorktreeMatch,
      validateSourceCommit: validateSourceCommitOnce,
      readCommittedFile,
      readCommittedFileMode,
      baseRevision: legacyCutoff
    });
    if (!Array.isArray(entry?.checks) || entry.checks.length === 0) {
      errors.push(`${label}.checks must be a non-empty array.`);
    } else {
      const seenChecks = new Set();
      for (const check of entry.checks) {
        if (!COMPONENT_CHECKS.has(check)) errors.push(`${label}.checks contains unknown check: ${check}.`);
        if (seenChecks.has(check)) errors.push(`${label}.checks contains duplicate check: ${check}.`);
        seenChecks.add(check);
        const key = `${entry.file}\u0000${check}`;
        if (componentKeys.has(key)) errors.push(`${label} duplicates component finding ${entry.file} (${check}).`);
        componentKeys.add(key);
      }
    }
  }

  const boundaryKeys = new Set();
  for (const [index, entry] of baseline.boundaryFindings.entries()) {
    const label = `${LEGACY_BASELINE_PATH} boundaryFindings[${index}]`;
    validateCommonEntry(entry, label, BOUNDARY_ROOTS, ids, errors, {
      exists,
      readCurrentFile,
      validateWorktreeMatch,
      validateSourceCommit: validateSourceCommitOnce,
      readCommittedFile,
      readCommittedFileMode,
      baseRevision: legacyCutoff
    });
    if (!Array.isArray(entry?.expectedTargets) || entry.expectedTargets.length === 0) {
      errors.push(`${label}.expectedTargets must be a non-empty array.`);
    } else {
      const seenTargets = new Set();
      for (const target of entry.expectedTargets) {
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(target || ''))) {
          errors.push(`${label}.expectedTargets contains invalid feature id: ${target}.`);
        }
        if (seenTargets.has(target)) errors.push(`${label}.expectedTargets contains duplicate target: ${target}.`);
        seenTargets.add(target);
        const key = `${entry.file}\u0000${target}`;
        if (boundaryKeys.has(key)) errors.push(`${label} duplicates boundary finding ${entry.file} (${target}).`);
        boundaryKeys.add(key);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    baseline,
    hash: canonicalSha256
  };
}

export function validateLegacyBaseline(options = {}) {
  return inspectLegacyBaseline(options).errors;
}

export function isLegacyComponentFinding(state, file, check) {
  if (!state?.valid) return false;
  const normalized = normalizeRepoPath(file);
  return state.baseline.componentFiles.some((entry) => (
    entry.file === normalized && entry.checks.includes(check)
  ));
}

export function isLegacyBoundaryFinding(state, file, target) {
  if (!state?.valid) return false;
  const normalized = normalizeRepoPath(file);
  return state.baseline.boundaryFindings.some((entry) => (
    entry.file === normalized && entry.expectedTargets.includes(target)
  ));
}

function stripTicks(value) {
  const text = String(value || '').trim();
  return text.startsWith('`') && text.endsWith('`') ? text.slice(1, -1).trim() : text;
}

function parseStructuredExceptions(kind, text, errors) {
  if (/allow-all\s*:\s*true/i.test(text)) {
    errors.push(`${kind} exception must not use allow-all: true.`);
  }
  const entries = [];
  let current = null;
  const flush = () => {
    if (current) entries.push(current);
    current = null;
  };
  for (const [index, line] of canonicalSourceText(text).split('\n').entries()) {
    const start = line.match(/^\s*-\s+file:\s*`([^`]+)`\s*$/);
    if (start) {
      flush();
      current = { file: start[1], line: index + 1 };
      continue;
    }
    if (/^\s*-\s+file\s*:/.test(line)) {
      errors.push(`${kind} exception line ${index + 1} has an invalid file field; use an exact backticked repository path.`);
      continue;
    }
    if (/^\s*-\s+`[^`]+`\s*$/.test(line)) {
      errors.push(`${kind} exception line ${index + 1} uses an unstructured path bullet; use "- file:" plus check/target and reason fields.`);
      continue;
    }
    const field = line.match(/^\s{2,}(reason|check|target):\s*(.+?)\s*$/);
    if (field && current) {
      const key = field[1];
      if (current[key] !== undefined) {
        errors.push(`${kind} exception line ${index + 1} duplicates ${key} for ${current.file}.`);
      } else {
        current[key] = stripTicks(field[2]);
      }
    }
  }
  flush();
  return entries;
}

export function inspectCurrentChangeExceptions(kind, {
  read = readStrictJson,
  readTextFile = readFileSync,
  readChangedFiles,
  validateBaseRevisionFn = validateBaseRevision,
  collectActualChangedEntries = collectChangedEntries
} = {}) {
  const errors = [];
  if (kind !== 'component' && kind !== 'boundary') {
    return { valid: false, errors: [`Unknown current-change exception kind: ${kind}.`], entries: [] };
  }
  let changeId = '';
  try {
    changeId = read('ai/changes/CURRENT_CHANGE.json').current || '';
  } catch (error) {
    return {
      valid: false,
      errors: [`Current-change exceptions require readable strict UTF-8 CURRENT_CHANGE.json: ${error.message}`],
      entries: []
    };
  }
  if (!changeId) return { valid: true, errors: [], entries: [] };

  const exceptionPath = `ai/changes/${changeId}/${kind === 'component' ? 'component' : 'boundary'}-exception.md`;
  let rawText;
  try {
    rawText = readTextFile(exceptionPath);
  } catch {
    return { valid: true, errors: [], entries: [] };
  }
  let entries;
  try {
    entries = parseStructuredExceptions(kind, canonicalSourceText(rawText), errors);
  } catch (error) {
    return {
      valid: false,
      errors: [`${exceptionPath} must be valid UTF-8 governance evidence: ${error.message}`],
      entries: []
    };
  }

  let changedFiles = [];
  try {
    const manifestPath = `ai/changes/${changeId}/changed-files.json`;
    const manifest = readChangedFiles ? readChangedFiles(manifestPath) : read(manifestPath);
    if (!Array.isArray(manifest.files)) {
      errors.push(`${manifestPath} files must be an array before exceptions can be used.`);
    } else {
      changedFiles = manifest.files;
      for (const file of changedFiles) {
        if (exactPathSyntaxError(file)) {
          errors.push(`${manifestPath} entry ${JSON.stringify(file)} must be an exact file path in normalized form.`);
        }
      }
    }
  } catch (error) {
    errors.push(`Current-change exceptions require readable changed-files.json: ${error.message}`);
  }
  const changed = new Set(changedFiles);
  let actualChanged = new Map();
  if (entries.length > 0) {
    const impactPath = `ai/changes/${changeId}/impact.json`;
    let baseRevision = '';
    try {
      baseRevision = String(read(impactPath).baseRevision || '').trim();
    } catch (error) {
      errors.push(`Current-change exceptions require readable impact.json: ${error.message}`);
    }
    let baseErrors = [];
    try {
      baseErrors = validateBaseRevisionFn(baseRevision);
      errors.push(...baseErrors);
    } catch (error) {
      baseErrors = [`impact.baseRevision validation failed: ${error.message}`];
      errors.push(...baseErrors);
    }
    if (baseErrors.length === 0) {
      try {
        const evidence = collectActualChangedEntries({ baseRevision });
        if (!Array.isArray(evidence)) {
          throw new Error('Git change collector did not return an evidence array');
        }
        for (const item of evidence) {
          if (!item || typeof item !== 'object' || typeof item.path !== 'string') {
            errors.push('Current-change exceptions require raw Git mode and blob evidence for every changed path.');
            continue;
          }
          if (exactPathSyntaxError(item.path)) {
            errors.push(`Actual Git changed path ${JSON.stringify(item.path)} must be canonical.`);
            continue;
          }
          if (actualChanged.has(item.path)) {
            errors.push(`Actual Git change evidence is duplicated for ${item.path}.`);
            continue;
          }
          actualChanged.set(item.path, item);
        }
      } catch (error) {
        errors.push(`Current-change exceptions require a readable actual Git change set: ${error.message}`);
      }
    }
  }
  const keys = new Set();
  for (const entry of entries) {
    const pathError = exactPathError(entry.file, kind === 'component'
      ? ['frontend/src/modules/', 'ruoyi-ui/src/views/']
      : ['frontend/src/modules/', 'ruoyi-ui/src/']);
    if (pathError) errors.push(`${kind} exception ${entry.file || '<missing>'} ${pathError}.`);
    if (blank(entry.reason)) errors.push(`${kind} exception ${entry.file} requires a structured reason.`);
    if (!changed.has(entry.file)) {
      errors.push(`${kind} exception ${entry.file} must be an actual file in the current changed-files.json.`);
    }
    const evidence = actualChanged.get(entry.file);
    if (!evidence) {
      errors.push(`${kind} exception ${entry.file} must be an actual file in the actual Git change set for impact.baseRevision.`);
    } else if (
      !evidence.candidate
      || !REGULAR_BLOB_MODES.has(evidence.candidate.newMode)
      || !CONTENT_CHANGE_STATUSES.has(evidence.candidate.status)
      || !FULL_COMMIT_OID_PATTERN.test(String(evidence.candidate.oldOid || ''))
      || !FULL_COMMIT_OID_PATTERN.test(String(evidence.candidate.newOid || ''))
      || evidence.candidate.contentChanged !== true
    ) {
      errors.push(`${kind} exception ${entry.file} must be a regular blob content change; mode-only changes, symlinks, and gitlinks are not eligible.`);
    }
    if (kind === 'component') {
      if (!COMPONENT_CHECKS.has(entry.check)) {
        errors.push(`component exception ${entry.file} check must be component or similarity.`);
      }
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(entry.target || ''))) {
      errors.push(`boundary exception ${entry.file} requires an exact target feature id.`);
    }
    const key = kind === 'component'
      ? `${entry.file}\u0000${entry.check}`
      : `${entry.file}\u0000${entry.target}`;
    if (keys.has(key)) errors.push(`${kind} exception is duplicated for ${entry.file}.`);
    keys.add(key);
  }
  return { valid: errors.length === 0, errors, entries };
}

export function isCurrentComponentException(state, file, check) {
  if (!state?.valid) return false;
  const normalized = normalizeRepoPath(file);
  return state.entries.some((entry) => entry.file === normalized && entry.check === check);
}

export function isCurrentBoundaryException(state, file, target) {
  if (!state?.valid) return false;
  const normalized = normalizeRepoPath(file);
  return state.entries.some((entry) => entry.file === normalized && entry.target === target);
}

if (isCli(import.meta.url)) {
  finish('check:legacy-baseline', validateLegacyBaseline());
}
