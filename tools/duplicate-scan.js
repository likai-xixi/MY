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
  return file.replace(/\\/g, '/').split('/').some((part) => GENERATED_DIRS.has(part));
}

export function scanDuplicates() {
  const errors = [];
  const files = listFiles('.', (file) => {
    if (isGeneratedPath(file)) {
      return false;
    }
    return /\.(md|js|jsx|json|ya?ml|ts|tsx|vue|java|sh|css|scss)$/.test(file) || file === '.gitattributes' || file === '.editorconfig';
  });

  const byContent = new Map();
  for (const file of files) {
    const normalized = readText(file).trim();
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
