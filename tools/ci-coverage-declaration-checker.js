import {
  currentChangeId,
  currentDocTargets,
  emptyResult,
  issue,
  parseRootArg,
  pathExists,
  printIssues,
  readText,
  sectionLineRecords,
  workflowFiles,
  workflowRunSteps
} from './governance-checker-utils.js';

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

function workflowHasCheck(root) {
  return workflowRunSteps(root).some((step) => commandParts(step.command).some((line) => /^npm\s+run\s+check(?:\s|$)/i.test(line)));
}

function workflowHasMaven(root) {
  return workflowRunSteps(root).some((step) => isMavenCompileCommand(step.command));
}

function workflowHasFrontend(root) {
  return workflowRunSteps(root).some((step) => isFrontendBuildCommand(step));
}

function declarationTargets(root) {
  const id = currentChangeId(root);
  const targets = currentDocTargets(root);
  if (id) {
    targets.push(
      { file: `ai/changes/${id}/verification.md`, headings: null },
      { file: `ai/changes/${id}/handover.md`, headings: null }
    );
  }
  return targets;
}

function isCiCoverageClaim(line) {
  if (/\[ci-planned\]/i.test(line)) {
    return false;
  }
  return /\[ci\]|\[runtime-ci\]/i.test(line)
    || /(github actions|\bci\b).*\b(passed|verified|covered|runs?|ran|build|compile)\b/i.test(line);
}

export function validateCiCoverageDeclaration({ root = process.cwd() } = {}) {
  const result = emptyResult();
  const workflows = workflowFiles(root);
  const hasCheck = workflowHasCheck(root);
  const hasMaven = workflowHasMaven(root);
  const hasFrontend = workflowHasFrontend(root);

  if (workflows.length === 0 || !hasCheck) {
    result.failures.push(issue({
      file: '.github/workflows',
      code: 'node-governance-ci-missing',
      message: 'GitHub Actions must run npm run check for Node governance CI'
    }));
  }

  for (const target of declarationTargets(root)) {
    if (!pathExists(root, target.file)) {
      continue;
    }
    const text = readText(root, target.file);
    for (const record of sectionLineRecords(text, target.headings)) {
      const line = record.text.trim();
      if (!isCiCoverageClaim(line)) {
        continue;
      }
      if (/\b(mvn|maven|backend compile)\b/i.test(line) && !hasMaven) {
        result.failures.push(issue({
          file: target.file,
          line: record.line,
          code: 'declared-ci-maven-missing',
          message: 'current docs declare Maven/backend CI coverage but workflows do not run Maven compile'
        }));
      }
      if (/(frontend build|build:prod|ruoyi-ui)/i.test(line) && !hasFrontend) {
        result.failures.push(issue({
          file: target.file,
          line: record.line,
          code: 'declared-ci-frontend-missing',
          message: 'current docs declare frontend CI coverage but workflows do not run ruoyi-ui build:prod'
        }));
      }
    }
  }

  if (!hasMaven) {
    result.warnings.push(issue({
      file: '.github/workflows',
      code: 'maven-ci-not-present',
      message: 'GitHub Actions does not run Maven compile; current docs must not claim Maven CI coverage'
    }));
  }
  if (!hasFrontend) {
    result.warnings.push(issue({
      file: '.github/workflows',
      code: 'frontend-ci-not-present',
      message: 'GitHub Actions does not run ruoyi-ui build:prod; current docs must not claim frontend CI coverage'
    }));
  }

  return result;
}

if (process.argv[1] && process.argv[1].endsWith('ci-coverage-declaration-checker.js')) {
  printIssues('check:ci-coverage-declaration', validateCiCoverageDeclaration({ root: parseRootArg() }));
}
