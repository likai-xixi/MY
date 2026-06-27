import { ensure, fileExists, finish, isCli, readJson } from './common.js';

const OWNERSHIP_KEYS = [
  'backend',
  'frontend',
  'api',
  'ui',
  'database',
  'permissions',
  'menus',
  'components',
  'tests',
  'docs',
  'apiClients',
  'controllers',
  'services',
  'mappers',
  'domainObjects'
];

const TOP_LEVEL_TO_OWNERSHIP = [
  ['backendModules', 'backend'],
  ['frontendModules', 'frontend'],
  ['apis', 'api'],
  ['screens', 'ui'],
  ['dbTables', 'database'],
  ['permissions', 'permissions'],
  ['components', 'components'],
  ['tests', 'tests'],
  ['docs', 'docs'],
  ['apiClients', 'apiClients'],
  ['controllers', 'controllers'],
  ['services', 'services'],
  ['mappers', 'mappers'],
  ['domainObjects', 'domainObjects'],
  ['menuSqlFiles', 'menus'],
  ['permissionFiles', 'permissions'],
  ['sqlFiles', 'database'],
  ['mapperXmlFiles', 'mappers']
];

function unique(items) {
  return [...new Set((items || []).filter(Boolean))];
}

const FILE_PATH_PREFIXES = [
  'ai/',
  'backend/',
  'bin/',
  'doc/',
  'docs/',
  'features/',
  'frontend/',
  'graph/',
  'memory/',
  'prompts/',
  'ruoyi-',
  'scripts/',
  'sql/',
  'templates/',
  'tests/',
  'tools/'
];

function isPathLike(value = '') {
  const normalized = String(value).replace(/\\/g, '/').replace(/^\.\//, '');
  if (!normalized || normalized.startsWith('/') || normalized.startsWith('@/') || normalized.includes('://')) {
    return false;
  }
  if (FILE_PATH_PREFIXES.some((prefix) => normalized.startsWith(prefix))) {
    return true;
  }
  return /^(pom\.xml|ry\.bat|ry\.sh)$/.test(normalized) || /\.(md|js|ts|tsx|jsx|vue|java|xml|sql|json|yml|yaml)$/i.test(normalized);
}

function ensureArray(object, key, label, errors) {
  if (!Array.isArray(object[key])) {
    errors.push(`${label}.${key} must be an array.`);
    return [];
  }
  return object[key];
}

function readGeneratedPermissionMap(readJsonFile, errors) {
  let generated;
  try {
    generated = readJsonFile('ai/generated/permissions.json');
  } catch (error) {
    errors.push(`ai/generated/permissions.json is missing or invalid: ${error.message}`);
    return new Map();
  }
  if (!Array.isArray(generated.permissions)) {
    errors.push('ai/generated/permissions.json permissions must be an array.');
    return new Map();
  }

  const byCode = new Map();
  for (const permission of generated.permissions) {
    if (!permission?.code) {
      continue;
    }
    const modules = byCode.get(permission.code) || new Set();
    if (permission.module) {
      modules.add(permission.module);
    }
    byCode.set(permission.code, modules);
  }
  return byCode;
}

function validateFeaturePermissionsInGenerated(feature, generatedPermissions, errors) {
  for (const permission of feature.permissions || []) {
    if (!generatedPermissions.has(permission)) {
      errors.push(`feature ${feature.id}.permissions item ${permission} is missing from ai/generated/permissions.json.`);
    }
  }
}

export function validateOwnership({ readJsonFile = readJson, exists = fileExists } = {}) {
  const errors = [];
  let registry;
  try {
    registry = readJsonFile('ai/registry/features.json');
  } catch (error) {
    return [`ai/registry/features.json is missing or invalid: ${error.message}`];
  }
  const generatedPermissions = readGeneratedPermissionMap(readJsonFile, errors);

  for (const feature of registry.features || []) {
    if (feature.status === 'removed') {
      continue;
    }
    ensure(Boolean(feature.ownership && typeof feature.ownership === 'object' && !Array.isArray(feature.ownership)), `feature ${feature.id} must include ownership object.`, errors);
    const ownership = feature.ownership || {};
    for (const key of OWNERSHIP_KEYS) {
      ensureArray(ownership, key, `feature ${feature.id}.ownership`, errors);
    }

    for (const [field, ownershipKey] of TOP_LEVEL_TO_OWNERSHIP) {
      const declared = feature[field] || [];
      if (!Array.isArray(declared)) {
        errors.push(`feature ${feature.id}.${field} must be an array.`);
        continue;
      }
      const owned = new Set(ownership[ownershipKey] || []);
      for (const item of declared) {
        ensure(owned.has(item), `feature ${feature.id}.${field} item ${item} is missing from ownership.${ownershipKey}.`, errors);
      }
    }

    const ownedPaths = unique(OWNERSHIP_KEYS.flatMap((key) => ownership[key] || []).filter(isPathLike));
    for (const ownedPath of ownedPaths) {
      ensure(exists(ownedPath), `feature ${feature.id} ownership path does not exist: ${ownedPath}.`, errors);
    }
    validateFeaturePermissionsInGenerated(feature, generatedPermissions, errors);
  }
  return unique(errors);
}

if (isCli(import.meta.url)) {
  finish('check:ownership', validateOwnership());
}
