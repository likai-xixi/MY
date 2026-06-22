import { finish, isCli } from './common.js';
import { readSafe, writeGenerated } from './scan-utils.js';
import { configuredPaths, inferFeatureFromPath, listFilesUnderRoots, readFeatureRegistry } from './project-config.js';

const PERMISSION_REGEX = /\b[a-z][a-z0-9-]*:[a-z][a-z0-9-]*(?::[a-z][a-z0-9-]*)+\b/g;

export function buildPermissionScan() {
  const config = configuredPaths();
  const features = readFeatureRegistry();
  const files = listFilesUnderRoots(config.permissionScanRoots, (file) => /\.(java|kt|ts|tsx|js|jsx|vue|xml|sql|yml|yaml)$/.test(file));
  const permissions = [];
  for (const file of files) {
    const text = readSafe(file);
    for (const match of text.matchAll(PERMISSION_REGEX)) {
      permissions.push({ code: match[0], module: inferFeatureFromPath(file, features), file });
    }
  }

  return {
    schemaVersion: 1,
    generatedBy: 'tools/scan-permissions.js',
    adapter: config.adapter,
    roots: config.permissionScanRoots,
    permissions
  };
}

export function runPermissionScan({ checkMode = false } = {}) {
  return writeGenerated('ai/generated/permissions.json', buildPermissionScan(), { checkMode });
}

if (isCli(import.meta.url)) {
  finish('scan:permissions', runPermissionScan({ checkMode: process.argv.includes('--check') }));
}
