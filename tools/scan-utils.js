import path from 'node:path';
import {
  finish,
  formatJson,
  listFiles,
  readJson,
  readText,
  writeOrCheck
} from './common.js';

export const CODE_EXTENSIONS = new Set([
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.vue',
  '.java',
  '.kt',
  '.sql',
  '.xml',
  '.yml',
  '.yaml',
  '.json',
  '.md'
]);

export function extensionOf(file) {
  const index = file.lastIndexOf('.');
  return index === -1 ? file : file.slice(index);
}

export function textFilesUnder(relativeDir) {
  return listFiles(relativeDir, (file) => CODE_EXTENSIONS.has(extensionOf(file)));
}

export function readJsonOrDefault(relativePath, fallback) {
  try {
    return readJson(relativePath);
  } catch {
    return fallback;
  }
}

export function moduleFromPath(file, root) {
  const normalized = file.replace(/\\/g, '/');
  const prefix = `${root}/`;
  if (!normalized.startsWith(prefix)) {
    return '';
  }
  return normalized.slice(prefix.length).split('/')[0] || '';
}

export function basenameWithoutExtension(file) {
  return path.basename(file, path.extname(file));
}

export function writeGenerated(relativePath, data, { checkMode = false } = {}) {
  const errors = [];
  writeOrCheck(relativePath, formatJson(data), checkMode, errors);
  return errors;
}

export function runScanner(name, relativePath, data, { checkMode = false } = {}) {
  return finish(name, writeGenerated(relativePath, data, { checkMode }));
}

export function readSafe(file) {
  try {
    return readText(file);
  } catch {
    return '';
  }
}
