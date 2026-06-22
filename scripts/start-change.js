import fs from 'node:fs';
import path from 'node:path';
import { finish, formatJson, isCli, projectPath, writeOrCheck } from '../tools/common.js';
import { slugify } from './new-feature.js';

function timestamp() {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function changeId(title) {
  const slug = slugify(title).slice(0, 48) || 'change';
  return `CR-${timestamp()}-${slug}`;
}

function writeFile(relativePath, content) {
  const absolute = projectPath(relativePath);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, content);
}

export function startChange({ title, mode = 'update' }) {
  if (!title || !title.trim()) {
    return { id: '', errors: ['Change title is required.'] };
  }
  const id = changeId(title);
  const dir = `ai/changes/${id}`;
  writeFile(`${dir}/request.md`, `# Request\n\n${title.trim()}\n`);
  writeFile(`${dir}/impact.json`, formatJson({ schemaVersion: 1, mode, feature: '', affected: {}, blockers: [] }));
  writeFile(`${dir}/plan.md`, '# Plan\n\nCodex must fill this plan after running impact analysis.\n');
  writeFile(`${dir}/changed-files.json`, formatJson({ schemaVersion: 1, files: [] }));
  writeFile(`${dir}/verification.md`, '# Verification\n\n- Pending.\n');
  writeFile(`${dir}/handover.md`, '# Handover\n\nPending implementation and verification evidence.\n');
  writeOrCheck('ai/changes/CURRENT_CHANGE.json', formatJson({ schemaVersion: 1, current: id }), false, []);
  return { id, errors: [] };
}

function parseArgs(args) {
  const modeIndex = args.indexOf('--mode');
  const mode = modeIndex === -1 ? 'update' : args[modeIndex + 1] || 'update';
  const title = args.filter((arg, index) => arg !== '--mode' && !(modeIndex !== -1 && index === modeIndex + 1)).join(' ');
  return { title, mode };
}

if (isCli(import.meta.url)) {
  const { title, mode } = parseArgs(process.argv.slice(2));
  const { id, errors } = startChange({ title, mode });
  if (id) {
    console.log(`Created ${id}`);
  }
  finish('start:change', errors);
}
