import { finish, isCli, readJson, writeOrCheck } from '../tools/common.js';

export function buildModuleMapMarkdown() {
  const graph = readJson('graph/module-graph.json');
  const groups = new Map();
  for (const node of graph.nodes) {
    if (!groups.has(node.type)) {
      groups.set(node.type, []);
    }
    groups.get(node.type).push(node);
  }

  const lines = [
    '# Module Map',
    '',
    'Generated from `graph/module-graph.json`.',
    ''
  ];

  for (const [type, nodes] of groups) {
    lines.push(`## ${titleCase(type)}`, '');
    for (const node of nodes) {
      const displayPath = node.path.endsWith('.md') ? node.path : `${node.path}/`;
      lines.push(`- \`${node.id}\` (\`${displayPath}\`): ${node.description}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

function titleCase(value) {
  return value
    .split('-')
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(' ');
}

export function runSyncMemory({ checkMode = false } = {}) {
  const errors = [];
  writeOrCheck('memory/MODULE_MAP.md', buildModuleMapMarkdown(), checkMode, errors);
  return errors;
}

if (isCli(import.meta.url)) {
  finish('sync:memory', runSyncMemory({ checkMode: process.argv.includes('--check') }));
}
