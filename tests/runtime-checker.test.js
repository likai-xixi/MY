import test from 'node:test';
import assert from 'node:assert/strict';
import { validateRuntimeReadiness } from '../tools/runtime-checker.js';

test('runtime checker uses injected runner for npm probing and scripts', () => {
  const calls = [];
  const runner = {
    canRun(command, args) {
      calls.push({ type: 'canRun', command, args });
      return command === 'npm' || command === 'custom-mvn.cmd';
    },
    run(command, args, options) {
      calls.push({ type: 'run', command, args, cwd: options.cwd });
      return { status: 0 };
    }
  };

  const errors = validateRuntimeReadiness({
    execute: true,
    force: true,
    profile: { templateSetup: false },
    policy: {
      skipWhenTemplateSetup: false,
      requireToolingWhenDetected: true,
      requireFrontendBuildScript: false,
      commands: {
        npm: ['build'],
        maven: []
      },
      toolPaths: {
        maven: 'custom-mvn.cmd'
      }
    },
    runner
  });

  assert.deepEqual(errors, []);
  const callSummary = calls.map((call) => `${call.type}:${call.command} ${call.args.join(' ')}`);
  assert.equal(callSummary.includes('canRun:custom-mvn.cmd --version'), true);
  assert.equal(callSummary.filter((call) => call === 'canRun:npm --version').length >= 1, true);
  assert.equal(callSummary.includes('run:npm run build'), true);
});

test('runtime checker reports missing frontend tooling through runner', () => {
  const errors = validateRuntimeReadiness({
    force: true,
    profile: { templateSetup: false },
    policy: {
      skipWhenTemplateSetup: false,
      requireToolingWhenDetected: true,
      requireFrontendBuildScript: false,
      commands: { npm: ['test'] }
    },
    runner: {
      canRun() {
        return false;
      },
      run() {
        throw new Error('run should not be called when tooling is unavailable');
      }
    }
  });

  assert.deepEqual(errors, [
    'Maven project detected, but `mvn` is not available. Install Maven or configure ai/rules/runtime-policy.json.',
    'npm project detected at ruoyi-ui, but npm is not available.',
    'npm project detected at ., but npm is not available.'
  ]);
});

test('runtime checker falls back to default Maven command when configured path is unavailable', () => {
  const calls = [];
  const runner = {
    canRun(command, args) {
      calls.push({ command, args });
      return command === 'mvn' || command === 'npm';
    },
    run() {
      throw new Error('run should not be called when execute is false');
    }
  };

  const errors = validateRuntimeReadiness({
    force: true,
    profile: { templateSetup: false },
    policy: {
      skipWhenTemplateSetup: false,
      requireToolingWhenDetected: true,
      requireFrontendBuildScript: false,
      toolPaths: {
        maven: 'C:/local-only/apache-maven/bin/mvn.cmd'
      }
    },
    runner
  });

  assert.deepEqual(errors, []);
  assert.deepEqual(calls.slice(0, 2).map((call) => call.command), [
    'C:/local-only/apache-maven/bin/mvn.cmd',
    'mvn'
  ]);
});
