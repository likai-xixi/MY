import { finish, isCli, projectPath, readJson } from './common.js';
import { defaultProcessRunner } from './process-runner.js';

export const MAVEN_INTEGRATION_ARGS = Object.freeze([
  '-pl',
  'ruoyi-business',
  '-am',
  '-Pintegration-test',
  'verify'
]);

export const RELEASE_NPM_STEPS = Object.freeze([
  Object.freeze(['run', 'check']),
  Object.freeze(['run', 'check:prod-safety']),
  Object.freeze(['--prefix', 'ruoyi-ui', 'test']),
  Object.freeze(['--prefix', 'ruoyi-ui', 'audit', '--audit-level=moderate', '--include=dev']),
  Object.freeze(['--prefix', 'ruoyi-ui', 'run', 'build:prod'])
]);

function readRuntimePolicy() {
  return readJson('ai/rules/runtime-policy.json');
}

function runtimePolicyError(policy) {
  if (!policy || typeof policy !== 'object' || Array.isArray(policy)) {
    return 'ai/rules/runtime-policy.json must contain a JSON object.';
  }
  const toolPaths = policy.toolPaths;
  if (toolPaths !== undefined && (!toolPaths || typeof toolPaths !== 'object' || Array.isArray(toolPaths))) {
    return 'ai/rules/runtime-policy.json toolPaths must be an object when provided.';
  }
  const configuredMaven = toolPaths?.maven;
  if (configuredMaven !== undefined && (
    typeof configuredMaven !== 'string'
    || configuredMaven.trim() === ''
    || configuredMaven !== configuredMaven.trim()
  )) {
    return 'ai/rules/runtime-policy.json toolPaths.maven must be a non-empty trimmed string when provided.';
  }
  return '';
}

function commandFailure(command, args, result) {
  if (!result.error && result.status === 0) {
    return '';
  }
  const reason = result.error?.message || result.signal || `exit code ${result.status}`;
  const resolved = result.resolvedCommand && result.resolvedCommand !== command
    ? ` resolved as ${result.resolvedCommand}`
    : '';
  return `${command} ${args.join(' ')}${resolved} failed: ${reason}`;
}

function runStep(command, args, { cwd, runner }) {
  const result = runner.run(command, args, { cwd, stdio: 'inherit' });
  return commandFailure(command, args, result);
}

export function resolveReleaseMaven(policy, runner = defaultProcessRunner) {
  const candidates = [policy?.toolPaths?.maven, 'mvn'].filter(Boolean);
  for (const command of [...new Set(candidates)]) {
    if (runner.canRun(command, ['--version'])) {
      return command;
    }
  }
  return '';
}

export function verifyRelease({
  policy,
  policyReader = readRuntimePolicy,
  runner = defaultProcessRunner,
  cwd = projectPath('.')
} = {}) {
  for (const args of RELEASE_NPM_STEPS.slice(0, 2)) {
    const failure = runStep('npm', args, { cwd, runner });
    if (failure) {
      return [failure];
    }
  }

  let effectivePolicy = policy;
  if (effectivePolicy === undefined) {
    try {
      effectivePolicy = policyReader();
    } catch (error) {
      return [`Cannot read ai/rules/runtime-policy.json: ${error.message}`];
    }
  }
  const policyFailure = runtimePolicyError(effectivePolicy);
  if (policyFailure) {
    return [policyFailure];
  }

  const maven = resolveReleaseMaven(effectivePolicy, runner);
  if (!maven) {
    return ['Maven is unavailable: configure ai/rules/runtime-policy.json or add mvn to PATH.'];
  }
  const mavenFailure = runStep(maven, MAVEN_INTEGRATION_ARGS, { cwd, runner });
  if (mavenFailure) {
    return [mavenFailure];
  }

  for (const args of RELEASE_NPM_STEPS.slice(2)) {
    const failure = runStep('npm', args, { cwd, runner });
    if (failure) {
      return [failure];
    }
  }
  return [];
}

if (isCli(import.meta.url)) {
  finish('verify:release', verifyRelease());
}
