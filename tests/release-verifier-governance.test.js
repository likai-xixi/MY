import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAVEN_INTEGRATION_ARGS,
  RELEASE_NPM_STEPS,
  resolveReleaseMaven,
  verifyRelease
} from '../tools/release-verifier.js';

function createRunner({ runnable = [], failRun = -1, failResult = { status: 17 } } = {}) {
  const calls = [];
  let runIndex = 0;
  return {
    calls,
    canRun(command, args) {
      calls.push({ type: 'canRun', command, args });
      return runnable.includes(command);
    },
    run(command, args, options) {
      const current = runIndex++;
      calls.push({ type: 'run', command, args, options });
      return current === failRun ? failResult : { status: 0 };
    }
  };
}

test('release verification uses configured Maven and executes every exact gate once', () => {
  const configured = 'C:/tools/apache-maven/bin/mvn.cmd';
  const runner = createRunner({ runnable: [configured] });
  const errors = verifyRelease({
    policy: { toolPaths: { maven: configured } },
    runner,
    cwd: 'D:/repo'
  });

  assert.deepEqual(errors, []);
  assert.deepEqual(
    runner.calls.filter((call) => call.type === 'canRun'),
    [{ type: 'canRun', command: configured, args: ['--version'] }]
  );
  assert.deepEqual(
    runner.calls.filter((call) => call.type === 'run').map(({ command, args, options }) => ({
      command,
      args,
      cwd: options.cwd,
      stdio: options.stdio,
      overridesEnv: Object.hasOwn(options, 'env')
    })),
    [
      { command: 'npm', args: ['run', 'check'], cwd: 'D:/repo', stdio: 'inherit', overridesEnv: false },
      { command: 'npm', args: ['run', 'check:prod-safety'], cwd: 'D:/repo', stdio: 'inherit', overridesEnv: false },
      { command: configured, args: MAVEN_INTEGRATION_ARGS, cwd: 'D:/repo', stdio: 'inherit', overridesEnv: false },
      { command: 'npm', args: ['--prefix', 'ruoyi-ui', 'test'], cwd: 'D:/repo', stdio: 'inherit', overridesEnv: false },
      { command: 'npm', args: ['--prefix', 'ruoyi-ui', 'audit', '--audit-level=moderate', '--include=dev'], cwd: 'D:/repo', stdio: 'inherit', overridesEnv: false },
      { command: 'npm', args: ['--prefix', 'ruoyi-ui', 'run', 'build:prod'], cwd: 'D:/repo', stdio: 'inherit', overridesEnv: false }
    ]
  );
});

test('release verification falls back to standard mvn when the configured path is unavailable', () => {
  const configured = 'C:/local-only/mvn.cmd';
  const runner = createRunner({ runnable: ['mvn'] });

  assert.equal(resolveReleaseMaven({ toolPaths: { maven: configured } }, runner), 'mvn');
  assert.deepEqual(
    runner.calls,
    [
      { type: 'canRun', command: configured, args: ['--version'] },
      { type: 'canRun', command: 'mvn', args: ['--version'] }
    ]
  );
});

test('release verification never retries a failed configured Maven reactor through fallback mvn', () => {
  const configured = 'C:/tools/mvn.cmd';
  const runner = createRunner({ runnable: [configured, 'mvn'], failRun: 2 });
  const errors = verifyRelease({
    policy: { toolPaths: { maven: configured } },
    runner,
    cwd: '/repo'
  });

  assert.equal(errors.length, 1);
  assert.match(errors[0], /exit code 17/);
  assert.equal(runner.calls.filter((call) => call.type === 'run' && call.command === configured).length, 1);
  assert.equal(runner.calls.some((call) => call.type === 'run' && call.command === 'mvn'), false);
});

test('release verification stops at the first failed step', () => {
  const runner = createRunner({ runnable: ['mvn'], failRun: 1 });
  const errors = verifyRelease({ policy: {}, runner, cwd: '/repo' });

  assert.equal(errors.length, 1);
  assert.match(errors[0], /npm run check:prod-safety/);
  assert.equal(runner.calls.filter((call) => call.type === 'run').length, 2);
  assert.equal(runner.calls.some((call) => call.type === 'canRun'), false);
});

const RELEASE_STAGE_LABELS = [
  'npm run check',
  'npm run check:prod-safety',
  'mvn -pl ruoyi-business -am -Pintegration-test verify',
  'npm --prefix ruoyi-ui test',
  'npm --prefix ruoyi-ui audit --audit-level=moderate --include=dev',
  'npm --prefix ruoyi-ui run build:prod'
];

for (const [stageIndex, label] of RELEASE_STAGE_LABELS.entries()) {
  test(`release verification stops after stage ${stageIndex + 1} fails`, () => {
    const runner = createRunner({ runnable: ['mvn'], failRun: stageIndex });
    const errors = verifyRelease({ policy: {}, runner, cwd: '/repo' });
    const runCalls = runner.calls.filter((call) => call.type === 'run');

    assert.equal(errors.length, 1);
    assert.match(errors[0], new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(errors[0], /exit code 17/);
    assert.equal(runCalls.length, stageIndex + 1);
  });
}

for (const [failureKind, failResult, expected] of [
  ['spawn error', { error: new Error('spawn blocked'), status: null }, /spawn blocked/],
  ['null status', { status: null }, /exit code null/],
  ['signal', { status: null, signal: 'SIGTERM' }, /SIGTERM/]
]) {
  test(`release verification fails closed on ${failureKind}`, () => {
    const runner = createRunner({ runnable: ['mvn'], failRun: 0, failResult });
    const errors = verifyRelease({ policy: {}, runner, cwd: '/repo' });

    assert.equal(errors.length, 1);
    assert.match(errors[0], expected);
    assert.equal(runner.calls.filter((call) => call.type === 'run').length, 1);
  });
}

test('release verification fails closed when no Maven command is runnable', () => {
  const configured = 'C:/missing/mvn.cmd';
  const runner = createRunner();
  const errors = verifyRelease({
    policy: { toolPaths: { maven: configured } },
    runner,
    cwd: '/repo'
  });

  assert.equal(errors.length, 1);
  assert.match(errors[0], /Maven is unavailable/);
  assert.equal(runner.calls.filter((call) => call.type === 'run').length, 2);
});

test('release verification fails closed on unreadable or malformed runtime policy', () => {
  for (const options of [
    { policyReader: () => { throw new SyntaxError('invalid JSON'); } },
    { policy: [] },
    { policy: { toolPaths: [] } },
    { policy: { toolPaths: { maven: '  ' } } },
    { policy: { toolPaths: { maven: ' mvn' } } }
  ]) {
    const runner = createRunner({ runnable: ['mvn'] });
    const errors = verifyRelease({ ...options, runner, cwd: '/repo' });

    assert.equal(errors.length, 1);
    assert.match(errors[0], /runtime-policy\.json|runtime policy/i);
    assert.equal(runner.calls.filter((call) => call.type === 'run').length, 2);
    assert.equal(runner.calls.some((call) => call.type === 'canRun'), false);
  }
});

test('runtime policy cannot replace or weaken the fixed Maven release reactor', () => {
  const runner = createRunner({ runnable: ['mvn'] });
  const errors = verifyRelease({
    policy: { commands: { maven: ['test', '-DskipTests', '-Dtest=NoTests'] } },
    runner,
    cwd: '/repo'
  });
  const mavenRuns = runner.calls.filter((call) => call.type === 'run' && call.command === 'mvn');

  assert.deepEqual(errors, []);
  assert.equal(mavenRuns.length, 1);
  assert.deepEqual(mavenRuns[0].args, MAVEN_INTEGRATION_ARGS);
});

test('release command constants cannot weaken tests audit dependencies or Maven integration', () => {
  assert.deepEqual(MAVEN_INTEGRATION_ARGS, ['-pl', 'ruoyi-business', '-am', '-Pintegration-test', 'verify']);
  assert.deepEqual(RELEASE_NPM_STEPS, [
    ['run', 'check'],
    ['run', 'check:prod-safety'],
    ['--prefix', 'ruoyi-ui', 'test'],
    ['--prefix', 'ruoyi-ui', 'audit', '--audit-level=moderate', '--include=dev'],
    ['--prefix', 'ruoyi-ui', 'run', 'build:prod']
  ]);
});
