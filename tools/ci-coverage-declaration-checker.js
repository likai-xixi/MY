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
  workflowContinueOnErrorSettings,
  workflowFiles,
  workflowRunSteps,
  workflowUses,
  workflowYamlDiagnostics
} from './governance-checker-utils.js';

function hereDocDeclarations(line) {
  const declarations = [];
  const pattern = /<<(-)?[ \t]*(?:'([^'\r\n]+)'|"([^"\r\n]+)"|\\?([A-Za-z_][A-Za-z0-9_]*))/g;
  for (const match of String(line || '').matchAll(pattern)) {
    declarations.push({
      delimiter: match[2] || match[3] || match[4],
      stripTabs: Boolean(match[1])
    });
  }
  return declarations;
}

function stripHereDocBodies(command) {
  const executableLines = [];
  const pending = [];
  for (const line of String(command || '').split(/\r?\n/)) {
    if (pending.length > 0) {
      const current = pending[0];
      const candidate = current.stripTabs ? line.replace(/^\t+/, '') : line;
      if (candidate === current.delimiter) {
        pending.shift();
      }
      continue;
    }
    executableLines.push(line);
    pending.push(...hereDocDeclarations(line));
  }
  return executableLines.join('\n');
}

function commandParts(command) {
  return stripHereDocBodies(command)
    .split(/\r?\n|&&|;/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function normalizeWorkingDirectory(step) {
  return String(step.workingDirectory || '').replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/$/, '');
}

function isRootStep(step) {
  return normalizeWorkingDirectory(step) === '' || normalizeWorkingDirectory(step) === '.';
}

function isMavenLine(line) {
  return /^(?:\.\/)?mvnw(?:\.cmd)?\b|^mvn(?:\.cmd)?\b/i.test(line);
}

function skipsMavenTests(line) {
  return /(?:^|\s)-(?:D)?(?:skipTests|skipITs|maven\.test\.skip)(?:=true)?(?:\s|$)/i.test(line);
}

function isMavenUnitCommand(command) {
  return commandParts(command).some((line) => isMavenLine(line)
    && !skipsMavenTests(line)
    && /(?:^|\s)(?:test|verify)(?:\s|$)/i.test(line));
}

function isMavenIntegrationCommand(command) {
  return commandParts(command).some((line) => isMavenLine(line)
    && !skipsMavenTests(line)
    && /(?:^|\s)-P(?:\s*)integration-test(?:\s|$)/i.test(line)
    && /(?:^|\s)verify(?:\s|$)/i.test(line));
}

function isFrontendNpmCommand(step, localPattern, prefixPattern) {
  const frontendDirectory = normalizeWorkingDirectory(step) === 'ruoyi-ui';
  return commandParts(step.command).some((line) => (
    prefixPattern.test(line)
    || (frontendDirectory && localPattern.test(line))
  ));
}

function isFrontendBuildCommand(step) {
  return isFrontendNpmCommand(
    step,
    /^npm\s+run\s+build:prod(?:\s|$)/i,
    /^npm\s+--prefix\s+ruoyi-ui\s+run\s+build:prod(?:\s|$)/i
  );
}

function isUnconditional(step) {
  return !step.conditionSpecified && !step.jobConditionSpecified;
}

function unsafeControlReasons(step) {
  const reasons = [];
  if (step.shellSpecified) {
    reasons.push(`custom-shell:${step.shell || '(empty)'}`);
  }
  if (step.jobNeedsSpecified) {
    reasons.push('job-needs');
  }
  return reasons;
}

function isRequiredVerificationStep(step) {
  const rootCommand = isRootStep(step) && commandParts(step.command).some((line) => (
    /^npm\s+ci(?:\s|$)/i.test(line)
    || /^npm\s+run\s+check(?:\s|$)/i.test(line)
    || /^npm\s+(?:run\s+)?test(?:\s|$)/i.test(line)
  ));
  return rootCommand
    || isMavenUnitCommand(step.command)
    || isMavenIntegrationCommand(step.command)
    || isFrontendNpmCommand(
      step,
      /^npm\s+ci(?:\s|$)/i,
      /^npm\s+--prefix\s+ruoyi-ui\s+ci(?:\s|$)/i
    )
    || isFrontendNpmCommand(
      step,
      /^npm\s+audit\b(?=.*(?:^|\s)--audit-level(?:=|\s+)high(?:\s|$))/i,
      /^npm\s+--prefix\s+ruoyi-ui\s+audit\b(?=.*(?:^|\s)--audit-level(?:=|\s+)high(?:\s|$))/i
    )
    || isFrontendBuildCommand(step);
}

function shellSegments(command) {
  return String(command || '')
    .split(/\r?\n|;|&&/)
    .map((segment) => segment.replace(/\s+#.*$/, '').trim())
    .filter(Boolean);
}

function hasSingleShellOperator(command, operator) {
  const text = String(command || '');
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] !== operator) {
      continue;
    }
    const previous = text[index - 1] || '';
    const next = text[index + 1] || '';
    if (operator === '|' && (previous === '|' || next === '|')) {
      continue;
    }
    if (operator === '&' && (
      previous === '&' || next === '&'
      || previous === '>' || previous === '<' || previous === '|'
      || next === '>'
    )) {
      continue;
    }
    return true;
  }
  return false;
}

function isPipefailDirective(segment) {
  const tokens = String(segment || '').trim().split(/\s+/);
  if (tokens.length < 3 || tokens[0].toLowerCase() !== 'set'
    || tokens.at(-1).toLowerCase() !== 'pipefail') {
    return false;
  }
  const flags = tokens.slice(1, -1);
  return flags.every((flag) => /^-[A-Za-z]+$/.test(flag))
    && flags.some((flag) => flag === '-o' || /^-[A-Za-z]*o[A-Za-z]*$/.test(flag));
}

function pipefailEnabled(command) {
  const segments = shellSegments(command);
  if (segments.some((segment) => /^set\s+\+o\s+pipefail(?:\s|$)/i.test(segment))) {
    return false;
  }
  return segments.some((segment) => isPipefailDirective(segment));
}

function verificationProgramLines(command) {
  return stripHereDocBodies(command)
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+#.*$/, '').trim())
    .filter((line) => line && !line.startsWith('#'));
}

function isDedicatedVerificationProgram(command) {
  const lines = verificationProgramLines(command);
  if (lines.length === 1) {
    return commandParts(lines[0]).length === 1;
  }
  if (lines.length !== 2 || !isPipefailDirective(lines[0])) {
    return false;
  }
  return hasSingleShellOperator(lines[1], '|')
    && commandParts(lines[1]).length === 1;
}

function failureMaskReasons(command) {
  const text = stripHereDocBodies(command);
  const segments = shellSegments(text);
  const reasons = [];
  if (/\|\|/.test(text)) {
    reasons.push('or-list');
  }
  if (segments.some((segment) => (
    /^set\s+\+[A-Za-z]*e[A-Za-z]*(?:\s|$)/i.test(segment)
    || /^set\s+\+o\s+errexit(?:\s|$)/i.test(segment)
  ))) {
    reasons.push('errexit-disabled');
  }
  if (hasSingleShellOperator(text, '|') && !pipefailEnabled(text)) {
    reasons.push('pipeline-without-pipefail');
  }
  if (hasSingleShellOperator(text, '&')) {
    reasons.push('background-command');
  }
  const trailing = String(text)
    .split(/\r?\n|;/)
    .map((segment) => segment.replace(/\s+#.*$/, '').trim())
    .filter(Boolean)
    .at(-1) || '';
  if (/^(?:true|:|(?:exit|return)\s+0)$/i.test(trailing)) {
    reasons.push('trailing-success');
  }
  return reasons;
}

function externalUseParts(use) {
  const separator = use.target.lastIndexOf('@');
  if (separator <= 0) {
    return { ...use, action: use.target, ref: '(missing)' };
  }
  return {
    ...use,
    action: use.target.slice(0, separator),
    ref: use.target.slice(separator + 1)
  };
}

function needsFullCheckoutHistory(root) {
  const baselineFile = 'ai/rules/ruoyi-legacy-baseline.json';
  if (!pathExists(root, baselineFile)) {
    return false;
  }
  try {
    const baseline = JSON.parse(readText(root, baselineFile));
    return [
      ...(baseline.componentFiles || []),
      ...(baseline.boundaryFindings || [])
    ].some((entry) => String(entry.sourceCommit || '').trim());
  } catch {
    return true;
  }
}

function workflowFacts(root) {
  const steps = workflowRunSteps(root);
  const stepFacts = steps.map((step) => ({
    ...step,
    failureMaskReasons: failureMaskReasons(step.command),
    unsafeControlReasons: unsafeControlReasons(step)
  }));
  const unconditionalSteps = stepFacts.filter((step) => isUnconditional(step));
  const failurePropagatingSteps = unconditionalSteps.filter((step) => (
    (!step.continueOnErrorSpecified || step.continueOnErrorExplicitFalse)
    && (!step.jobContinueOnErrorSpecified || step.jobContinueOnErrorExplicitFalse)
  ));
  const controlSafeSteps = failurePropagatingSteps.filter((step) => step.unsafeControlReasons.length === 0);
  const dedicatedSteps = controlSafeSteps.filter((step) => isDedicatedVerificationProgram(step.command));
  const coverageSteps = dedicatedSteps.filter((step) => step.failureMaskReasons.length === 0);
  const maskedRequiredSteps = stepFacts.filter((step) => (
    step.failureMaskReasons.length > 0 && isRequiredVerificationStep(step)
  ));
  const unsafeControlRequiredSteps = stepFacts.filter((step) => (
    step.unsafeControlReasons.length > 0 && isRequiredVerificationStep(step)
  ));
  const uses = workflowUses(root);
  const invalidContinueOnError = workflowContinueOnErrorSettings(root)
    .filter((setting) => !setting.explicitFalse);
  const yamlDiagnostics = workflowYamlDiagnostics(root);
  const externalUses = uses
    .filter((use) => !use.target.startsWith('./') && !use.target.startsWith('docker://'))
    .map((use) => externalUseParts(use));
  const unpinnedActions = externalUses.filter(({ ref }) => !/^[0-9a-f]{40}$/i.test(ref));
  const unpinnedDockerImages = uses.filter((use) => use.target.startsWith('docker://')
    && !/^docker:\/\/[^@\s]+@sha256:[0-9a-f]{64}$/i.test(use.target));
  const checkoutUses = uses.filter((use) => use.kind === 'step'
    && externalUseParts(use).action.toLowerCase() === 'actions/checkout');
  const fullHistoryRequired = needsFullCheckoutHistory(root);
  const checkoutWithoutFullHistory = fullHistoryRequired
    ? checkoutUses.filter((use) => use.inputs['fetch-depth'] !== '0')
    : [];
  return {
    steps,
    hasCheck: coverageSteps.some((step) => isRootStep(step)
      && commandParts(step.command).some((line) => /^npm\s+run\s+check(?:\s|$)/i.test(line))),
    hasRootCi: coverageSteps.some((step) => isRootStep(step)
      && commandParts(step.command).some((line) => /^npm\s+ci(?:\s|$)/i.test(line))),
    hasRootTest: coverageSteps.some((step) => isRootStep(step)
      && commandParts(step.command).some((line) => /^npm\s+(?:run\s+)?test(?:\s|$)/i.test(line))),
    hasMavenUnit: coverageSteps.some((step) => isMavenUnitCommand(step.command)),
    hasMavenIntegration: coverageSteps.some((step) => isMavenIntegrationCommand(step.command)),
    hasFrontendCi: coverageSteps.some((step) => isFrontendNpmCommand(
      step,
      /^npm\s+ci(?:\s|$)/i,
      /^npm\s+--prefix\s+ruoyi-ui\s+ci(?:\s|$)/i
    )),
    hasFrontendAudit: coverageSteps.some((step) => isFrontendNpmCommand(
      step,
      /^npm\s+audit\b(?=.*(?:^|\s)--audit-level(?:=|\s+)high(?:\s|$))/i,
      /^npm\s+--prefix\s+ruoyi-ui\s+audit\b(?=.*(?:^|\s)--audit-level(?:=|\s+)high(?:\s|$))/i
    )),
    hasFrontendBuild: coverageSteps.some((step) => isFrontendBuildCommand(step)),
    skippedMaven: steps.some((step) => commandParts(step.command).some((line) => isMavenLine(line) && skipsMavenTests(line))),
    npmInstall: steps.some((step) => commandParts(step.command).some((line) => /^npm(?:\s+--prefix\s+ruoyi-ui)?\s+install(?:\s|$)/i.test(line))),
    echo: steps.some((step) => commandParts(step.command).some((line) => /^echo(?:\s|$)/i.test(line))),
    invalidContinueOnError,
    yamlDiagnostics,
    maskedRequiredSteps,
    unsafeControlRequiredSteps,
    unpinnedActions,
    unpinnedDockerImages,
    checkoutUses,
    checkoutWithoutFullHistory,
    fullHistoryRequired
  };
}

function pushMissing(result, condition, code, message) {
  if (!condition) {
    result.failures.push(issue({ file: '.github/workflows', code, message }));
  }
}

function pushMaskedRequiredFailures(result, steps) {
  for (const step of steps) {
    result.failures.push(issue({
      file: step.file,
      line: step.line,
      code: 'ci-required-command-failure-masked',
      message: 'GitHub Actions required verification commands must propagate failures',
      detail: step.failureMaskReasons.join(', ')
    }));
  }
}

function pushUnsafeControlFailures(result, steps) {
  for (const step of steps) {
    result.failures.push(issue({
      file: step.file,
      line: step.line,
      code: 'ci-required-command-unsafe-control',
      message: 'GitHub Actions required verification commands must use the default shell in a dependency-free job',
      detail: step.unsafeControlReasons.join(', ')
    }));
  }
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
  const facts = workflowFacts(root);
  const hasMaven = facts.hasMavenUnit && facts.hasMavenIntegration;
  const hasFrontend = facts.hasFrontendCi && facts.hasFrontendAudit && facts.hasFrontendBuild;

  if (workflows.length === 0 || !facts.hasCheck) {
    result.failures.push(issue({
      file: '.github/workflows',
      code: 'node-governance-ci-missing',
      message: 'GitHub Actions must run npm run check for Node governance CI'
    }));
  }
  pushMissing(result, facts.hasRootCi, 'root-npm-ci-missing', 'GitHub Actions must install root dependencies with npm ci');
  pushMissing(result, facts.hasRootTest, 'root-npm-test-missing', 'GitHub Actions must run the root npm test suite explicitly');
  pushMissing(result, facts.hasMavenUnit, 'maven-unit-ci-missing', 'GitHub Actions must run Maven unit tests without skip flags');
  pushMissing(result, facts.hasMavenIntegration, 'maven-integration-ci-missing', 'GitHub Actions must run the integration-test Maven profile through verify');
  pushMissing(result, facts.hasFrontendCi, 'frontend-npm-ci-missing', 'GitHub Actions must install ruoyi-ui dependencies with npm ci');
  pushMissing(result, facts.hasFrontendAudit, 'frontend-audit-ci-missing', 'GitHub Actions must run ruoyi-ui npm audit --audit-level=high');
  pushMissing(result, facts.hasFrontendBuild, 'frontend-build-ci-missing', 'GitHub Actions must run ruoyi-ui build:prod');

  if (facts.skippedMaven) {
    result.failures.push(issue({
      file: '.github/workflows',
      code: 'maven-tests-skipped',
      message: 'GitHub Actions Maven commands must not use skipTests, skipITs, or maven.test.skip'
    }));
  }
  if (facts.npmInstall) {
    result.failures.push(issue({
      file: '.github/workflows',
      code: 'npm-install-in-ci',
      message: 'GitHub Actions must use npm ci instead of npm install'
    }));
  }
  if (facts.echo) {
    result.failures.push(issue({
      file: '.github/workflows',
      code: 'ci-echo-command',
      message: 'GitHub Actions verification jobs must not use echo-only commands'
    }));
  }
  for (const diagnostic of facts.yamlDiagnostics) {
    result.failures.push(issue({
      file: diagnostic.file,
      line: diagnostic.line,
      code: 'ci-workflow-yaml-invalid',
      message: 'GitHub Actions workflow YAML must parse without errors',
      detail: diagnostic.message
    }));
  }
  for (const setting of facts.invalidContinueOnError) {
    result.failures.push(issue({
      file: setting.file,
      line: setting.line,
      code: 'ci-continue-on-error',
      message: `GitHub Actions ${setting.kind} continue-on-error must be omitted or the explicit boolean false`
    }));
  }
  pushMaskedRequiredFailures(result, facts.maskedRequiredSteps);
  pushUnsafeControlFailures(result, facts.unsafeControlRequiredSteps);
  for (const { action, ref, file, line } of facts.unpinnedActions) {
    result.failures.push(issue({
      file,
      line,
      code: 'ci-action-ref-unpinned',
      message: `GitHub Action or reusable workflow ${action}@${ref} must be pinned to a full 40-character commit SHA`
    }));
  }
  for (const { target, file, line } of facts.unpinnedDockerImages) {
    result.failures.push(issue({
      file,
      line,
      code: 'ci-docker-image-unpinned',
      message: `GitHub Action Docker image ${target} must be pinned to a sha256 digest`
    }));
  }
  if (facts.fullHistoryRequired && facts.checkoutUses.length === 0) {
    result.failures.push(issue({
      file: '.github/workflows',
      code: 'ci-checkout-full-history-required',
      message: 'GitHub Actions must checkout full history because legacy baselines reference historical source commits'
    }));
  }
  for (const { file, line } of facts.checkoutWithoutFullHistory) {
    result.failures.push(issue({
      file,
      line,
      code: 'ci-checkout-full-history-required',
      message: 'actions/checkout must set with.fetch-depth to 0 because legacy baselines reference historical source commits'
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

  return result;
}

if (process.argv[1] && process.argv[1].endsWith('ci-coverage-declaration-checker.js')) {
  printIssues('check:ci-coverage-declaration', validateCiCoverageDeclaration({ root: parseRootArg() }));
}
