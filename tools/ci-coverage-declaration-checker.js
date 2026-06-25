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
  workflowContains,
  workflowFiles
} from './governance-checker-utils.js';

function workflowHasCheck(root) {
  return workflowContains(root, /npm\s+run\s+check/i);
}

function workflowHasMaven(root) {
  return workflowContains(root, /mvn(\.cmd)?\s+.*-pl\s+ruoyi-admin\s+.*-am\s+.*-DskipTests\s+compile/i)
    || workflowContains(root, /mvn(\.cmd)?\s+.*-DskipTests\s+compile\s+.*-pl\s+ruoyi-admin/i);
}

function workflowHasFrontend(root) {
  return workflowContains(root, /npm\s+--prefix\s+ruoyi-ui\s+run\s+build:prod/i);
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
