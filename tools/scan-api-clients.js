import { finish, isCli, listFiles, readText } from './common.js';
import { readSafe, writeGenerated } from './scan-utils.js';
import { parseFrontendModule } from './dependency-checker.js';
import { configuredPaths, inferFeatureFromPath, listFilesUnderRoots, readFeatureRegistry } from './project-config.js';

export function extractRequestObjectCalls(text = '') {
  const calls = [];
  const requestObjectRegex = /\b(?:request|axios)\s*\(\s*\{([\s\S]*?)\n?\s*\}\s*\)/g;
  let match;
  while ((match = requestObjectRegex.exec(text))) {
    const body = match[1] || '';
    const url = body.match(/\burl\s*:\s*[`\"']([^`\"']+)[`\"']/)?.[1] || '';
    const method = body.match(/\bmethod\s*:\s*[`\"']([^`\"']+)[`\"']/)?.[1] || 'ANY';
    if (url) {
      calls.push({ path: url, method: method.toUpperCase(), source: 'request-object' });
    }
  }
  return calls;
}

function scanTextClientCalls(file, text, features) {
  const calls = [];
  const module = inferFeatureFromPath(file, features);
  const fetchRegex = /\b(?:fetch|request|axios\.(?:get|post|put|delete|patch))\s*\(\s*["']([^"']+)["']/g;
  let match;
  while ((match = fetchRegex.exec(text))) {
    calls.push({
      module,
      path: match[1],
      file,
      method: 'ANY',
      source: 'client-call'
    });
  }
  for (const call of extractRequestObjectCalls(text)) {
    calls.push({ module, file, ...call });
  }
  const seen = new Set();
  return calls.filter((call) => {
    const key = `${call.module}:${call.path}:${call.method}:${call.file}:${call.source}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function buildApiClientScan() {
  const config = configuredPaths();
  const features = readFeatureRegistry();
  const files = listFilesUnderRoots(config.frontendScanRoots, (file) => /\.(ts|tsx|js|jsx|vue)$/.test(file));
  const calls = files.flatMap((file) => scanTextClientCalls(file, readSafe(file), features));
  const moduleContracts = listFiles('frontend/src/modules', (file) => file.endsWith('/module.ts'))
    .map((file) => ({ file, ...parseFrontendModule(readText(file)) }))
    .filter((item) => item.id && item.api)
    .map((item) => ({
      module: item.id,
      api: item.api,
      file: item.file,
      source: 'module-contract'
    }));

  return {
    schemaVersion: 1,
    generatedBy: 'tools/scan-api-clients.js',
    adapter: config.adapter,
    roots: config.frontendScanRoots,
    calls,
    moduleContracts
  };
}

export function runApiClientScan({ checkMode = false } = {}) {
  return writeGenerated('ai/generated/api-clients.json', buildApiClientScan(), { checkMode });
}

if (isCli(import.meta.url)) {
  finish('scan:api-clients', runApiClientScan({ checkMode: process.argv.includes('--check') }));
}
