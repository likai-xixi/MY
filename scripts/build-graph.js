import path from 'node:path';
import {
  finish,
  formatJson,
  isCli,
  listDirectories,
  listFiles,
  readText,
  writeOrCheck
} from '../tools/common.js';
import { configuredPaths, readFeatureRegistry, unique } from '../tools/project-config.js';

const BASE_NODES = [
  { id: 'agents', type: 'governance', path: 'agents', description: 'Role contracts used by Codex App.' },
  { id: 'memory', type: 'governance', path: 'memory', description: 'Persistent project state, handoff, changelog, module map, and API catalog.' },
  { id: 'graph', type: 'governance', path: 'graph', description: 'Structured module, API, and UI relationship data.' },
  { id: 'tools', type: 'governance', path: 'tools', description: 'Local validation and repository hygiene commands.' },
  { id: 'ai', type: 'governance', path: 'ai', description: 'Machine-readable Codex registries, change records, generated scans, and rules.' },
  { id: 'scripts', type: 'governance', path: 'scripts', description: 'Generated artifact helpers.' },
  { id: 'backend', type: 'business', path: 'backend', description: 'Backend business modules.' },
  { id: 'frontend', type: 'business', path: 'frontend', description: 'Frontend business modules.' },
  { id: 'features', type: 'business', path: 'features', description: 'Business feature briefs and acceptance criteria.' }
];

const BASE_EDGES = [
  { from: 'agents', to: 'memory', type: 'updates' },
  { from: 'agents', to: 'backend', type: 'routes-work' },
  { from: 'agents', to: 'frontend', type: 'routes-work' },
  { from: 'scripts', to: 'graph', type: 'generates' },
  { from: 'scripts', to: 'memory', type: 'generates' },
  { from: 'scripts', to: 'ai', type: 'generates' },
  { from: 'tools', to: 'agents', type: 'validates' },
  { from: 'tools', to: 'graph', type: 'validates' },
  { from: 'tools', to: 'ai', type: 'validates' },
  { from: 'features', to: 'backend', type: 'drives' },
  { from: 'features', to: 'frontend', type: 'drives' }
];

function titleFromSlug(slug) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(' ');
}

function featureSlug(featurePath) {
  return path.basename(featurePath, '.md');
}

function readFeatureTitle(featurePath, slug) {
  const match = readText(featurePath).match(/^#\s+(.+)$/m);
  return match ? match[1].replace(/^Feature Brief:\s*/i, '') : titleFromSlug(slug);
}

function addUnique(items, item, keyFn) {
  const key = keyFn(item);
  if (!items.some((existing) => keyFn(existing) === key)) {
    items.push(item);
  }
}

function edgeKey(edge) {
  return `${edge.from}->${edge.to}:${edge.type}`;
}

function addModuleNode({ nodes, edges, featureId, type, modulePath, featureFiles }) {
  const nodeId = `${type}:${featureId}`;
  addUnique(nodes, {
    id: nodeId,
    type: `${type}-module`,
    path: modulePath,
    description: `${titleFromSlug(featureId)} ${type} module.`
  }, (node) => node.id);
  addUnique(edges, { from: type, to: nodeId, type: 'contains' }, edgeKey);
  if (featureFiles.some((file) => featureSlug(file) === featureId)) {
    addUnique(edges, { from: `feature:${featureId}`, to: nodeId, type: 'implements' }, edgeKey);
  }
}

export function buildModuleGraph() {
  const config = configuredPaths();
  const nodes = [...BASE_NODES];
  const edges = [...BASE_EDGES];
  const featureFiles = listFiles('features', (file) => file.endsWith('.md') && !file.endsWith('/_template.md'));
  const registryFeatures = readFeatureRegistry().filter((feature) => feature.status !== 'removed');

  for (const file of featureFiles) {
    const slug = featureSlug(file);
    const title = readFeatureTitle(file, slug);
    addUnique(nodes, { id: `feature:${slug}`, type: 'feature', path: file, description: `${title} feature brief.` }, (node) => node.id);
    addUnique(edges, { from: 'features', to: `feature:${slug}`, type: 'contains' }, edgeKey);
  }

  const backendByFeature = new Map();
  const frontendByFeature = new Map();
  for (const feature of registryFeatures) {
    const backendPath = (feature.backendModules || [])[0];
    const frontendPath = (feature.frontendModules || [])[0];
    if (backendPath) {
      backendByFeature.set(feature.id, backendPath);
    }
    if (frontendPath) {
      frontendByFeature.set(feature.id, frontendPath);
    }
  }

  if (config.adapter === 'generic') {
    for (const slug of listDirectories('backend/modules')) {
      backendByFeature.set(slug, `backend/modules/${slug}`);
    }
    for (const slug of listDirectories('frontend/src/modules')) {
      frontendByFeature.set(slug, `frontend/src/modules/${slug}`);
    }
  }

  for (const [featureId, modulePath] of [...backendByFeature.entries()].sort()) {
    addModuleNode({ nodes, edges, featureId, type: 'backend', modulePath, featureFiles });
  }
  for (const [featureId, modulePath] of [...frontendByFeature.entries()].sort()) {
    addModuleNode({ nodes, edges, featureId, type: 'frontend', modulePath, featureFiles });
  }

  return {
    schemaVersion: 1,
    generatedBy: 'scripts/build-graph.js',
    adapter: config.adapter,
    nodes,
    edges
  };
}

function mermaidId(id) {
  return id.replace(/[^a-zA-Z0-9_]/g, '_');
}

export function buildRenderGraphMermaid(graph = buildModuleGraph()) {
  const lines = ['graph TD'];
  for (const node of graph.nodes) {
    lines.push(`  ${mermaidId(node.id)}["${node.path}"]`);
  }
  for (const edge of graph.edges) {
    lines.push(`  ${mermaidId(edge.from)} -->|${edge.type}| ${mermaidId(edge.to)}`);
  }
  return `${lines.join('\n')}\n`;
}

export function runBuildGraph({ checkMode = false } = {}) {
  const errors = [];
  const graph = buildModuleGraph();
  writeOrCheck('graph/module-graph.json', formatJson(graph), checkMode, errors);
  writeOrCheck('graph/render-graph.mmd', buildRenderGraphMermaid(graph), checkMode, errors);
  return errors;
}

if (isCli(import.meta.url)) {
  finish('build:graph', runBuildGraph({ checkMode: process.argv.includes('--check') }));
}
