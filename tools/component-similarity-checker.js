import path from 'node:path';
import { finish, isCli, readText } from './common.js';
import { readJsonOrDefault } from './scan-utils.js';
import { configuredPaths, listFilesUnderRoots } from './project-config.js';
import { hasComponentException, isModuleComponentCandidate } from './component-checker.js';

const GENERIC_HINTS = new Set(['select', 'picker', 'chooser', 'table', 'grid', 'form', 'modal', 'dialog', 'drawer', 'upload', 'button', 'input', 'search', 'tree']);

function normalize(value) {
  return String(value || '')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/[^a-z0-9\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}

function tokens(value) {
  return normalize(value).split('-').filter(Boolean);
}

function basenameWithoutExtension(file) {
  return path.basename(file, path.extname(file));
}

function similarity(a, b) {
  const left = new Set(tokens(a));
  const right = new Set(tokens(b));
  if (left.size === 0 || right.size === 0) {
    return 0;
  }
  const overlap = [...left].filter((item) => right.has(item)).length;
  return overlap / Math.min(left.size, right.size);
}

function flattenText(value) {
  if (Array.isArray(value)) {
    return value.map((item) => flattenText(item)).join(' ');
  }
  if (value && typeof value === 'object') {
    return Object.values(value).map((item) => flattenText(item)).join(' ');
  }
  return String(value || '');
}

function componentSearchText(component) {
  return [
    component.id,
    component.name,
    component.aliases,
    component.purpose,
    component.category,
    component.props,
    component.fingerprint
  ].map((value) => flattenText(value)).join(' ');
}

export function validateComponentSimilarity({
  config = configuredPaths(),
  list = listFilesUnderRoots,
  read = readJsonOrDefault,
  readTextFile = readText
} = {}) {
  const errors = [];
  const sharedCatalog = read('frontend/src/components/catalog.json', { components: [] });
  const ruoyiCatalog = read('ruoyi-ui/src/components/catalog.json', { components: [] });
  const componentRegistry = read('ai/registry/components.json', { components: [] });
  const known = [
    ...(sharedCatalog.components || []),
    ...(ruoyiCatalog.components || []),
    ...(componentRegistry.components || [])
  ].map((component) => ({
    id: component.id,
    name: component.name || component.id,
    purpose: component.purpose || '',
    normalized: normalize(componentSearchText(component))
  }));

  const moduleFiles = list(config.frontendModuleRoots, (file) => isModuleComponentCandidate(file))
    .filter((file) => !hasComponentException(file, { read, readTextFile }));
  if (known.length === 0 && moduleFiles.length > 0) {
    errors.push('Component similarity cannot be checked because component registry and catalogs are empty while module component files exist.');
    return errors;
  }
  for (const file of moduleFiles) {
    const name = basenameWithoutExtension(file);
    const nameTokens = new Set(tokens(name));
    const hasGenericHint = [...nameTokens].some((item) => GENERIC_HINTS.has(item));
    for (const component of known) {
      const score = similarity(name, component.normalized || component.name);
      if (score >= 0.75 || (hasGenericHint && score >= 0.5)) {
        errors.push(`${file} looks similar to shared component ${component.name}. Reuse the shared component or register an explicit exception.`);
      }
    }
  }
  return errors;
}

if (isCli(import.meta.url)) {
  finish('check:component-similarity', validateComponentSimilarity());
}
