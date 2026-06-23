import fs from 'node:fs';
import { ensure, finish, isCli, projectPath, readJson, readText } from '../tools/common.js';
import { validateChangeHandoffIntegrity } from '../tools/change-handoff-integrity-checker.js';
import { isAllowedByRoot } from '../tools/diff-checker.js';

const REQUIRED_FILES = [
  'request.md',
  'impact.json',
  'plan.md',
  'changed-files.json',
  'verification.md',
  'handover.md'
];

function currentChangeId() {
  try {
    return readJson('ai/changes/CURRENT_CHANGE.json').current || '';
  } catch {
    return '';
  }
}

function hasEvidence(text) {
  return text.includes('npm run') || text.includes('check') || text.includes('passed') || text.includes('failed');
}

function validateChangedFilesAgainstImpact({ changed, impact, dir, errors }) {
  ensure(Array.isArray(changed.files), `${dir}/changed-files.json files must be an array.`, errors);
  if (!Array.isArray(changed.files)) {
    return;
  }
  ensure(changed.files.length > 0, `${dir}/changed-files.json files must not be empty.`, errors);
  ensure(Array.isArray(impact.allowedEditRoots) && impact.allowedEditRoots.length > 0, `${dir}/impact.json must include allowedEditRoots.`, errors);
  if (!Array.isArray(impact.allowedEditRoots) || impact.allowedEditRoots.length === 0) {
    return;
  }
  for (const file of changed.files) {
    ensure(
      impact.allowedEditRoots.some((root) => isAllowedByRoot(file, root)),
      `${file} is outside ${dir}/impact.json allowedEditRoots.`,
      errors
    );
  }
}

export function validateChangeClose({ id = currentChangeId() } = {}) {
  const errors = [];
  ensure(Boolean(id), 'No change id provided and ai/changes/CURRENT_CHANGE.json has no current change.', errors);
  if (!id) {
    return errors;
  }
  const dir = `ai/changes/${id}`;
  for (const file of REQUIRED_FILES) {
    ensure(fs.existsSync(projectPath(dir, file)), `${dir}/${file} is missing.`, errors);
  }
  if (errors.length > 0) {
    return errors;
  }

  const changed = readJson(`${dir}/changed-files.json`);
  const impact = readJson(`${dir}/impact.json`);
  validateChangedFilesAgainstImpact({ changed, impact, dir, errors });
  const verification = readText(`${dir}/verification.md`);
  ensure(hasEvidence(verification), `${dir}/verification.md must include verification evidence.`, errors);
  const handover = readText(`${dir}/handover.md`);
  ensure(handover.trim().length > 20, `${dir}/handover.md must include a useful handover.`, errors);
  errors.push(...validateChangeHandoffIntegrity({ id }));
  return errors;
}

if (isCli(import.meta.url)) {
  const id = process.argv.slice(2).join(' ') || currentChangeId();
  finish('close:change', validateChangeClose({ id }));
}
