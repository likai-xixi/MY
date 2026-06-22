import path from 'node:path';
import {
  ensure,
  fileExists,
  finish,
  isCli,
  listDirectories,
  listFiles,
  readJson,
  readText
} from './common.js';
import { configuredPaths, inferFeatureFromPath, listFilesUnderRoots, readFeatureRegistry } from './project-config.js';

const FORBIDDEN_BACKEND_ROOT_LAYERS = [
  'backend/api',
  'backend/service',
  'backend/domain',
  'backend/repository'
];

const CODE_EXTENSIONS = new Set(['.java', '.js', '.jsx', '.ts', '.tsx', '.vue', '.kt', '.py']);
const DEFAULT_BACKEND_LAYERS = ['api', 'service', 'domain', 'repository'];
const DEFAULT_BOUNDARY_POLICY = {
  backend: {
    allowedLayers: DEFAULT_BACKEND_LAYERS,
    allowedModuleSubdirectories: DEFAULT_BACKEND_LAYERS,
    moduleSubdirectoryWhitelist: [],
    rootCodeWhitelist: []
  }
};

function isCodeFile(file) {
  return CODE_EXTENSIONS.has(path.extname(file).toLowerCase());
}

function readBoundaryPolicy({ readRule = readJson } = {}) {
  try {
    return readRule('ai/rules/module-boundary.json');
  } catch {
    return DEFAULT_BOUNDARY_POLICY;
  }
}

function backendPolicyFrom(policy = DEFAULT_BOUNDARY_POLICY) {
  const backend = policy.backend || {};
  const allowedLayers = Array.isArray(backend.allowedLayers) && backend.allowedLayers.length
    ? backend.allowedLayers
    : DEFAULT_BACKEND_LAYERS;
  const allowedModuleSubdirectories = Array.isArray(backend.allowedModuleSubdirectories) && backend.allowedModuleSubdirectories.length
    ? backend.allowedModuleSubdirectories
    : allowedLayers;
  return {
    allowedLayers,
    allowedModuleSubdirectories,
    moduleSubdirectoryWhitelist: Array.isArray(backend.moduleSubdirectoryWhitelist) ? backend.moduleSubdirectoryWhitelist : [],
    rootCodeWhitelist: Array.isArray(backend.rootCodeWhitelist) ? backend.rootCodeWhitelist : []
  };
}

function isWhitelistedModuleSubdirectory(module, subdirectory, whitelist) {
  const exactPath = `backend/modules/${module}/${subdirectory}`;
  const wildcardPath = `backend/modules/*/${subdirectory}`;
  return whitelist.some((entry) => entry === subdirectory || entry === exactPath || entry === wildcardPath);
}

function layerFromPath(file) {
  const match = file.match(/^backend\/modules\/([^/]+)\/(api|service|domain|repository)\//);
  return match ? { module: match[1], layer: match[2] } : null;
}

function containsLayerReference(text, module, layer) {
  return (
    text.includes(`backend/modules/${module}/${layer}`) ||
    text.includes(`backend\\modules\\${module}\\${layer}`) ||
    text.includes(`.${module}.${layer}.`) ||
    text.includes(`/${layer}/`) ||
    text.includes(`\\${layer}\\`)
  );
}

function referencedModules(text) {
  const modules = new Set();
  for (const match of text.matchAll(/backend[\\/]+modules[\\/]+([^\\/\s'"]+)/g)) {
    modules.add(match[1]);
  }
  return modules;
}

function validateGenericBackendLayout(file, policy, errors) {
  if (
    !file.startsWith('backend/') ||
    file.startsWith('backend/modules/') ||
    file.startsWith('backend/common/') ||
    policy.rootCodeWhitelist.includes(file)
  ) {
    return;
  }
  errors.push(`${file} is backend root code outside backend/modules/<slug>/{api,service,domain,repository}/ or backend/common/. Move business code into a registered module or add an explicit backend.rootCodeWhitelist entry in ai/rules/module-boundary.json.`);
}

function validateGenericBackendModuleSubdirectories({ directories = listDirectories, policy = readBoundaryPolicy() } = {}) {
  const errors = [];
  const backendPolicy = backendPolicyFrom(policy);
  const allowed = new Set(backendPolicy.allowedModuleSubdirectories);

  for (const module of directories('backend/modules')) {
    for (const subdirectory of directories(`backend/modules/${module}`)) {
      ensure(
        allowed.has(subdirectory) || isWhitelistedModuleSubdirectory(module, subdirectory, backendPolicy.moduleSubdirectoryWhitelist),
        `backend/modules/${module}/${subdirectory} is not an allowed backend module subdirectory. Use ${backendPolicy.allowedModuleSubdirectories.join(', ')} or register it in ai/rules/module-boundary.json backend.moduleSubdirectoryWhitelist.`,
        errors
      );
    }
  }

  return errors;
}

function validateGenericBackendBoundaries({ exists = fileExists, files = listFiles, read = readText, directories = listDirectories, policy = readBoundaryPolicy() } = {}) {
  const errors = [];
  const backendPolicy = backendPolicyFrom(policy);

  for (const forbidden of FORBIDDEN_BACKEND_ROOT_LAYERS) {
    ensure(!exists(forbidden), `${forbidden} is not allowed. Use backend/modules/<slug>/{api,service,domain,repository}/.`, errors);
  }

  errors.push(...validateGenericBackendModuleSubdirectories({ directories, policy }));

  const backendFiles = files('backend', (file) => isCodeFile(file));
  for (const file of backendFiles) {
    const text = read(file);
    validateGenericBackendLayout(file, backendPolicy, errors);

    if (file.startsWith('backend/common/')) {
      ensure(!/backend[\\/]+modules[\\/]+/.test(text), `${file} must not import from backend/modules/<slug>/.`, errors);
    }

    const info = layerFromPath(file);
    if (!info) {
      continue;
    }

    for (const referenced of referencedModules(text)) {
      ensure(referenced === info.module, `${file} must not import another module internals (${referenced}). Use an explicit contract edge instead.`, errors);
    }

    if (info.layer === 'domain') {
      for (const forbiddenLayer of ['api', 'service', 'repository']) {
        ensure(!containsLayerReference(text, info.module, forbiddenLayer), `${file} domain layer must not depend on ${forbiddenLayer}.`, errors);
      }
    }

    if (info.layer === 'api') {
      ensure(!containsLayerReference(text, info.module, 'repository'), `${file} api layer must not depend on repository. Route through service/domain boundaries.`, errors);
    }

    if (info.layer === 'repository') {
      for (const forbiddenLayer of ['api', 'service']) {
        ensure(!containsLayerReference(text, info.module, forbiddenLayer), `${file} repository layer must not depend on ${forbiddenLayer}.`, errors);
      }
    }
  }

  return errors;
}

function javaImportFeatureReferences(text, features) {
  const out = new Set();
  for (const feature of features) {
    const tokens = [feature.id, feature.id.replace(/-/g, '_'), feature.id.replace(/-/g, '')].filter(Boolean);
    if (tokens.some((token) => text.includes(`.business.${token}.`) || text.includes(`/business/${token}/`) || text.includes(`.system.${token}.`) || text.includes(`/system/${token}/`))) {
      out.add(feature.id);
    }
  }
  return out;
}

function validateRuoyiBackendBoundaries({ read = readText } = {}) {
  const errors = [];
  const config = configuredPaths();
  const features = readFeatureRegistry().filter((feature) => feature.status !== 'removed');
  const backendFiles = listFilesUnderRoots(config.backendScanRoots, (file) => isCodeFile(file));
  for (const file of backendFiles) {
    const text = read(file);
    const owner = inferFeatureFromPath(file, features);
    if (file.startsWith('ruoyi-common/') || file.startsWith('ruoyi-framework/')) {
      ensure(javaImportFeatureReferences(text, features).size === 0, `${file} is shared RuoYi infrastructure and must not depend on feature-owned business packages.`, errors);
    }
    if (!owner) {
      continue;
    }
    for (const referenced of javaImportFeatureReferences(text, features)) {
      ensure(referenced === owner, `${file} must not import another feature package (${referenced}). Use an explicit API/service contract.`, errors);
    }
  }
  return errors;
}

function frontendModuleFromPath(file) {
  const match = file.match(/^frontend\/src\/modules\/([^/]+)\//);
  return match ? match[1] : '';
}

function referencedFrontendModules(text) {
  const modules = new Set();
  for (const match of text.matchAll(/frontend[\\/]src[\\/]modules[\\/]([^\\/\s'"]+)/g)) {
    modules.add(match[1]);
  }
  return modules;
}

function validateGenericFrontendBoundaries({ files = listFiles, read = readText } = {}) {
  const errors = [];
  const frontendFiles = files('frontend/src', (file) => isCodeFile(file));

  for (const file of frontendFiles) {
    const text = read(file);
    if (file.startsWith('frontend/src/components/')) {
      ensure(!/frontend[\\/]src[\\/]modules[\\/]/.test(text), `${file} must not import from frontend/src/modules/<slug>/. Shared components cannot depend on business modules.`, errors);
    }

    const module = frontendModuleFromPath(file);
    if (!module) {
      continue;
    }
    for (const referenced of referencedFrontendModules(text)) {
      ensure(referenced === module, `${file} must not import another frontend module internals (${referenced}). Use shared components, shared state, or an explicit API contract.`, errors);
    }
  }

  return errors;
}

function validateRuoyiFrontendBoundaries({ read = readText } = {}) {
  const errors = [];
  const config = configuredPaths();
  const features = readFeatureRegistry().filter((feature) => feature.status !== 'removed');
  const frontendFiles = listFilesUnderRoots(config.frontendScanRoots, (file) => isCodeFile(file));
  for (const file of frontendFiles) {
    const text = read(file);
    if (file.startsWith('ruoyi-ui/src/components/')) {
      ensure(!/ruoyi-ui[\\/]src[\\/]views[\\/]/.test(text), `${file} must not import from ruoyi-ui/src/views/<feature>/. Shared components cannot depend on business pages.`, errors);
    }
    const owner = inferFeatureFromPath(file, features);
    if (!owner) {
      continue;
    }
    for (const feature of features) {
      if (feature.id === owner) {
        continue;
      }
      if (text.includes(`@/views/${feature.id}/`) || text.includes(`@/api/${feature.id}`)) {
        errors.push(`${file} must not import another RuoYi feature internals (${feature.id}). Use shared components or an explicit API contract.`);
      }
    }
  }
  return errors;
}

export function validateBackendBoundaries(options = {}) {
  const config = configuredPaths();
  return config.adapter === 'ruoyi'
    ? [...validateGenericBackendBoundaries(options), ...validateRuoyiBackendBoundaries(options)]
    : validateGenericBackendBoundaries(options);
}

export function validateFrontendBoundaries(options = {}) {
  const config = configuredPaths();
  return config.adapter === 'ruoyi'
    ? [...validateGenericFrontendBoundaries(options), ...validateRuoyiFrontendBoundaries(options)]
    : validateGenericFrontendBoundaries(options);
}

export function validateBoundaries() {
  return [
    ...validateBackendBoundaries(),
    ...validateFrontendBoundaries()
  ];
}

if (isCli(import.meta.url)) {
  finish('check:boundaries', validateBoundaries());
}
