import { finish, isCli, listFiles, readJson, readText } from './common.js';

const TEXT_EXTENSIONS = /\.(md|js|jsx|json|ya?ml|ts|tsx|vue|java|kt|sql|xml|sh|css|scss)$/;
const DEFAULT_ALLOWED_PREFIXES = [
  'ai/changes/',
  'ai/deletions/',
  'memory/CHANGELOG.md',
  'memory/HANDOVER.md',
  'memory/sessions/',
  'tests/'
];

function readIgnoreConfig() {
  try {
    const config = readJson('ai/rules/orphan-ignore.json');
    return {
      prefixes: Array.isArray(config.prefixes) ? config.prefixes : [],
      files: Array.isArray(config.files) ? config.files : []
    };
  } catch {
    return { prefixes: [], files: [] };
  }
}

function featureTokens(value) {
  const slug = value.trim().toLowerCase();
  if (!slug) {
    return [];
  }
  const pascal = slug.split(/[-_\s]+/).filter(Boolean).map((part) => part.slice(0, 1).toUpperCase() + part.slice(1)).join('');
  const camel = pascal ? `${pascal.slice(0, 1).toLowerCase()}${pascal.slice(1)}` : '';
  return [...new Set([slug, slug.replace(/-/g, '_'), pascal, camel].filter(Boolean))];
}

function shouldSkip(file, allowedPrefixes = DEFAULT_ALLOWED_PREFIXES, allowedFiles = []) {
  return file.startsWith('node_modules/')
    || file.startsWith('.git/')
    || allowedFiles.includes(file)
    || allowedPrefixes.some((prefix) => file === prefix || file.startsWith(prefix));
}

export function scanOrphans({ feature = '', tokens = featureTokens(feature), allowedPrefixes = DEFAULT_ALLOWED_PREFIXES, allowedFiles = [] } = {}) {
  const errors = [];
  if (tokens.length === 0) {
    return errors;
  }
  const ignore = readIgnoreConfig();
  const prefixes = [...new Set([...allowedPrefixes, ...ignore.prefixes])];
  const filesToIgnore = [...new Set([...allowedFiles, ...ignore.files])];
  const files = listFiles('.', (file) => TEXT_EXTENSIONS.test(file) && !shouldSkip(file, prefixes, filesToIgnore));
  for (const file of files) {
    const text = readText(file);
    for (const token of tokens) {
      if (text.includes(token)) {
        errors.push(`${file} still contains removed feature token ${token}.`);
        break;
      }
    }
  }
  return errors;
}

export function validateRemovedFeatureOrphans() {
  let registry;
  try {
    registry = readJson('ai/registry/features.json');
  } catch {
    return [];
  }
  const removed = (registry.features || []).filter((feature) => feature.status === 'removed');
  return removed.flatMap((feature) => scanOrphans({ feature: feature.id }));
}

if (isCli(import.meta.url)) {
  const feature = process.argv.slice(2).filter((arg) => !arg.startsWith('--')).join(' ');
  finish('check:orphan', feature ? scanOrphans({ feature }) : validateRemovedFeatureOrphans());
}
