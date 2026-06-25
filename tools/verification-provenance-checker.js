import {
  currentChangeId,
  emptyResult,
  issue,
  parseRootArg,
  pathExists,
  printIssues,
  readText,
  sectionLineRecords,
  workflowRunSteps
} from './governance-checker-utils.js';

const PROVENANCE_TAG = /\[(local|ci|ci-planned|runtime-local|runtime-ci|not-run|inconclusive)\]/i;
const CI_TAG = /\[ci\]|\[runtime-ci\]/i;
const COMMAND_OR_SCOPE = /(npm run check|npm test|node --test|mvn\b|maven|frontend build|build:prod|npm --prefix ruoyi-ui run build:prod|runtime api|runtime db|github actions|ci-planned|git diff --check)/i;
const RESULT_SEMANTICS = /\b(passed|verified|succeeded|failed|completed|done|ok)\b|通过|完成|成功|已验证|失败/i;

function commandParts(command) {
  return String(command || '')
    .split(/\r?\n|&&|;/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function isMavenCompileCommand(command) {
  return commandParts(command).some((line) => /^(?:\.\/)?mvnw(?:\.cmd)?\b|^mvn(?:\.cmd)?\b/i.test(line)
    && /(?:^|\s)-pl\s+ruoyi-admin(?:\s|$)/i.test(line)
    && /(?:^|\s)-am(?:\s|$)/i.test(line)
    && /(?:^|\s)-DskipTests(?:\s|$)/i.test(line)
    && /(?:^|\s)compile(?:\s|$)/i.test(line));
}

function isFrontendBuildCommand(step) {
  return commandParts(step.command).some((line) => /^npm\s+--prefix\s+ruoyi-ui\s+run\s+build:prod(?:\s|$)/i.test(line)
    || (/^npm\s+run\s+build:prod(?:\s|$)/i.test(line)
      && step.workingDirectory.replace(/\\/g, '/') === 'ruoyi-ui'));
}

function workflowHasMaven(root) {
  return workflowRunSteps(root).some((step) => isMavenCompileCommand(step.command));
}

function workflowHasFrontend(root) {
  return workflowRunSteps(root).some((step) => isFrontendBuildCommand(step));
}

function workflowHasCheck(root) {
  return workflowRunSteps(root).some((step) => commandParts(step.command).some((line) => /^npm\s+run\s+check(?:\s|$)/i.test(line)));
}

function provenanceTargets(root) {
  const id = currentChangeId(root);
  const targets = [
    { file: 'memory/HANDOVER.md', headings: ['Summary', 'Commands', 'Verification'] },
    { file: 'ai/context/current-context.md', headings: ['Verification Commands', 'Planned Verification Commands'] }
  ];
  if (id) {
    targets.push(
      { file: `ai/changes/${id}/verification.md`, headings: null },
      { file: `ai/changes/${id}/handover.md`, headings: ['Summary', 'Commands', 'Verification'] }
    );
  }
  return targets;
}

function isPlanned(record) {
  return /planned/i.test(record.heading || '');
}

function requiresProvenance(record) {
  const line = record.text.trim();
  if (!line || line.startsWith('#')) {
    return false;
  }
  const hasCommandOrScope = COMMAND_OR_SCOPE.test(line);
  const hasResult = RESULT_SEMANTICS.test(line);
  if (hasResult) {
    return true;
  }
  return hasCommandOrScope && !isPlanned(record);
}

export function validateVerificationProvenance({ root = process.cwd() } = {}) {
  const result = emptyResult();
  const hasMaven = workflowHasMaven(root);
  const hasFrontend = workflowHasFrontend(root);
  const hasCheck = workflowHasCheck(root);

  for (const target of provenanceTargets(root)) {
    if (!pathExists(root, target.file)) {
      continue;
    }
    const text = readText(root, target.file);
    for (const record of sectionLineRecords(text, target.headings)) {
      const line = record.text.trim();
      if (!requiresProvenance(record)) {
        continue;
      }
      if (!PROVENANCE_TAG.test(line)) {
        result.failures.push(issue({
          file: target.file,
          line: record.line,
          code: 'missing-provenance',
          message: 'verification result or command declaration must include [local], [ci], [runtime-local], [runtime-ci], [not-run], or [inconclusive]'
        }));
        continue;
      }
      if (!CI_TAG.test(line)) {
        continue;
      }
      if (/\b(mvn|maven|backend compile)\b/i.test(line) && !hasMaven) {
        result.failures.push(issue({
          file: target.file,
          line: record.line,
          code: 'ci-maven-not-covered',
          message: 'CI Maven/backend compile claim has no matching Maven compile command in GitHub Actions'
        }));
      }
      if (/(frontend build|build:prod|ruoyi-ui)/i.test(line) && !hasFrontend) {
        result.failures.push(issue({
          file: target.file,
          line: record.line,
          code: 'ci-frontend-not-covered',
          message: 'CI frontend build claim has no matching ruoyi-ui build command in GitHub Actions'
        }));
      }
      if (/(github actions|\bci\b|npm run check)/i.test(line) && !hasCheck) {
        result.failures.push(issue({
          file: target.file,
          line: record.line,
          code: 'ci-check-not-covered',
          message: 'CI check claim has no npm run check command in GitHub Actions'
        }));
      }
    }
  }

  return result;
}

if (process.argv[1] && process.argv[1].endsWith('verification-provenance-checker.js')) {
  printIssues('check:verification-provenance', validateVerificationProvenance({ root: parseRootArg() }));
}
