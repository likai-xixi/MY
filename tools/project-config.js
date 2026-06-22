import path from 'node:path';
import { fileExists, listDirectories, listFiles, readJson } from './common.js';

export function unique(items) {
  return [...new Set((items || []).filter(Boolean))];
}

export function readProfile() {
  try {
    return readJson('ai/project-profile.json');
  } catch {
    return { schemaVersion: 1, adapter: 'generic', locked: false };
  }
}

export function activeAdapterName() {
  return readProfile().adapter || 'generic';
}

export function isRuoyiProfile() {
  return activeAdapterName() === 'ruoyi';
}

export function pascalCase(value = '') {
  return String(value)
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join('');
}

export function javaPackageSegment(featureId = '') {
  return String(featureId)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function normalizePath(value = '') {
  return String(value).replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/+$/g, '');
}

export function directoryOf(file) {
  return normalizePath(path.dirname(file));
}

export function configuredPaths() {
  if (isRuoyiProfile()) {
    return {
      adapter: 'ruoyi',
      backendModuleRoots: [
        'ruoyi-business/src/main/java/com/ruoyi/business',
        'ruoyi-system/src/main/java/com/ruoyi/system',
        'ruoyi-admin/src/main/java/com/ruoyi/web/controller/business'
      ],
      backendScanRoots: [
        'ruoyi-admin/src/main/java',
        'ruoyi-business/src/main/java',
        'ruoyi-generator/src/main/java',
        'ruoyi-quartz/src/main/java',
        'ruoyi-system/src/main/java',
        'backend/modules'
      ],
      frontendModuleRoots: [
        'ruoyi-ui/src/views',
        'ruoyi-ui/src/api',
        'frontend/src/modules'
      ],
      frontendScanRoots: [
        'ruoyi-ui/src',
        'frontend/src'
      ],
      sharedComponentRoots: [
        'ruoyi-ui/src/components',
        'frontend/src/components'
      ],
      dbScanRoots: [
        'sql',
        'ruoyi-admin/sql',
        'ruoyi-business/src/main/resources/mapper',
        'ruoyi-generator/src/main/resources/mapper',
        'ruoyi-quartz/src/main/resources/mapper',
        'ruoyi-system/src/main/resources/mapper',
        'db',
        'backend'
      ],
      permissionScanRoots: [
        'ruoyi-admin/src/main/java',
        'ruoyi-business/src/main/java',
        'ruoyi-generator/src/main/java',
        'ruoyi-quartz/src/main/java',
        'ruoyi-system/src/main/java',
        'ruoyi-ui/src',
        'sql',
        'ruoyi-admin/sql',
        'backend',
        'frontend/src',
        'db'
      ],
      featurePathBuilder: ruoyiFeaturePaths
    };
  }

  return {
    adapter: 'generic',
    backendModuleRoots: ['backend/modules'],
    backendScanRoots: ['backend/modules'],
    frontendModuleRoots: ['frontend/src/modules'],
    frontendScanRoots: ['frontend/src'],
    sharedComponentRoots: ['frontend/src/components'],
    dbScanRoots: ['db', 'backend'],
    permissionScanRoots: ['backend', 'frontend/src', 'db'],
    featurePathBuilder: genericFeaturePaths
  };
}

export function genericFeaturePaths({ id }) {
  return {
    adapter: 'generic',
    featureBrief: `features/${id}.md`,
    backendModules: [`backend/modules/${id}`],
    frontendModules: [`frontend/src/modules/${id}`],
    backendLayerRoots: ['api', 'service', 'domain', 'repository'].map((layer) => `backend/modules/${id}/${layer}`),
    frontendRouteRoot: `frontend/src/modules/${id}`,
    frontendApiFiles: [],
    sqlFiles: [],
    menuSqlFiles: [],
    permissionFiles: [],
    generatedOwnershipFiles: [
      `ai/contracts/${id}.api.md`,
      `ai/contracts/${id}.ui.md`,
      `ai/contracts/${id}.db.md`,
      `ai/contracts/${id}.permission.md`,
      `ai/contracts/${id}.delete-ownership.md`
    ]
  };
}

export function ruoyiFeaturePaths({ id }) {
  const javaSegment = javaPackageSegment(id);
  const pascal = pascalCase(id);
  return {
    adapter: 'ruoyi',
    featureBrief: `features/${id}.md`,
    backendModules: [
      `ruoyi-business/src/main/java/com/ruoyi/business/${javaSegment}`,
      `ruoyi-admin/src/main/java/com/ruoyi/web/controller/business/${javaSegment}`
    ],
    frontendModules: [
      `ruoyi-ui/src/views/${id}`,
      `ruoyi-ui/src/api/${id}.contract.md`
    ],
    backendLayerRoots: [
      `ruoyi-business/src/main/java/com/ruoyi/business/${javaSegment}/domain`,
      `ruoyi-business/src/main/java/com/ruoyi/business/${javaSegment}/mapper`,
      `ruoyi-business/src/main/java/com/ruoyi/business/${javaSegment}/service`,
      `ruoyi-business/src/main/java/com/ruoyi/business/${javaSegment}/service/impl`,
      `ruoyi-admin/src/main/java/com/ruoyi/web/controller/business/${javaSegment}`
    ],
    frontendRouteRoot: `ruoyi-ui/src/views/${id}`,
    frontendApiFiles: [`ruoyi-ui/src/api/${id}.contract.md`],
    sqlFiles: [`sql/${id}.ownership.md`],
    mapperXmlFiles: [
      `ruoyi-business/src/main/resources/mapper/business/${pascal}Mapper.xml`,
      `ruoyi-system/src/main/resources/mapper/business/${pascal}Mapper.xml`
    ],
    menuSqlFiles: [`sql/${id}.ownership.md`],
    permissionFiles: [`sql/${id}.ownership.md`],
    generatedOwnershipFiles: [
      `ai/contracts/${id}.api.md`,
      `ai/contracts/${id}.ui.md`,
      `ai/contracts/${id}.db.md`,
      `ai/contracts/${id}.permission.md`,
      `ai/contracts/${id}.delete-ownership.md`,
      `ruoyi-business/src/main/java/com/ruoyi/business/${javaSegment}/README.md`,
      `ruoyi-admin/src/main/java/com/ruoyi/web/controller/business/${javaSegment}/README.md`,
      `ruoyi-ui/src/views/${id}/README.md`,
      `ruoyi-ui/src/api/${id}.contract.md`,
      `sql/${id}.ownership.md`
    ],
    javaSegment,
    pascal
  };
}

export function featurePaths({ id }) {
  return configuredPaths().featurePathBuilder({ id });
}

export function listFilesUnderRoots(roots, predicate = () => true) {
  return unique((roots || []).flatMap((root) => listFiles(root, predicate)));
}

export function listDirectoriesUnderRoots(roots) {
  return unique((roots || []).flatMap((root) => {
    try {
      return listDirectories(root).map((name) => `${normalizePath(root)}/${name}`);
    } catch {
      return [];
    }
  }));
}

export function readFeatureRegistry() {
  try {
    return readJson('ai/registry/features.json').features || [];
  } catch {
    return [];
  }
}

function fileMatchesFeaturePath(file, featurePath) {
  const normalizedFile = normalizePath(file);
  const normalizedPath = normalizePath(featurePath);
  return normalizedFile === normalizedPath || normalizedFile.startsWith(`${normalizedPath}/`);
}

export function inferFeatureFromPath(file, features = readFeatureRegistry()) {
  const normalized = normalizePath(file);
  let bestMatch = null;
  for (const feature of features) {
    const ownedPaths = unique([
      feature.featureBrief,
      ...(feature.backendModules || []),
      ...(feature.frontendModules || []),
      ...(feature.tests || []),
      ...(feature.docs || []),
      ...(feature.sqlFiles || []),
      ...(feature.menuSqlFiles || []),
      ...(feature.permissionFiles || [])
    ]);
    for (const ownedPath of ownedPaths) {
      const candidate = normalizePath(ownedPath);
      if (!fileMatchesFeaturePath(normalized, candidate)) {
        continue;
      }
      if (!bestMatch || candidate.length > bestMatch.path.length) {
        bestMatch = { id: feature.id, path: candidate };
      }
    }
  }
  if (bestMatch) {
    return bestMatch.id;
  }

  const pathParts = normalized.split('/');
  for (const feature of features) {
    const id = feature.id || '';
    const javaSegment = javaPackageSegment(id);
    const pascal = pascalCase(id);
    if (pathParts.includes(id) || pathParts.includes(javaSegment) || path.basename(normalized).includes(pascal)) {
      return id;
    }
  }

  const genericMatch = normalized.match(/^backend\/modules\/([^/]+)\//) || normalized.match(/^frontend\/src\/modules\/([^/]+)\//);
  if (genericMatch) {
    return genericMatch[1];
  }

  const ruoyiViewMatch = normalized.match(/^ruoyi-ui\/src\/views\/([^/]+)/);
  if (ruoyiViewMatch) {
    return ruoyiViewMatch[1];
  }
  const ruoyiApiMatch = normalized.match(/^ruoyi-ui\/src\/api\/([^/.]+)/);
  if (ruoyiApiMatch) {
    return ruoyiApiMatch[1];
  }
  return '';
}

export function existingSharedComponentRoot() {
  return configuredPaths().sharedComponentRoots.find((root) => fileExists(root)) || configuredPaths().sharedComponentRoots[0];
}

export function existingFrontendRoots() {
  return configuredPaths().frontendScanRoots.filter((root) => fileExists(root));
}

export function existingBackendRoots() {
  return configuredPaths().backendScanRoots.filter((root) => fileExists(root));
}
