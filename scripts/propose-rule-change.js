import fs from 'node:fs';
import path from 'node:path';
import { finish, formatJson, isCli, projectPath } from '../tools/common.js';

function slug(value) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'rule-upgrade';
}

export function proposeRuleChange({ title = '', reason = '' } = {}) {
  if (!title.trim()) {
    return ['Rule proposal title is required.'];
  }
  const id = `${new Date().toISOString().slice(0, 10)}-${slug(title)}`;
  const file = `ai/rule-proposals/${id}.json`;
  const content = {
    schemaVersion: 1,
    id,
    title,
    reason: reason || 'Describe why the current scanner or module convention does not match the real project base.',
    status: 'proposed',
    requiredChangeMode: 'rule-change',
    checklist: [
      'Explain old rule and new rule.',
      'List affected scanners and registries.',
      'List sample files proving the project base needs this rule.',
      'Run npm run check after the rule proposal is accepted.'
    ]
  };
  fs.mkdirSync(path.dirname(projectPath(file)), { recursive: true });
  fs.writeFileSync(projectPath(file), formatJson(content));
  console.log(`Created ${file}`);
  return [];
}

if (isCli(import.meta.url)) {
  const args = process.argv.slice(2);
  const reasonIndex = args.indexOf('--reason');
  const reason = reasonIndex === -1 ? '' : args[reasonIndex + 1] || '';
  const title = args.filter((arg, index) => {
    if (arg === '--reason') {
      return false;
    }
    if (reasonIndex !== -1 && index === reasonIndex + 1) {
      return false;
    }
    return true;
  }).join(' ');
  finish('rule:propose', proposeRuleChange({ title, reason }));
}
