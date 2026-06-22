import path from 'node:path';
import { fileExists, finish, isCli, projectPath, readJson } from './common.js';
import { defaultProcessRunner } from './process-runner.js';
import { readJsonOrDefault } from './scan-utils.js';

function readProfile() {
  try {
    return readJson('ai/project-profile.json');
  } catch {
    return { adapter: 'generic', templateSetup: true };
  }
}

function readPolicy() {
  return readJsonOrDefault('ai/rules/runtime-policy.json', {
    skipWhenTemplateSetup: true,
    requireToolingWhenDetected: true,
    requireFrontendBuildScript: true,
    executeCommandsByDefault: false,
    commands: { maven: ['test'], npm: ['build'], pnpm: ['build'], yarn: ['build'] }
  });
}

function canRun(command, args = ['--version'], runner = defaultProcessRunner) {
  return runner.canRun(command, args);
}

function toolCommand(tool, policy) {
  const configured = policy.toolPaths?.[tool];
  if (configured) {
    return configured;
  }
  if (tool === 'maven') {
    return 'mvn';
  }
  return tool;
}

function runCommand(command, args, cwd, runner = defaultProcessRunner) {
  const result = runner.run(command, args, {
    cwd: projectPath(cwd || '.'),
    stdio: 'inherit'
  });
  if (!result.error && result.status === 0) {
    return '';
  }
  const reason = result.error?.message || result.signal || `exit code ${result.status}`;
  const resolved = result.resolvedCommand && result.resolvedCommand !== command
    ? ` resolved as ${result.resolvedCommand}`
    : '';
  return `${command} ${args.join(' ')} failed in ${cwd || '.'}${resolved}: ${reason}`;
}

export function detectMavenProjects() {
  return [
    '.',
    'ruoyi-admin',
    'ruoyi-business',
    'ruoyi-system',
    'backend'
  ].filter((dir) => fileExists(path.posix.join(dir, 'pom.xml')));
}

export function detectFrontendProjects() {
  return [
    'ruoyi-ui',
    'frontend',
    '.'
  ].filter((dir) => fileExists(path.posix.join(dir, 'package.json')));
}

export function detectPackageManager(dir) {
  if (fileExists(path.posix.join(dir, 'pnpm-lock.yaml'))) {
    return 'pnpm';
  }
  if (fileExists(path.posix.join(dir, 'yarn.lock'))) {
    return 'yarn';
  }
  return 'npm';
}

function readPackageJson(dir) {
  try {
    return readJson(path.posix.join(dir, 'package.json'));
  } catch {
    return { scripts: {} };
  }
}

export function validateFrontendProject({ dir, packageManager, command = packageManager, execute, policy, runner = defaultProcessRunner }) {
  const errors = [];
  const pkg = readPackageJson(dir);
  const scripts = pkg.scripts || {};
  if (policy.requireFrontendBuildScript !== false && !scripts.build) {
    errors.push(`${dir}/package.json must define a build script for runtime verification.`);
  }
  if (execute) {
    for (const script of policy.commands?.[packageManager] || ['build']) {
      if (!scripts[script]) {
        errors.push(`${dir}/package.json is missing script: ${script}.`);
        continue;
      }
      const failure = runCommand(command, ['run', script], dir, runner);
      if (failure) {
        errors.push(failure);
      }
    }
  }
  return errors;
}

export function validateMavenProject({ dir, command = 'mvn', execute, policy, runner = defaultProcessRunner }) {
  const errors = [];
  if (execute) {
    for (const goal of policy.commands?.maven || ['test']) {
      const failure = runCommand(command, [goal], dir, runner);
      if (failure) {
        errors.push(failure);
      }
    }
  }
  return errors;
}

export function validateRuntimeReadiness({
  execute = false,
  force = false,
  policy = readPolicy(),
  profile = readProfile(),
  runner = defaultProcessRunner
} = {}) {
  if (policy.skipWhenTemplateSetup !== false && profile.templateSetup === true && !force) {
    return [];
  }

  const errors = [];
  const mavenProjects = detectMavenProjects();
  const frontendProjects = detectFrontendProjects();
  const shouldExecute = execute || policy.executeCommandsByDefault === true;
  const mavenCommand = toolCommand('maven', policy);

  if (mavenProjects.length > 0 && policy.requireToolingWhenDetected !== false && !canRun(mavenCommand, ['--version'], runner)) {
    errors.push('Maven project detected, but `mvn` is not available. Install Maven or configure ai/rules/runtime-policy.json.');
  }

  for (const dir of frontendProjects) {
    const manager = detectPackageManager(dir);
    const managerCommand = toolCommand(manager, policy);
    if (policy.requireToolingWhenDetected !== false && !canRun(managerCommand, ['--version'], runner)) {
      errors.push(`${manager} project detected at ${dir}, but ${manager} is not available.`);
      continue;
    }
    errors.push(...validateFrontendProject({ dir, packageManager: manager, command: managerCommand, execute: shouldExecute, policy, runner }));
  }

  if (mavenProjects.length > 0 && canRun(mavenCommand, ['--version'], runner)) {
    for (const dir of mavenProjects) {
      errors.push(...validateMavenProject({ dir, command: mavenCommand, execute: shouldExecute, policy, runner }));
    }
  }

  return errors;
}

if (isCli(import.meta.url)) {
  finish('check:runtime', validateRuntimeReadiness({
    execute: process.argv.includes('--execute'),
    force: process.argv.includes('--force')
  }));
}
