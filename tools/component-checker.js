import path from 'node:path';
import {
  ensure,
  fileExists,
  finish,
  isCli,
  listFiles,
  readJson,
  readText
} from './common.js';
import { configuredPaths, existingSharedComponentRoot } from './project-config.js';

export const COMPONENT_EXTENSIONS = new Set(['.tsx', '.jsx', '.vue', '.ts', '.js']);
const GENERIC_COMPONENT_NAMES = new Set([
  'button', 'table', 'datatable', 'form', 'field', 'input', 'select', 'modal', 'dialog', 'drawer',
  'tabs', 'tab', 'filter', 'filters', 'pagination', 'pager', 'toolbar', 'card', 'badge', 'statusbadge',
  'search', 'searchform', 'filterform', 'queryform', 'upload', 'datepicker', 'rangepicker', 'daterange', 'tree', 'treeselect',
  'picker', 'chooser', 'grid'
]);
const NON_COMPONENT_MODULE_FILES = new Set([
  'index', 'route', 'routes', 'router', 'api', 'client', 'service', 'store', 'state', 'types', 'model',
  'schema', 'constants', 'utils', 'helper', 'helpers'
]);

function extname(file) {
  return path.extname(file).toLowerCase();
}

function basenameWithoutExtension(file) {
  return path.basename(file, path.extname(file)).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function normalizedPath(value) {
  return String(value || '').replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/+$/g, '');
}

function basenameRaw(file) {
  return path.basename(file, path.extname(file));
}

export function componentNameTokens(value) {
  return String(value || '')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

export function isComponentSourceFile(file) {
  const name = path.basename(file);
  return COMPONENT_EXTENSIONS.has(extname(file))
    && name !== 'index.ts'
    && name !== 'index.js'
    && !name.includes('.test.')
    && !name.includes('.spec.')
    && !name.includes('.stories.');
}

export function isModuleComponentCandidate(file) {
  if (!isComponentSourceFile(file)) {
    return false;
  }
  const normalized = normalizedPath(file);
  if (normalized.includes('/components/')) {
    return true;
  }
  const base = basenameRaw(file);
  const normalizedBase = normalizeComponentName(base);
  if (NON_COMPONENT_MODULE_FILES.has(normalizedBase)) {
    return false;
  }
  return hasGenericComponentName(base);
}

function hasGenericComponentName(value) {
  const normalized = normalizeComponentName(value);
  return GENERIC_COMPONENT_NAMES.has(normalized) || componentNameTokens(value).some((token) => GENERIC_COMPONENT_NAMES.has(token));
}

export function currentChangeId({ read = readJson } = {}) {
  try {
    return read('ai/changes/CURRENT_CHANGE.json').current || '';
  } catch {
    return '';
  }
}

export function componentExceptionText({ read = readJson, readTextFile = readText } = {}) {
  const changeId = currentChangeId({ read });
  if (!changeId) {
    return '';
  }
  try {
    return readTextFile(`ai/changes/${changeId}/component-exception.md`);
  } catch {
    return '';
  }
}

export function hasComponentException(file, options = {}) {
  const text = componentExceptionText(options);
  const normalized = normalizedPath(file);
  return text.includes(normalized) || text.includes(file) || /allow-all\s*:\s*true/i.test(text);
}

function normalizeComponentName(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function isSharedComponentFile(file, roots) {
  if (!roots.some((root) => file.startsWith(`${root}/`))) {
    return false;
  }
  return isComponentSourceFile(file);
}

function isExported(indexText, exportedFrom) {
  const importPath = `./${exportedFrom.replace(/\.(tsx|jsx|vue|ts|js)$/i, '')}`.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^\\s*export\\s+.+\\s+from\\s+['"]${importPath}['"];?\\s*$`, 'm').test(indexText);
}

export function readComponentCatalog({ read = readJson, root = existingSharedComponentRoot() } = {}) {
  return read(`${root}/catalog.json`);
}

export function readComponentRegistry({ read = readJson } = {}) {
  return read('ai/registry/components.json');
}

function componentEntryPaths(component, roots) {
  const source = normalizedPath(component.path || component.exportedFrom || '');
  if (!source) {
    return [];
  }
  if (roots.some((root) => source.startsWith(`${root}/`))) {
    return [source];
  }
  return roots.map((root) => `${root}/${source}`);
}

function componentEntryPathForRoot(component, root) {
  return componentEntryPaths(component, [root])[0] || '';
}

function mapComponentsByPath(components, root) {
  const byPath = new Map();
  for (const component of components || []) {
    const componentPath = componentEntryPathForRoot(component, root);
    if (componentPath) {
      byPath.set(componentPath, component);
    }
  }
  return byPath;
}

export function validateComponentCatalog({ read = readJson, exists = fileExists, readTextFile = readText } = {}) {
  const errors = [];
  const config = configuredPaths();
  const root = existingSharedComponentRoot();
  ensure(exists(`${root}/README.md`), `${root}/README.md is missing.`, errors);
  ensure(exists(`${root}/catalog.json`), `${root}/catalog.json is missing.`, errors);
  const indexRequired = config.adapter === 'generic' || exists(`${root}/index.ts`);
  if (indexRequired) {
    ensure(exists(`${root}/index.ts`), `${root}/index.ts is missing.`, errors);
  }
  if (errors.length > 0) {
    return errors;
  }

  let catalog;
  try {
    catalog = readComponentCatalog({ read, root });
  } catch (error) {
    return [`${root}/catalog.json is not valid JSON: ${error.message}`];
  }

  ensure(catalog.schemaVersion === 1, 'component catalog schemaVersion must be 1.', errors);
  ensure(Array.isArray(catalog.components), 'component catalog components must be an array.', errors);
  if (!Array.isArray(catalog.components)) {
    return errors;
  }

  const seen = new Set();
  const indexText = indexRequired ? readTextFile(`${root}/index.ts`) : '';
  for (const component of catalog.components) {
    ensure(Boolean(component.id), 'component catalog entry is missing id.', errors);
    ensure(Boolean(component.name), `component ${component.id || '<missing>'} is missing name.`, errors);
    ensure(Boolean(component.exportedFrom || component.path), `component ${component.id || '<missing>'} is missing exportedFrom or path.`, errors);
    ensure(Boolean(component.owner), `component ${component.id || '<missing>'} is missing owner.`, errors);
    ensure(Boolean(component.purpose), `component ${component.id || '<missing>'} is missing purpose.`, errors);
    ensure(Boolean(component.category), `component ${component.id || '<missing>'} is missing category.`, errors);
    ensure(Boolean(component.status), `component ${component.id || '<missing>'} is missing status.`, errors);
    ensure(Array.isArray(component.usedBy), `component ${component.id || '<missing>'} usedBy must be an array.`, errors);
    if (component.aliases !== undefined) {
      ensure(Array.isArray(component.aliases), `component ${component.id || '<missing>'} aliases must be an array.`, errors);
    }
    if (component.props !== undefined) {
      ensure(Array.isArray(component.props), `component ${component.id || '<missing>'} props must be an array.`, errors);
    }
    if (component.id) {
      ensure(!seen.has(component.id), `component catalog id is duplicated: ${component.id}.`, errors);
      seen.add(component.id);
    }
    const exportedFrom = component.exportedFrom || component.path?.replace(`${root}/`, '');
    if (exportedFrom) {
      const exportedPath = exportedFrom.startsWith(root) ? exportedFrom : `${root}/${exportedFrom}`;
      ensure(exists(exportedPath), `component ${component.id} exportedFrom path is missing: ${exportedPath}.`, errors);
      if (indexRequired) {
        ensure(isExported(indexText, exportedFrom.replace(`${root}/`, '')), `component ${component.id} must be exported from ${root}/index.ts.`, errors);
      }
    }
  }
  return errors;
}

export function validateComponentRegistry({ read = readJson, exists = fileExists } = {}) {
  const errors = [];
  const config = configuredPaths();
  let registry;
  try {
    registry = readComponentRegistry({ read });
  } catch (error) {
    return [`ai/registry/components.json is not valid JSON or is missing: ${error.message}`];
  }

  ensure(registry.schemaVersion === 1, 'ai/registry/components.json schemaVersion must be 1.', errors);
  ensure(Array.isArray(registry.components), 'ai/registry/components.json components must be an array.', errors);
  if (!Array.isArray(registry.components)) {
    return errors;
  }

  const seen = new Set();
  for (const component of registry.components) {
    ensure(Boolean(component.id), 'component registry entry is missing id.', errors);
    ensure(Boolean(component.name), `component ${component.id || '<missing>'} is missing name.`, errors);
    ensure(Boolean(component.path || component.exportedFrom), `component ${component.id || '<missing>'} is missing path or exportedFrom.`, errors);
    ensure(Boolean(component.owner), `component ${component.id || '<missing>'} is missing owner.`, errors);
    ensure(Boolean(component.purpose), `component ${component.id || '<missing>'} is missing purpose.`, errors);
    ensure(Boolean(component.category), `component ${component.id || '<missing>'} is missing category.`, errors);
    ensure(Boolean(component.status || component.lifecycle), `component ${component.id || '<missing>'} must include status or lifecycle.`, errors);
    ensure(Array.isArray(component.usedBy), `component ${component.id || '<missing>'} usedBy must be an array.`, errors);
    if (component.aliases !== undefined) {
      ensure(Array.isArray(component.aliases), `component ${component.id || '<missing>'} aliases must be an array.`, errors);
    }
    if (component.props !== undefined) {
      ensure(Array.isArray(component.props), `component ${component.id || '<missing>'} props must be an array.`, errors);
    }
    if (component.id) {
      ensure(!seen.has(component.id), `component registry id is duplicated: ${component.id}.`, errors);
      seen.add(component.id);
    }
    const paths = componentEntryPaths(component, config.sharedComponentRoots);
    if (paths.length > 0) {
      ensure(paths.some((candidate) => exists(candidate)), `component ${component.id} path is missing: ${component.path || component.exportedFrom}.`, errors);
    }
  }
  return errors;
}

export function validateSharedComponentCoverage({ files = listFiles, read = readJson } = {}) {
  const errors = [];
  const config = configuredPaths();
  const sharedFiles = [...new Set(config.sharedComponentRoots.flatMap((sharedRoot) => files(sharedRoot, (candidate) => isSharedComponentFile(candidate, config.sharedComponentRoots))))];
  const rootsWithFiles = config.sharedComponentRoots.filter((sharedRoot) => sharedFiles.some((file) => file.startsWith(`${sharedRoot}/`)));
  let registry;
  try {
    registry = readComponentRegistry({ read });
  } catch (error) {
    return [`ai/registry/components.json is not valid JSON or is missing: ${error.message}`];
  }
  const registryComponents = Array.isArray(registry.components) ? registry.components : [];

  for (const root of rootsWithFiles) {
    let catalog;
    try {
      catalog = readComponentCatalog({ read, root });
    } catch (error) {
      errors.push(`${root}/catalog.json is not valid JSON or is missing: ${error.message}`);
      continue;
    }
    const catalogComponents = Array.isArray(catalog.components) ? catalog.components : [];
    const catalogByPath = mapComponentsByPath(catalogComponents, root);
    const registryByPath = mapComponentsByPath(registryComponents, root);
    const filesForRoot = sharedFiles.filter((candidate) => candidate.startsWith(`${root}/`));
    if (filesForRoot.length > 0 && catalogComponents.length === 0) {
      errors.push(`${root}/catalog.json is empty but ${root} contains shared component files.`);
    }
    if (filesForRoot.length > 0 && registryComponents.length === 0) {
      errors.push(`ai/registry/components.json is empty but ${root} contains shared component files.`);
    }
    for (const file of filesForRoot) {
      const catalogEntry = catalogByPath.get(file);
      const registryEntry = registryByPath.get(file);
      ensure(Boolean(catalogEntry), `${file} must be registered in ${root}/catalog.json.`, errors);
      ensure(Boolean(registryEntry), `${file} must be registered in ai/registry/components.json.`, errors);
      if (catalogEntry && registryEntry && catalogEntry.id && registryEntry.id) {
        ensure(catalogEntry.id === registryEntry.id, `${file} must use the same component id in ${root}/catalog.json and ai/registry/components.json.`, errors);
      }
    }
  }
  return errors;
}

export function validateModuleComponents({ files = listFiles, read = readJson, readTextFile = readText } = {}) {
  const errors = [];
  const config = configuredPaths();
  const root = existingSharedComponentRoot();
  const catalog = readComponentCatalog({ read, root });
  const sharedNames = new Set(
    (catalog.components || []).flatMap((component) => [
      normalizeComponentName(component.id),
      normalizeComponentName(component.name),
      normalizeComponentName(path.basename(component.exportedFrom || component.path || '', path.extname(component.exportedFrom || component.path || '')))
    ]).filter(Boolean)
  );

  const moduleComponentFiles = [...new Set(config.frontendModuleRoots.flatMap((moduleRoot) => files(moduleRoot, (file) => {
    return isModuleComponentCandidate(file);
  })))];

  for (const file of moduleComponentFiles) {
    if (hasComponentException(file, { read, readTextFile })) {
      continue;
    }
    const name = basenameWithoutExtension(file);
    ensure(!sharedNames.has(name), `${file} duplicates a shared component name. Use ${root} instead.`, errors);
    ensure(!hasGenericComponentName(path.basename(file, path.extname(file))), `${file} looks like a reusable control. Add it to ${root} or use an existing shared component.`, errors);
  }

  return errors;
}

export function validateComponents() {
  const catalogErrors = validateComponentCatalog();
  const registryErrors = validateComponentRegistry();
  if (catalogErrors.length > 0 || registryErrors.length > 0) {
    return [...catalogErrors, ...registryErrors];
  }
  return [
    ...catalogErrors,
    ...registryErrors,
    ...validateSharedComponentCoverage(),
    ...validateModuleComponents()
  ];
}

if (isCli(import.meta.url)) {
  finish('check:components', validateComponents());
}
