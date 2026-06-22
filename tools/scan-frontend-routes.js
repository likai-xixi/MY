import { finish, isCli, listFiles, readText } from './common.js';
import { writeGenerated, readSafe } from './scan-utils.js';
import { parseFrontendModule } from './dependency-checker.js';
import { configuredPaths, inferFeatureFromPath, listFilesUnderRoots, readFeatureRegistry, unique } from './project-config.js';
import { extractRequestObjectCalls } from './scan-api-clients.js';

function scanGenericModuleContracts() {
  return listFiles('frontend/src/modules', (file) => file.endsWith('/module.ts'))
    .map((file) => ({ file, ...parseFrontendModule(readText(file)) }))
    .filter((item) => item.id);
}

function routeFromRuoyiView(file) {
  const match = file.match(/^ruoyi-ui\/src\/views\/(.+?)\.(vue|tsx|jsx|ts|js)$/);
  if (!match) {
    const dirMatch = file.match(/^ruoyi-ui\/src\/views\/(.+?)\/[^/]+\.(vue|tsx|jsx|ts|js)$/);
    return dirMatch ? `/${dirMatch[1]}`.replace(/\/index$/, '') : '';
  }
  return `/${match[1]}`.replace(/\/index$/, '');
}

function scanRuoyiViews(features) {
  return listFilesUnderRoots(['ruoyi-ui/src/views'], (file) => /\.(vue|tsx|jsx|ts|js)$/.test(file)).map((file) => {
    const text = readSafe(file);
    const module = inferFeatureFromPath(file, features);
    const route = routeFromRuoyiView(file);
    const apiMatches = unique([
      ...[...text.matchAll(/(?:request|axios\.(?:get|post|put|delete|patch)|fetch)\s*\(\s*["']([^"']+)["']/g)].map((match) => match[1]),
      ...extractRequestObjectCalls(text).map((call) => call.path)
    ]);
    return {
      module,
      route,
      api: unique(apiMatches),
      states: [],
      file,
      source: 'ruoyi-view'
    };
  }).filter((item) => item.route);
}

export function buildFrontendRouteScan() {
  const config = configuredPaths();
  const features = readFeatureRegistry();
  const moduleContracts = scanGenericModuleContracts();
  const ruoyiRoutes = config.adapter === 'ruoyi' ? scanRuoyiViews(features) : [];

  return {
    schemaVersion: 1,
    generatedBy: 'tools/scan-frontend-routes.js',
    adapter: config.adapter,
    roots: config.frontendModuleRoots,
    modules: unique([
      ...features.filter((feature) => feature.status !== 'removed').map((feature) => feature.id),
      ...moduleContracts.map((item) => item.id),
      ...ruoyiRoutes.map((item) => item.module)
    ]),
    routes: [
      ...moduleContracts.map((item) => ({
        module: item.id,
        route: item.route,
        api: item.api,
        states: item.states,
        file: item.file,
        source: 'module-contract'
      })),
      ...ruoyiRoutes
    ]
  };
}

export function runFrontendRouteScan({ checkMode = false } = {}) {
  return writeGenerated('ai/generated/frontend-routes.json', buildFrontendRouteScan(), { checkMode });
}

if (isCli(import.meta.url)) {
  finish('scan:frontend-routes', runFrontendRouteScan({ checkMode: process.argv.includes('--check') }));
}
