import { finish, isCli, fileExists, readJson } from './common.js';
import { basenameWithoutExtension, readJsonOrDefault, readSafe, writeGenerated } from './scan-utils.js';
import { configuredPaths, inferFeatureFromPath, listFilesUnderRoots, readFeatureRegistry } from './project-config.js';
import { isComponentSourceFile, isModuleComponentCandidate } from './component-checker.js';

const COMPONENT_EXTENSIONS = /\.(vue|tsx|jsx|ts|js)$/;

function readSharedCatalog(root, { exists = fileExists, read = readJson } = {}) {
  const catalogPath = `${root}/catalog.json`;
  return exists(catalogPath) ? read(catalogPath) : { schemaVersion: 1, components: [] };
}

export function buildComponentScan({
  config = configuredPaths(),
  features = readFeatureRegistry(),
  list = listFilesUnderRoots,
  exists = fileExists,
  read = readJson,
  readOrDefault = readJsonOrDefault
} = {}) {
  const registry = readOrDefault('ai/registry/components.json', { schemaVersion: 1, components: [] });
  const sharedCatalogs = config.sharedComponentRoots.map((root) => ({ root, components: readSharedCatalog(root, { exists, read }).components || [] }));
  const sharedFiles = list(config.sharedComponentRoots, (file) => isComponentSourceFile(file));
  const moduleComponentFiles = list(config.frontendModuleRoots, (file) => isModuleComponentCandidate(file));
  const imports = list(config.frontendScanRoots, (file) => COMPONENT_EXTENSIONS.test(file)).flatMap((file) => {
    const text = readSafe(file);
    const matches = [...text.matchAll(/from\s+["']([^"']*components[^"']*)["']/g)];
    return matches.map((match) => ({ file, module: inferFeatureFromPath(file, features), source: match[1] }));
  });

  return {
    schemaVersion: 1,
    generatedBy: 'tools/scan-components.js',
    adapter: config.adapter,
    sharedCatalogs,
    sharedCatalog: sharedCatalogs.flatMap((item) => item.components),
    componentRegistry: registry.components || [],
    sharedFiles: sharedFiles.map((file) => ({ file, name: basenameWithoutExtension(file) })),
    moduleComponentFiles: moduleComponentFiles.map((file) => ({ file, name: basenameWithoutExtension(file), module: inferFeatureFromPath(file, features) })),
    imports
  };
}

export function runComponentScan({ checkMode = false } = {}) {
  return writeGenerated('ai/generated/component-usage.json', buildComponentScan(), { checkMode });
}

if (isCli(import.meta.url)) {
  finish('scan:components', runComponentScan({ checkMode: process.argv.includes('--check') }));
}
