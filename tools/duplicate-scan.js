import { finish, isCli, listFiles, readText } from './common.js';

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
  const segments = file.replace(/\\/g, '/').split('/');
  return segments.some((part, index) => GENERATED_DIRS.has(part)
    && (part !== 'build' || !segments.slice(0, index).includes('src')));
}

export function isDuplicateCandidateFile(file) {
  return /\.(md|js|jsx|mjs|json|ya?ml|ts|tsx|vue|java|sh|css|scss)$/.test(file)
    || file === '.gitattributes'
    || file === '.editorconfig';
}

export function scanDuplicates({
  list = listFiles,
  readTextFile = readText
} = {}) {
  const errors = [];
  const files = list('.', (file) => {
    if (isGeneratedPath(file)) {
      return false;
    }
    return isDuplicateCandidateFile(file);
  });

  const byContent = new Map();
  for (const file of files) {
    const normalized = readTextFile(file).trim();
    if (normalized.length < 40) {
      continue;
    }
    const existing = byContent.get(normalized);
    if (existing) {
      errors.push(`${file} duplicates the full content of ${existing}.`);
    } else {
      byContent.set(normalized, file);
    }
  }

  return errors;
}

if (isCli(import.meta.url)) {
  finish('scan:duplicates', scanDuplicates());
}
