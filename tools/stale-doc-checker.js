import { ensure, fileExists, finish, isCli, readJson, readText } from './common.js';
import { parseApiCatalog } from './dependency-checker.js';

function readJsonSafe(relativePath, fallback, errors) {
  try {
    return readJson(relativePath);
  } catch (error) {
    errors.push(`${relativePath} is not readable JSON: ${error.message}`);
    return fallback;
  }
}

export function validateStaleDocs() {
  const errors = [];
  const registry = readJsonSafe('ai/registry/features.json', { features: [] }, errors);
  const apiGraph = readJsonSafe('graph/api-graph.json', { endpoints: [] }, errors);
  const uiGraph = readJsonSafe('graph/ui-graph.json', { screens: [] }, errors);
  const moduleMap = fileExists('memory/MODULE_MAP.md') ? readText('memory/MODULE_MAP.md') : '';
  const apiCatalog = fileExists('memory/API_CATALOG.md') ? parseApiCatalog(readText('memory/API_CATALOG.md')) : new Map();

  for (const feature of registry.features || []) {
    if (feature.status === 'removed') {
      continue;
    }
    ensure(moduleMap.includes(`feature:${feature.id}`), `memory/MODULE_MAP.md does not mention feature:${feature.id}.`, errors);
    if (feature.featureBrief && fileExists(feature.featureBrief)) {
      const brief = readText(feature.featureBrief);
      ensure(brief.includes('## Acceptance Criteria'), `${feature.featureBrief} must keep acceptance criteria.`, errors);
      ensure(brief.includes('## Verification'), `${feature.featureBrief} must keep verification guidance.`, errors);
    }
  }

  for (const endpoint of apiGraph.endpoints || []) {
    ensure(apiCatalog.has(endpoint.id), `memory/API_CATALOG.md is stale: missing ${endpoint.id}.`, errors);
  }
  for (const screen of uiGraph.screens || []) {
    const owner = (registry.features || []).find((feature) => feature.id === screen.module);
    ensure(Boolean(owner), `graph/ui-graph.json screen ${screen.id} has no matching feature registry owner.`, errors);
  }

  return errors;
}

if (isCli(import.meta.url)) {
  finish('check:stale-docs', validateStaleDocs());
}
