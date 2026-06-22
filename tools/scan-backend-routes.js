import { finish, isCli } from './common.js';
import { readSafe, writeGenerated } from './scan-utils.js';
import { configuredPaths, inferFeatureFromPath, listFilesUnderRoots, readFeatureRegistry, unique } from './project-config.js';

const JAVA_MAPPING_METHODS = {
  GetMapping: 'GET',
  PostMapping: 'POST',
  PutMapping: 'PUT',
  DeleteMapping: 'DELETE',
  PatchMapping: 'PATCH',
  RequestMapping: 'ANY'
};

function normalizeRoutePath(value) {
  if (!value) {
    return '';
  }
  return value.startsWith('/') ? value : `/${value}`;
}

function extractFirstString(args = '') {
  return args.match(/["']([^"']+)["']/)?.[1] || '';
}

function scanJavaRoutes(file, text, features) {
  const routes = [];
  const module = inferFeatureFromPath(file, features);
  const classMapping = /@RequestMapping\s*\(\s*(?:value\s*=\s*)?["']([^"']+)["']/.exec(text);
  const classPrefix = classMapping?.[1] || '';
  const classMappingIndex = classMapping?.index ?? -1;
  const mappingRegex = /@(GetMapping|PostMapping|PutMapping|DeleteMapping|PatchMapping|RequestMapping)\s*(?:\(([^)]*)\))?/g;
  let match;
  while ((match = mappingRegex.exec(text))) {
    const annotation = match[1];
    const args = match[2] || '';
    const rawPath = extractFirstString(args);
    const methodOverride = args.match(/method\s*=\s*RequestMethod\.([A-Z]+)/)?.[1];
    const method = methodOverride || JAVA_MAPPING_METHODS[annotation];
    if (annotation === 'RequestMapping' && match.index === classMappingIndex) {
      continue;
    }
    if (!rawPath && annotation === 'RequestMapping') {
      continue;
    }
    routes.push({
      module,
      method,
      path: normalizeRoutePath(`${normalizeRoutePath(classPrefix)}${normalizeRoutePath(rawPath)}`.replace(/\/+/g, '/')),
      file,
      source: 'java-annotation'
    });
  }
  return routes;
}

function scanJsRoutes(file, text, features) {
  const routes = [];
  const module = inferFeatureFromPath(file, features);
  const routeRegex = /\b(?:router|app)\.(get|post|put|delete|patch)\s*\(\s*["']([^"']+)["']/g;
  let match;
  while ((match = routeRegex.exec(text))) {
    routes.push({
      module,
      method: match[1].toUpperCase(),
      path: normalizeRoutePath(match[2]),
      file,
      source: 'js-router'
    });
  }
  return routes;
}

export function buildBackendRouteScan() {
  const config = configuredPaths();
  const features = readFeatureRegistry();
  const files = listFilesUnderRoots(config.backendScanRoots, (file) => /\.(java|kt|js|ts)$/.test(file));
  const routes = files.flatMap((file) => {
    const text = readSafe(file);
    return [
      ...scanJavaRoutes(file, text, features),
      ...scanJsRoutes(file, text, features)
    ];
  });

  return {
    schemaVersion: 1,
    generatedBy: 'tools/scan-backend-routes.js',
    adapter: config.adapter,
    roots: config.backendScanRoots,
    modules: unique(features.filter((feature) => feature.status !== 'removed').map((feature) => feature.id)),
    routes
  };
}

export function runBackendRouteScan({ checkMode = false } = {}) {
  return writeGenerated('ai/generated/backend-routes.json', buildBackendRouteScan(), { checkMode });
}

if (isCli(import.meta.url)) {
  finish('scan:backend-routes', runBackendRouteScan({ checkMode: process.argv.includes('--check') }));
}
