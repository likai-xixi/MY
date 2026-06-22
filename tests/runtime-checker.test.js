import test from 'node:test';
import assert from 'node:assert/strict';
import { validateRuntimeReadiness } from '../tools/runtime-checker.js';

test('runtime checker uses injected runner for npm probing and scripts', () => {
  const calls = [];
  const runner = {
    canRun(command, args) {
      calls.push({ type: 'canRun', command, args });
      return command === 'npm';
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
        npm: ['test'],
        maven: ['test']
      }
    },
    runner
  });

  assert.deepEqual(errors, []);
  assert.deepEqual(
    calls.map((call) => `${call.type}:${call.command} ${call.args.join(' ')}`),
    ['canRun:npm --version', 'run:npm run test']
  );
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

  assert.deepEqual(errors, ['npm project detected at ., but npm is not available.']);
});
