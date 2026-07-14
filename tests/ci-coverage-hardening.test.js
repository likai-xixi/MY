import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { validateCiCoverageDeclaration } from '../tools/ci-coverage-declaration-checker.js';

const CHECKOUT_SHA = '1111111111111111111111111111111111111111';
const REUSABLE_SHA = '2222222222222222222222222222222222222222';
const IMAGE_DIGEST = 'a'.repeat(64);
const NODE24_ACTION_PINS = {
  checkout: '93cb6efe18208431cddfb8368fd83d5badbf9bfd',
  setupNode: 'a0853c24544627f65ddf259abe73b1d18a591444',
  setupJava: '0f481fcb613427c0f801b606911222b5b6f3083a'
};

test('repository CI pins Node 24-compatible actions and avoids an unused governance Maven cache', () => {
  const workflow = fs.readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
  const governance = workflow.match(/\n  governance:\n([\s\S]*?)\n  backend-tests:/)?.[1] || '';
  const backend = workflow.match(/\n  backend-tests:\n([\s\S]*?)\n  frontend-build:/)?.[1] || '';

  assert.equal(workflow.match(new RegExp(`actions/checkout@${NODE24_ACTION_PINS.checkout}`, 'g'))?.length, 3);
  assert.equal(workflow.match(new RegExp(`actions/setup-node@${NODE24_ACTION_PINS.setupNode}`, 'g'))?.length, 2);
  assert.equal(workflow.match(new RegExp(`actions/setup-java@${NODE24_ACTION_PINS.setupJava}`, 'g'))?.length, 2);
  assert.match(governance, new RegExp(`actions/setup-java@${NODE24_ACTION_PINS.setupJava}`));
  assert.doesNotMatch(governance, /cache:\s*maven/);
  assert.match(backend, new RegExp(`actions/setup-java@${NODE24_ACTION_PINS.setupJava}`));
  assert.match(backend, /cache:\s*maven/);
});

function withRoot(fn) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-ci-coverage-hardening-'));
  try {
    return fn(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function writeWorkflow(root, lines) {
  const file = path.join(root, '.github/workflows/ci.yml');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${lines.join('\n')}\n`);
}

function writeHistoricalBaseline(root) {
  const file = path.join(root, 'ai/rules/ruoyi-legacy-baseline.json');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify({
    schemaVersion: 1,
    componentFiles: [{
      file: 'legacy.vue',
      sourceCommit: '3333333333333333333333333333333333333333'
    }]
  }, null, 2)}\n`);
}

function completeRunSteps(indent = '      ') {
  return [
    `${indent}- run: npm ci`,
    `${indent}- run: npm run check`,
    `${indent}- run: npm test`,
    `${indent}- run: mvn -pl ruoyi-business -am -Pintegration-test verify`,
    `${indent}- run: npm --prefix ruoyi-ui ci`,
    `${indent}- run: npm --prefix ruoyi-ui test`,
    `${indent}- run: npm --prefix ruoyi-ui audit --audit-level=moderate --include=dev`,
    `${indent}- run: npm --prefix ruoyi-ui run build:prod`
  ];
}

function missingCoverageCodes(result) {
  return new Set(result.failures.map((failure) => failure.code));
}

const REQUIRED_COVERAGE_FAILURES = [
  'node-governance-ci-missing',
  'root-npm-ci-missing',
  'root-npm-test-missing',
  'maven-unit-ci-missing',
  'maven-integration-ci-missing',
  'frontend-npm-ci-missing',
  'frontend-npm-test-missing',
  'frontend-audit-ci-missing',
  'frontend-build-ci-missing'
];

test('ci coverage accepts dedicated frontend tests and info low or moderate full audits', () => {
  for (const auditLevel of ['info', 'low', 'moderate']) {
    withRoot((root) => {
      const steps = completeRunSteps().map((line) => line.replace(
        '--audit-level=moderate --include=dev',
        `--audit-level=${auditLevel} --include=dev`
      ));
      writeWorkflow(root, [
        `name: accepted-${auditLevel}-audit`,
        'on: [push]',
        'jobs:',
        '  checks:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        `      - uses: actions/checkout@${CHECKOUT_SHA}`,
        ...steps
      ]);

      assert.deepEqual(validateCiCoverageDeclaration({ root }).failures, [], auditLevel);
    });
  }
});

test('ci coverage accepts Maven show-version while still running verification', () => withRoot((root) => {
  const steps = completeRunSteps();
  steps[3] = '      - run: mvn -V -pl ruoyi-business -am -Pintegration-test verify';
  writeWorkflow(root, [
    'name: maven-show-version',
    'on: [push]',
    'jobs:',
    '  checks:',
    '    runs-on: ubuntu-latest',
    '    steps:',
    `      - uses: actions/checkout@${CHECKOUT_SHA}`,
    ...steps
  ]);

  assert.deepEqual(validateCiCoverageDeclaration({ root }).failures, []);
}));

test('ci coverage rejects Maven test weakening from workflow container job or step environments', () => {
  const scenarios = [
    { scope: 'workflow', key: 'MAVEN_OPTS', value: '-DskipTests -DskipITs' },
    { scope: 'container', key: 'MAVEN_OPTS', value: '-DskipTests' },
    { scope: 'step', key: 'MAVEN_OPTS', value: '-Dmaven.test.skip.exec=true' },
    { scope: 'job', key: 'MAVEN_ARGS', value: '-DskipTests' },
    { scope: 'step', key: 'JAVA_TOOL_OPTIONS', value: '-Dgroups=NoSuchCategory' },
    { scope: 'step', key: 'JDK_JAVA_OPTIONS', value: '-Dmaven.test.failure.ignore=true' },
    { scope: 'step', key: '_JAVA_OPTIONS', value: '${{ secrets.TEST_JVM_OPTIONS }}' }
  ];
  for (const scenario of scenarios) {
    withRoot((root) => {
      const lines = [
        `name: maven-env-${scenario.scope}`,
        'on: [push]',
        ...(scenario.scope === 'workflow' ? ['env:', `  ${scenario.key}: ${JSON.stringify(scenario.value)}`] : []),
        'jobs:',
        '  checks:',
        '    runs-on: ubuntu-latest',
        ...(scenario.scope === 'container' ? [
          '    container:',
          `      image: node@sha256:${IMAGE_DIGEST}`,
          '      env:',
          `        ${scenario.key}: ${JSON.stringify(scenario.value)}`
        ] : []),
        ...(scenario.scope === 'job' ? ['    env:', `      ${scenario.key}: ${JSON.stringify(scenario.value)}`] : []),
        '    steps:',
        `      - uses: actions/checkout@${CHECKOUT_SHA}`
      ];
      for (const step of completeRunSteps()) {
        lines.push(step);
        if (scenario.scope === 'step' && step.includes('mvn ')) {
          lines.push('        env:', `          ${scenario.key}: ${JSON.stringify(scenario.value)}`);
        }
      }
      writeWorkflow(root, lines);

      const codes = missingCoverageCodes(validateCiCoverageDeclaration({ root }));
      assert.ok(codes.has('maven-unit-ci-missing'), `${scenario.scope}:${scenario.key}`);
      assert.ok(codes.has('maven-integration-ci-missing'), `${scenario.scope}:${scenario.key}`);
      assert.ok(codes.has('maven-verification-environment-unsafe'), `${scenario.scope}:${scenario.key}`);
    });
  }
});

test('ci coverage accepts harmless Maven JVM environment options', () => withRoot((root) => {
  const steps = completeRunSteps();
  steps.splice(3, 1,
    '      - run: mvn -pl ruoyi-business -am -Pintegration-test verify',
    '        env:',
    '          MAVEN_OPTS: "-Xmx512m -Dfile.encoding=UTF-8"');
  writeWorkflow(root, [
    'name: harmless-maven-env',
    'on: [push]',
    'jobs:',
    '  checks:',
    '    runs-on: ubuntu-latest',
    '    steps:',
    `      - uses: actions/checkout@${CHECKOUT_SHA}`,
    ...steps
  ]);

  assert.deepEqual(validateCiCoverageDeclaration({ root }).failures, []);
}));

test('ci coverage requires a dedicated frontend test command', () => withRoot((root) => {
  const steps = completeRunSteps();
  steps.splice(5, 1);
  writeWorkflow(root, [
    'name: missing-frontend-test',
    'on: [push]',
    'jobs:',
    '  checks:',
    '    runs-on: ubuntu-latest',
    '    steps:',
    `      - uses: actions/checkout@${CHECKOUT_SHA}`,
    ...steps
  ]);

  const codes = missingCoverageCodes(validateCiCoverageDeclaration({ root }));
  assert.ok(codes.has('frontend-npm-test-missing'));
}));

test('ci coverage rejects if-present frontend tests that can skip a missing script', () => {
  for (const testCommand of [
    'npm --prefix ruoyi-ui run test --if-present',
    'npm --prefix ruoyi-ui test --if-present'
  ]) {
    withRoot((root) => {
      const steps = completeRunSteps();
      steps[5] = `      - run: ${testCommand}`;
      writeWorkflow(root, [
        'name: skippable-frontend-test',
        'on: [push]',
        'jobs:',
        '  checks:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        `      - uses: actions/checkout@${CHECKOUT_SHA}`,
        ...steps
      ]);

      const codes = missingCoverageCodes(validateCiCoverageDeclaration({ root }));
      assert.ok(codes.has('frontend-npm-test-missing'), testCommand);
    });
  }
});

test('ci coverage rejects weak ambiguous dynamic or dependency-omitting frontend audits', () => {
  const invalidAudits = [
    'npm --prefix ruoyi-ui audit --audit-level=high --include=dev',
    'npm --prefix ruoyi-ui audit --audit-level=critical --include=dev',
    'npm --prefix ruoyi-ui audit --audit-level=none --include=dev',
    'npm --prefix ruoyi-ui audit --include=dev',
    'npm --prefix ruoyi-ui audit --audit-level=${AUDIT_LEVEL} --include=dev',
    'npm --prefix ruoyi-ui audit --audit-level=moderate --audit-level=moderate --include=dev',
    'npm --prefix ruoyi-ui audit --audit-level=moderate --audit-level=high --include=dev',
    'npm --prefix ruoyi-ui audit --audit-level low --audit-level critical --include=dev',
    'npm --prefix ruoyi-ui audit --audit-level=moderate --omit=dev',
    'npm --prefix ruoyi-ui audit --audit-level=moderate --omit dev',
    'npm --prefix ruoyi-ui audit --audit-level=moderate --production',
    'npm --prefix ruoyi-ui audit --audit-level=moderate --only=prod',
    'npm --prefix ruoyi-ui audit fix --audit-level=moderate --include=dev',
    'npm --prefix=ruoyi-ui audit fix --force --audit-level=moderate --include=dev',
    'npm --prefix=ruoyi-ui/ audit fix --force --audit-level=moderate --include=dev',
    'npm --prefix ruoyi-ui/ audit fix --force --audit-level=moderate --include=dev',
    'cd ruoyi-ui && npm audit fix --force --audit-level=moderate --include=dev',
    'npm --prefix ruoyi-ui audit --audit-level=moderate --include=dev --help',
    'npm --prefix ruoyi-ui audit --audit-level=moderate --include=dev --version',
    'npm --prefix ruoyi-ui audit --audit-level=moderate --include=dev --versions',
    'npm --prefix ruoyi-ui audit --audit-level=moderate --include=dev --usage'
  ];

  for (const auditCommand of invalidAudits) {
    withRoot((root) => {
      const steps = completeRunSteps();
      steps[6] = `      - run: ${auditCommand}`;
      writeWorkflow(root, [
        'name: rejected-frontend-audit',
        'on: [push]',
        'jobs:',
        '  checks:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        `      - uses: actions/checkout@${CHECKOUT_SHA}`,
        ...steps
      ]);

      const codes = missingCoverageCodes(validateCiCoverageDeclaration({ root }));
      assert.ok(codes.has('frontend-audit-ci-missing'), auditCommand);
    });
  }
});

test('ci coverage rejects required commands with skip or early-exit arguments', () => {
  const cases = [
    { index: 0, command: 'npm ci --dry-run', missing: ['root-npm-ci-missing'] },
    { index: 1, command: 'npm run check --if-present', missing: ['node-governance-ci-missing'] },
    { index: 2, command: 'npm test --help', missing: ['root-npm-test-missing'] },
    { index: 2, command: 'npm test --version', missing: ['root-npm-test-missing'] },
    {
      index: 3,
      command: 'mvn -pl ruoyi-business -am -Pintegration-test verify --help',
      missing: ['maven-unit-ci-missing', 'maven-integration-ci-missing']
    },
    {
      index: 3,
      command: 'mvn -v -pl ruoyi-business -am -Pintegration-test verify',
      missing: ['maven-unit-ci-missing', 'maven-integration-ci-missing']
    },
    {
      index: 3,
      command: 'mvn -pl ruoyi-common -am -Pintegration-test verify',
      missing: ['maven-integration-ci-missing']
    },
    {
      index: 3,
      command: 'mvn -f other-pom.xml -pl ruoyi-business -am -Pintegration-test verify',
      missing: ['maven-unit-ci-missing', 'maven-integration-ci-missing']
    },
    {
      index: 3,
      command: 'mvn -pl ruoyi-business -am -Pintegration-test -Dtest=NoTests verify',
      missing: ['maven-unit-ci-missing', 'maven-integration-ci-missing']
    },
    {
      index: 3,
      command: 'mvn -pl ruoyi-business -am -Pintegration-test -Dgroups=NoSuchCategory verify',
      missing: ['maven-unit-ci-missing', 'maven-integration-ci-missing']
    },
    {
      index: 3,
      command: 'mvn -pl ruoyi-business -am -Pintegration-test -DexcludedGroups=Integration verify',
      missing: ['maven-unit-ci-missing', 'maven-integration-ci-missing']
    },
    {
      index: 3,
      command: 'mvn -pl ruoyi-business -am -Pintegration-test -Dmaven.test.failure.ignore=true verify',
      missing: ['maven-unit-ci-missing', 'maven-integration-ci-missing']
    },
    {
      index: 3,
      command: 'mvn -pl ruoyi-business -Pintegration-test verify',
      missing: ['maven-integration-ci-missing']
    },
    { index: 4, command: 'npm --prefix ruoyi-ui ci --dry-run', missing: ['frontend-npm-ci-missing'] },
    { index: 4, command: 'npm --prefix ruoyi-ui ci --help', missing: ['frontend-npm-ci-missing'] },
    { index: 5, command: 'npm --prefix ruoyi-ui test --help', missing: ['frontend-npm-test-missing'] },
    { index: 5, command: 'npm --prefix ruoyi-ui test --version', missing: ['frontend-npm-test-missing'] },
    { index: 5, command: 'npm --prefix ruoyi-ui test --versions', missing: ['frontend-npm-test-missing'] },
    { index: 5, command: 'npm --prefix ruoyi-ui test --usage', missing: ['frontend-npm-test-missing'] },
    { index: 7, command: 'npm --prefix ruoyi-ui run build:prod --if-present', missing: ['frontend-build-ci-missing'] },
    { index: 7, command: 'npm --prefix ruoyi-ui run build:prod -- --help', missing: ['frontend-build-ci-missing'] },
    { index: 7, command: 'npm --prefix ruoyi-ui run build:prod -- --mode development', missing: ['frontend-build-ci-missing'] }
  ];

  for (const scenario of cases) {
    withRoot((root) => {
      const steps = completeRunSteps();
      steps[scenario.index] = `      - run: ${scenario.command}`;
      writeWorkflow(root, [
        'name: rejected-verification-arguments',
        'on: [push]',
        'jobs:',
        '  checks:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        `      - uses: actions/checkout@${CHECKOUT_SHA}`,
        ...steps
      ]);

      const codes = missingCoverageCodes(validateCiCoverageDeclaration({ root }));
      for (const missing of scenario.missing) {
        assert.ok(codes.has(missing), `${scenario.command} must report ${missing}`);
      }
    });
  }
});

test('ci coverage rejects duplicate or additional frontend audit attempts', () => {
  for (const extraAudit of [
    'npm --prefix ruoyi-ui audit --audit-level=moderate --include=dev',
    'npm --prefix ruoyi-ui audit fix --audit-level=moderate --include=dev',
    'npm --prefix ruoyi-ui audit --audit-level=high --omit=dev',
    'npm --prefix=ruoyi-ui audit fix --force --audit-level=moderate --include=dev',
    'npm --prefix=ruoyi-ui/ audit fix --force --audit-level=moderate --include=dev',
    'npm --prefix ruoyi-ui/ audit fix --force --audit-level=moderate --include=dev',
    'npm --prefix=./ruoyi-ui// audit fix --force --audit-level=moderate --include=dev',
    "npm --prefix '.\\ruoyi-ui\\' audit fix --force --audit-level=moderate --include=dev",
    'npm --prefix="$GITHUB_WORKSPACE/ruoyi-ui" audit fix --force --audit-level=moderate --include=dev',
    'npm --prefix="$FRONTEND_DIR" audit fix --force --audit-level=moderate --include=dev',
    'cd ./foo/../ruoyi-ui && npm audit fix --force --audit-level=moderate --include=dev',
    'cd ruoyi-ui && npm audit fix --force --audit-level=moderate --include=dev'
  ]) {
    withRoot((root) => {
      writeWorkflow(root, [
        'name: extra-frontend-audit',
        'on: [push]',
        'jobs:',
        '  checks:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        `      - uses: actions/checkout@${CHECKOUT_SHA}`,
        ...completeRunSteps(),
        `      - run: ${extraAudit}`
      ]);

      const codes = missingCoverageCodes(validateCiCoverageDeclaration({ root }));
      assert.ok(codes.has('frontend-audit-ci-missing'), extraAudit);
    });
  }
});

test('ci coverage allows a separate root audit alongside one frontend audit', () => withRoot((root) => {
  writeWorkflow(root, [
    'name: root-and-frontend-audits',
    'on: [push]',
    'jobs:',
    '  checks:',
    '    runs-on: ubuntu-latest',
    '    steps:',
    `      - uses: actions/checkout@${CHECKOUT_SHA}`,
    ...completeRunSteps(),
    '      - run: npm audit --audit-level=moderate --include=dev'
  ]);

  assert.deepEqual(validateCiCoverageDeclaration({ root }).failures, []);
}));

test('ci coverage rejects frontend audit attempts through equivalent directories and npm wrappers', () => {
  const scenarios = [
    { command: 'npm audit fix --force', workingDirectory: 'ruoyi-ui/.' },
    { command: 'npm audit fix --force', workingDirectory: 'foo/../ruoyi-ui' },
    { command: 'npm audit fix --force', workingDirectory: '/home/runner/work/repo/ruoyi-ui' },
    { command: '/usr/bin/npm --prefix ruoyi-ui audit fix --force' },
    { command: 'command npm --prefix ruoyi-ui audit fix --force' },
    { command: '/usr/bin/env npm --prefix ruoyi-ui audit fix --force' },
    { command: '$(command -v npm) --prefix ruoyi-ui audit fix --force' },
    { command: '$NPM --prefix ruoyi-ui audit fix --force' },
    { command: 'cd -- ruoyi-ui && npm audit fix --force' }
  ];
  for (const scenario of scenarios) {
    withRoot((root) => {
      writeWorkflow(root, [
        'name: equivalent-frontend-audit-attempt',
        'on: [push]',
        'jobs:',
        '  checks:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        `      - uses: actions/checkout@${CHECKOUT_SHA}`,
        ...completeRunSteps(),
        `      - run: ${scenario.command}`,
        ...(scenario.workingDirectory ? [`        working-directory: ${scenario.workingDirectory}`] : [])
      ]);

      const codes = missingCoverageCodes(validateCiCoverageDeclaration({ root }));
      assert.ok(codes.has('frontend-audit-ci-missing'), JSON.stringify(scenario));
    });
  }
});

test('ci coverage rejects frontend audit programs executed from YAML environment values', () => withRoot((root) => {
  writeWorkflow(root, [
    'name: environment-audit-program',
    'on: [push]',
    'jobs:',
    '  checks:',
    '    runs-on: ubuntu-latest',
    '    steps:',
    `      - uses: actions/checkout@${CHECKOUT_SHA}`,
    ...completeRunSteps(),
    '      - run: bash -c "$AUDIT_COMMAND"',
    '        env:',
    '          AUDIT_COMMAND: npm --prefix ruoyi-ui audit fix --force'
  ]);

  const codes = missingCoverageCodes(validateCiCoverageDeclaration({ root }));
  assert.ok(codes.has('frontend-audit-ci-missing'));
}));

test('ci coverage rejects npm executables resolved from YAML environment values', () => {
  for (const executable of [
    '$PM',
    '${PM}',
    '${{ env.PM }}',
    '${{env.PM}}',
    "${{ env['PM'] }}",
    '${{ env["PM"] }}',
    '$env:PM',
    '${env:PM}'
  ]) {
    withRoot((root) => {
      writeWorkflow(root, [
        'name: environment-npm-executable',
        'on: [push]',
        'jobs:',
        '  checks:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        `      - uses: actions/checkout@${CHECKOUT_SHA}`,
        ...completeRunSteps(),
        '      - run: |',
        `          ${executable} --prefix ruoyi-ui audit fix --force`,
        '        env:',
        '          PM: npm'
      ]);

      const codes = missingCoverageCodes(validateCiCoverageDeclaration({ root }));
      assert.ok(codes.has('frontend-audit-ci-missing'), executable);
    });
  }
});

test('ci coverage rejects dynamic npm executable wrappers and nested shell programs', () => {
  for (const scenario of [
    { command: '$(printenv PM) --prefix ruoyi-ui audit fix --force' },
    { command: 'exec "$PM" --prefix ruoyi-ui audit fix --force' },
    { command: "bash -c '${PM} --prefix ruoyi-ui audit fix --force'" },
    { command: "bash -c '${{ env.PM }} --prefix ruoyi-ui audit fix --force'" },
    { command: '& ${env:PM} --prefix ruoyi-ui audit fix --force' },
    { command: '& $env:PM --prefix ruoyi-ui audit fix --force' },
    { command: 'time "$PM" --prefix ruoyi-ui audit fix --force' },
    {
      command: '${!PROGRAM} --prefix ruoyi-ui audit fix --force',
      environment: ['          PROGRAM: PM']
    },
    { command: "bash -lc '${PM} --prefix ruoyi-ui audit fix --force'" },
    { command: "bash -ec '${PM} --prefix ruoyi-ui audit fix --force'" },
    { command: '$(command -v "$PM") --prefix ruoyi-ui audit fix --force' },
    {
      command: "${{ env['PACKAGE-MANAGER'] }} --prefix ruoyi-ui audit fix --force",
      environment: ['          PACKAGE-MANAGER: npm']
    },
    { command: '${{ vars.PM }} --prefix ruoyi-ui audit fix --force' },
    {
      command: '${{ matrix.pm }} --prefix ruoyi-ui audit fix --force',
      jobSettings: ['    strategy:', '      matrix:', '        pm: [npm]']
    },
    {
      command: 'npm --prefix ruoyi-ui "$TASK" fix --force',
      environment: ['          TASK: audit']
    },
    {
      command: 'npm --prefix ruoyi-ui ${{ env.TASK }} fix --force',
      environment: ['          TASK: audit']
    },
    {
      command: 'npm "$TASK" fix --force',
      workingDirectory: 'ruoyi-ui',
      environment: ['          TASK: audit']
    },
    {
      command: '"$PM" $ARGS',
      environment: ['          ARGS: "--prefix ruoyi-ui audit fix --force"']
    },
    {
      command: 'npm --prefix "$FRONTEND_DIR" "$TASK" fix --force',
      environment: ['          FRONTEND_DIR: ruoyi-ui', '          TASK: audit']
    },
    { command: 'npm --prefix "${{ vars.FRONTEND }}" "${{ vars.TASK }}" fix --force' },
    {
      command: 'npm --prefix ruoyi-ui "${{ matrix.task }}" fix --force',
      jobSettings: ['    strategy:', '      matrix:', '        task: [audit]']
    },
    {
      command: 'npm "$TASK" fix --force',
      environment: ['          NPM_CONFIG_PREFIX: ruoyi-ui', '          TASK: audit']
    },
    {
      command: '${{ matrix.command }}',
      jobSettings: [
        '    strategy:',
        '      matrix:',
        '        command: ["npm --prefix ruoyi-ui audit fix --force"]'
      ]
    },
    {
      command: '${{ matrix.pm }} ${{ matrix.args }}',
      jobSettings: [
        '    strategy:',
        '      matrix:',
        '        pm: [npm]',
        '        args: ["--prefix ruoyi-ui audit fix --force"]'
      ]
    },
    {
      command: 'time ${{ matrix.command }}',
      jobSettings: [
        '    strategy:',
        '      matrix:',
        '        command: ["npm --prefix ruoyi-ui audit fix --force"]'
      ]
    },
    {
      command: '/usr/bin/time -f "%E" ${{ matrix.command }}',
      jobSettings: [
        '    strategy:',
        '      matrix:',
        '        command: ["npm --prefix ruoyi-ui audit fix --force"]'
      ]
    },
    {
      command: 'timeout 30 ${{ matrix.command }}',
      jobSettings: [
        '    strategy:',
        '      matrix:',
        '        command: ["npm --prefix ruoyi-ui audit fix --force"]'
      ]
    },
    {
      command: 'nice -n 5 ${{ matrix.command }}',
      jobSettings: [
        '    strategy:',
        '      matrix:',
        '        command: ["npm --prefix ruoyi-ui audit fix --force"]'
      ]
    },
    {
      command: 'stdbuf -oL ${{ matrix.command }}',
      jobSettings: [
        '    strategy:',
        '      matrix:',
        '        command: ["npm --prefix ruoyi-ui audit fix --force"]'
      ]
    },
    {
      command: 'chrt -f 50 ${{ matrix.command }}',
      jobSettings: [
        '    strategy:',
        '      matrix:',
        '        command: ["npm --prefix ruoyi-ui audit fix --force"]'
      ]
    },
    {
      command: 'ionice -c 2 -n 0 ${{ matrix.command }}',
      jobSettings: [
        '    strategy:',
        '      matrix:',
        '        command: ["npm --prefix ruoyi-ui audit fix --force"]'
      ]
    },
    { command: '${{ vars.CI_COMMAND }}' }
  ]) {
    withRoot((root) => {
      writeWorkflow(root, [
        'name: dynamic-environment-npm-executable',
        'on: [push]',
        'jobs:',
        '  checks:',
        ...(scenario.jobSettings || []),
        '    runs-on: ubuntu-latest',
        '    steps:',
        `      - uses: actions/checkout@${CHECKOUT_SHA}`,
        ...completeRunSteps(),
        '      - run: |',
        `          ${scenario.command}`,
        ...(scenario.workingDirectory ? [`        working-directory: ${scenario.workingDirectory}`] : []),
        '        env:',
        '          PM: npm',
        ...(scenario.environment || [])
      ]);

      const codes = missingCoverageCodes(validateCiCoverageDeclaration({ root }));
      assert.ok(codes.has('frontend-audit-ci-missing'), JSON.stringify(scenario));
    });
  }
});

test('ci coverage tracks simple run-block environment assignments across shells', () => {
  for (const scenario of [
    {
      lines: ['ARGS="--prefix ruoyi-ui audit fix --force"', 'npm $ARGS']
    },
    {
      lines: ["export ARGS='--prefix ruoyi-ui audit fix --force'", 'npm $ARGS']
    },
    {
      lines: ["$env:NPM_ARGS = '--prefix ruoyi-ui audit fix --force'", 'npm $env:NPM_ARGS'],
      shell: 'pwsh'
    },
    {
      lines: ['set "NPM_ARGS=--prefix ruoyi-ui audit fix --force"', 'npm %NPM_ARGS%'],
      shell: 'cmd'
    }
  ]) {
    withRoot((root) => {
      writeWorkflow(root, [
        'name: local-environment-audit-program',
        'on: [push]',
        'jobs:',
        '  checks:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        `      - uses: actions/checkout@${CHECKOUT_SHA}`,
        ...completeRunSteps(),
        '      - run: |',
        ...scenario.lines.map((line) => `          ${line}`),
        ...(scenario.shell ? [`        shell: ${scenario.shell}`] : [])
      ]);

      const codes = missingCoverageCodes(validateCiCoverageDeclaration({ root }));
      assert.ok(codes.has('frontend-audit-ci-missing'), JSON.stringify(scenario));
    });
  }
});

test('ci coverage allows simple run-block assignments that resolve to root audits', () => withRoot((root) => {
  writeWorkflow(root, [
    'name: local-root-audit-program',
    'on: [push]',
    'jobs:',
    '  checks:',
    '    runs-on: ubuntu-latest',
    '    steps:',
    `      - uses: actions/checkout@${CHECKOUT_SHA}`,
    ...completeRunSteps(),
    '      - run: |',
    '          ARGS="audit --audit-level=moderate --include=dev"',
    '          npm $ARGS'
  ]);

  assert.deepEqual(validateCiCoverageDeclaration({ root }).failures, []);
}));

test('ci coverage resolves known root path aliases before frontend audit classification', () => {
  for (const scenario of [
    {
      command: 'npm --prefix "$ROOT_DIR" audit --audit-level=moderate --include=dev',
      environment: ['          ROOT_DIR: ${{ github.workspace }}']
    },
    {
      command: 'npm "$TASK" --audit-level=moderate --include=dev',
      environment: ['          TASK: audit']
    },
    {
      command: 'npm "$TASK" --audit-level=moderate --include=dev',
      environment: ['          NPM_CONFIG_PREFIX: ${{ github.workspace }}', '          TASK: audit']
    }
  ]) {
    withRoot((root) => {
      writeWorkflow(root, [
        'name: known-root-alias-audit',
        'on: [push]',
        'jobs:',
        '  checks:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        `      - uses: actions/checkout@${CHECKOUT_SHA}`,
        ...completeRunSteps(),
        '      - run: |',
        `          ${scenario.command}`,
        '        env:',
        ...scenario.environment
      ]);

      assert.deepEqual(validateCiCoverageDeclaration({ root }).failures, [], scenario.command);
    });
  }
});

test('ci coverage allows environment-resolved npm executables for repository root audits', () => {
  for (const command of [
    "${{ env['PM'] }} audit --audit-level=moderate --include=dev",
    '$(printenv PM) audit --audit-level=moderate --include=dev',
    'exec "$PM" audit --audit-level=moderate --include=dev',
    "bash -c '${PM} audit --audit-level=moderate --include=dev'",
    '& ${env:PM} audit --audit-level=moderate --include=dev',
    '${!PM_KEY} audit --audit-level=moderate --include=dev',
    '${{ vars.PM }} audit --audit-level=moderate --include=dev',
    '${{ matrix.pm }} audit --audit-level=moderate --include=dev'
  ]) {
    withRoot((root) => {
      writeWorkflow(root, [
        'name: dynamic-root-audit',
        'on: [push]',
        'jobs:',
        '  checks:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        `      - uses: actions/checkout@${CHECKOUT_SHA}`,
        ...completeRunSteps(),
        '      - run: |',
        `          ${command}`,
        '        env:',
        '          PM: npm',
        '          PM_KEY: PM'
      ]);

      assert.deepEqual(validateCiCoverageDeclaration({ root }).failures, [], command);
    });
  }
});

test('ci coverage rejects persistent GitHub environment and path mutation', () => {
  for (const target of ['GITHUB_ENV', 'GITHUB_PATH']) {
    withRoot((root) => {
      writeWorkflow(root, [
        `name: persistent-${target.toLowerCase()}`,
        'on: [push]',
        'jobs:',
        '  checks:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        `      - uses: actions/checkout@${CHECKOUT_SHA}`,
        '      - run: |',
        `          printf "MAVEN_OPTS=-DskipTests\\n" >> "$${target}"`,
        ...completeRunSteps()
      ]);

      const codes = missingCoverageCodes(validateCiCoverageDeclaration({ root }));
      assert.ok(codes.has('ci-persistent-environment-mutation'), target);
    });
  }
});

test('ci coverage allows known dynamic root paths alongside one frontend audit', () => {
  for (const command of [
    'npm --prefix "$GITHUB_WORKSPACE" audit --audit-level=moderate --include=dev',
    'cd "$GITHUB_WORKSPACE" && npm audit --audit-level=moderate --include=dev',
    'npm --prefix "$PWD" audit --audit-level=moderate --include=dev',
    'cd "$PWD" && npm audit --audit-level=moderate --include=dev'
  ]) {
    withRoot((root) => {
      writeWorkflow(root, [
        'name: dynamic-root-audit',
        'on: [push]',
        'jobs:',
        '  checks:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        `      - uses: actions/checkout@${CHECKOUT_SHA}`,
        ...completeRunSteps(),
        `      - run: ${command}`
      ]);

      assert.deepEqual(validateCiCoverageDeclaration({ root }).failures, [], command);
    });
  }
});

test('invalid or masked frontend verification attempts still receive failure-mask analysis', () => {
  for (const [index, command, missing] of [
    [5, 'npm --prefix ruoyi-ui test || true', 'frontend-npm-test-missing'],
    [5, 'npm --prefix ruoyi-ui run test --if-present || true', 'frontend-npm-test-missing'],
    [6, 'npm --prefix ruoyi-ui audit --audit-level=moderate --include=dev || true', 'frontend-audit-ci-missing'],
    [6, 'npm --prefix ruoyi-ui audit --audit-level=high --omit=dev || true', 'frontend-audit-ci-missing']
  ]) {
    withRoot((root) => {
      const steps = completeRunSteps();
      steps[index] = `      - run: ${command}`;
      writeWorkflow(root, [
        'name: masked-frontend-verification',
        'on: [push]',
        'jobs:',
        '  checks:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        `      - uses: actions/checkout@${CHECKOUT_SHA}`,
        ...steps
      ]);

      const codes = missingCoverageCodes(validateCiCoverageDeclaration({ root }));
      assert.ok(codes.has('ci-required-command-failure-masked'), command);
      assert.ok(codes.has(missing), command);
    });
  }
});

test('ci coverage does not count required commands from a job guarded by if', () => withRoot((root) => {
  writeWorkflow(root, [
    'name: conditional-job',
    'on: [push]',
    'jobs:',
    '  checks:',
    '    if: false',
    '    runs-on: ubuntu-latest',
    '    steps:',
    `      - uses: actions/checkout@${CHECKOUT_SHA}`,
    ...completeRunSteps()
  ]);

  const codes = missingCoverageCodes(validateCiCoverageDeclaration({ root }));
  for (const code of REQUIRED_COVERAGE_FAILURES) {
    assert.ok(codes.has(code), code);
  }
}));

test('ci coverage does not count required commands from steps guarded by if', () => withRoot((root) => {
  const guardedSteps = completeRunSteps().flatMap((line) => [
    line,
    "        if: ${{ github.event_name == 'push' }}"
  ]);
  writeWorkflow(root, [
    'name: conditional-steps',
    'on: [push]',
    'jobs:',
    '  checks:',
    '    runs-on: ubuntu-latest',
    '    steps:',
    `      - uses: actions/checkout@${CHECKOUT_SHA}`,
    ...guardedSteps
  ]);

  const codes = missingCoverageCodes(validateCiCoverageDeclaration({ root }));
  for (const code of REQUIRED_COVERAGE_FAILURES) {
    assert.ok(codes.has(code), code);
  }
}));

test('ci uses validation covers job reusable workflows, missing refs, and Docker tags', () => withRoot((root) => {
  writeWorkflow(root, [
    'name: uses-hardening',
    'on: [push]',
    'jobs:',
    '  mutable-reusable:',
    '    uses: example/repository/.github/workflows/reusable.yml@main',
    '  checks:',
    '    runs-on: ubuntu-latest',
    '    steps:',
    `      - uses: actions/checkout@${CHECKOUT_SHA}`,
    '      - uses: example/action',
    '      - uses: docker://alpine:3.20',
    ...completeRunSteps()
  ]);

  const result = validateCiCoverageDeclaration({ root });
  const unpinned = result.failures.filter((failure) => failure.code === 'ci-action-ref-unpinned');
  assert.equal(unpinned.length, 2);
  assert.ok(result.failures.some((failure) => failure.code === 'ci-docker-image-unpinned'));
}));

test('ci uses validation accepts SHA-pinned external refs, digest-pinned Docker, and local uses', () => withRoot((root) => {
  writeWorkflow(root, [
    'name: pinned-uses',
    'on: [push]',
    'jobs:',
    '  pinned-reusable:',
    `    uses: example/repository/.github/workflows/reusable.yml@${REUSABLE_SHA}`,
    '  local-reusable:',
    '    uses: ./.github/workflows/reusable.yml',
    '  checks:',
    '    runs-on: ubuntu-latest',
    '    steps:',
    `      - uses: actions/checkout@${CHECKOUT_SHA}`,
    '      - uses: ./path/to/local-action',
    `      - uses: docker://alpine@sha256:${IMAGE_DIGEST}`,
    ...completeRunSteps()
  ]);

  assert.deepEqual(validateCiCoverageDeclaration({ root }).failures, []);
}));

test('ci checkout requires full history when legacy baselines reference source commits', () => withRoot((root) => {
  writeHistoricalBaseline(root);
  writeWorkflow(root, [
    'name: shallow-checkout',
    'on: [push]',
    'jobs:',
    '  checks:',
    '    runs-on: ubuntu-latest',
    '    steps:',
    `      - uses: actions/checkout@${CHECKOUT_SHA}`,
    ...completeRunSteps()
  ]);

  const result = validateCiCoverageDeclaration({ root });
  assert.ok(result.failures.some((failure) => failure.code === 'ci-checkout-full-history-required'));
}));

test('ci checkout accepts explicit fetch-depth zero for historical baselines', () => withRoot((root) => {
  writeHistoricalBaseline(root);
  writeWorkflow(root, [
    'name: full-history-checkout',
    'on: [push]',
    'jobs:',
    '  checks:',
    '    runs-on: ubuntu-latest',
    '    steps:',
    `      - uses: actions/checkout@${CHECKOUT_SHA}`,
    '        with:',
    '          fetch-depth: 0',
    ...completeRunSteps()
  ]);

  assert.deepEqual(validateCiCoverageDeclaration({ root }).failures, []);
}));

test('ci uses validation ignores uses-looking command text inside a run block', () => withRoot((root) => {
  writeWorkflow(root, [
    'name: run-block-text',
    'on: [push]',
    'jobs:',
    '  checks:',
    '    runs-on: ubuntu-latest',
    '    steps:',
    `      - uses: actions/checkout@${CHECKOUT_SHA}`,
    '      - run: |',
    '          uses: example/action@main',
    ...completeRunSteps()
  ]);

  assert.deepEqual(validateCiCoverageDeclaration({ root }).failures, []);
}));

test('ci checkout does not accept nested run text as fetch-depth input', () => withRoot((root) => {
  writeHistoricalBaseline(root);
  writeWorkflow(root, [
    'name: nested-fetch-depth',
    'on: [push]',
    'jobs:',
    '  checks:',
    '    runs-on: ubuntu-latest',
    '    steps:',
    `      - uses: actions/checkout@${CHECKOUT_SHA}`,
    '        with:',
    '          sparse-checkout: |',
    '            fetch-depth: 0',
    ...completeRunSteps()
  ]);

  const result = validateCiCoverageDeclaration({ root });
  assert.ok(result.failures.some((failure) => failure.code === 'ci-checkout-full-history-required'));
}));

test('ci coverage treats single- and double-quoted if keys as real conditions', () => {
  for (const quote of ["'", '"']) {
    withRoot((root) => {
      writeWorkflow(root, [
        'name: quoted-job-condition',
        'on: [push]',
        'jobs:',
        '  checks:',
        `    ${quote}if${quote}: false`,
        '    runs-on: ubuntu-latest',
        '    steps:',
        `      - uses: actions/checkout@${CHECKOUT_SHA}`,
        ...completeRunSteps()
      ]);

      const codes = missingCoverageCodes(validateCiCoverageDeclaration({ root }));
      for (const code of REQUIRED_COVERAGE_FAILURES) {
        assert.ok(codes.has(code), `${quote} job ${code}`);
      }
    });

    withRoot((root) => {
      const guardedSteps = completeRunSteps().flatMap((line) => [
        line,
        `        ${quote}if${quote}: false`
      ]);
      writeWorkflow(root, [
        'name: quoted-step-condition',
        'on: [push]',
        'jobs:',
        '  checks:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        `      - uses: actions/checkout@${CHECKOUT_SHA}`,
        ...guardedSteps
      ]);

      const codes = missingCoverageCodes(validateCiCoverageDeclaration({ root }));
      for (const code of REQUIRED_COVERAGE_FAILURES) {
        assert.ok(codes.has(code), `${quote} step ${code}`);
      }
    });
  }
});

test('ci uses validation parses single- and double-quoted uses keys', () => {
  for (const quote of ["'", '"']) {
    withRoot((root) => {
      writeWorkflow(root, [
        'name: quoted-uses',
        'on: [push]',
        'jobs:',
        '  reusable:',
        `    ${quote}uses${quote}: example/repository/.github/workflows/reusable.yml@main`,
        '  checks:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        `      - ${quote}uses${quote}: actions/checkout@${CHECKOUT_SHA}`,
        `      - ${quote}uses${quote}: docker://alpine:3.20`,
        ...completeRunSteps()
      ]);

      const result = validateCiCoverageDeclaration({ root });
      assert.ok(result.failures.some((failure) => failure.code === 'ci-action-ref-unpinned'), quote);
      assert.ok(result.failures.some((failure) => failure.code === 'ci-docker-image-unpinned'), quote);
    });
  }
});

test('ci checkout parses quoted uses, with, and fetch-depth keys', () => {
  for (const quote of ["'", '"']) {
    withRoot((root) => {
      writeHistoricalBaseline(root);
      writeWorkflow(root, [
        'name: quoted-checkout-inputs',
        'on: [push]',
        'jobs:',
        '  checks:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        `      - ${quote}uses${quote}: actions/checkout@${CHECKOUT_SHA}`,
        `        ${quote}with${quote}:`,
        `          ${quote}fetch-depth${quote}: 0`,
        ...completeRunSteps()
      ]);

      assert.deepEqual(validateCiCoverageDeclaration({ root }).failures, [], quote);
    });
  }
});

test('ci coverage counts run commands only from jobs steps, not matrix include data', () => withRoot((root) => {
  writeWorkflow(root, [
    'name: matrix-pseudo-run',
    'on: [push]',
    'jobs:',
    '  checks:',
    '    strategy:',
    '      matrix:',
    '        include:',
    '          - label: fake-coverage',
    '            run: |',
    ...completeRunSteps('').map((line) => `              ${line.replace(/^- run:\s*/, '')}`),
    '    runs-on: ubuntu-latest',
    '    steps:',
    `      - uses: actions/checkout@${CHECKOUT_SHA}`
  ]);

  const codes = missingCoverageCodes(validateCiCoverageDeclaration({ root }));
  for (const code of REQUIRED_COVERAGE_FAILURES) {
    assert.ok(codes.has(code), code);
  }
}));

test('ci coverage rejects expression continue-on-error and does not count affected commands', () => withRoot((root) => {
  const ignoredSteps = completeRunSteps().flatMap((line) => [
    line,
    '        continue-on-error: ${{ true }}'
  ]);
  writeWorkflow(root, [
    'name: expression-continue-on-error',
    'on: [push]',
    'jobs:',
    '  checks:',
    '    runs-on: ubuntu-latest',
    '    steps:',
    `      - uses: actions/checkout@${CHECKOUT_SHA}`,
    ...ignoredSteps
  ]);

  const result = validateCiCoverageDeclaration({ root });
  const codes = missingCoverageCodes(result);
  assert.ok(codes.has('ci-continue-on-error'));
  for (const code of REQUIRED_COVERAGE_FAILURES) {
    assert.ok(codes.has(code), code);
  }
}));

test('ci coverage accepts the explicit boolean false for continue-on-error', () => withRoot((root) => {
  const failClosedSteps = completeRunSteps().flatMap((line) => [
    line,
    '        continue-on-error: false'
  ]);
  writeWorkflow(root, [
    'name: explicit-false-continue-on-error',
    'on: [push]',
    'jobs:',
    '  checks:',
    '    runs-on: ubuntu-latest',
    '    steps:',
    `      - uses: actions/checkout@${CHECKOUT_SHA}`,
    ...failClosedSteps
  ]);

  assert.deepEqual(validateCiCoverageDeclaration({ root }).failures, []);
}));

test('ci coverage does not count required command text inside a shell heredoc body', () => withRoot((root) => {
  writeWorkflow(root, [
    'name: heredoc-pseudo-commands',
    'on: [push]',
    'jobs:',
    '  checks:',
    '    runs-on: ubuntu-latest',
    '    steps:',
    `      - uses: actions/checkout@${CHECKOUT_SHA}`,
    '      - run: |',
    "          cat <<'EOF'",
    ...completeRunSteps('').map((line) => `          ${line.replace(/^- run:\s*/, '')}`),
    '          EOF'
  ]);

  const codes = missingCoverageCodes(validateCiCoverageDeclaration({ root }));
  for (const code of REQUIRED_COVERAGE_FAILURES) {
    assert.ok(codes.has(code), code);
  }
}));

test('ci coverage resolves escaped YAML keys before applying step conditions', () => withRoot((root) => {
  const guardedSteps = completeRunSteps().flatMap((line) => [
    line,
    '        "\\u0069f": false'
  ]);
  writeWorkflow(root, [
    'name: escaped-if-key',
    'on: [push]',
    'jobs:',
    '  checks:',
    '    runs-on: ubuntu-latest',
    '    steps:',
    `      - uses: actions/checkout@${CHECKOUT_SHA}`,
    ...guardedSteps
  ]);

  const codes = missingCoverageCodes(validateCiCoverageDeclaration({ root }));
  for (const code of REQUIRED_COVERAGE_FAILURES) {
    assert.ok(codes.has(code), code);
  }
}));

test('ci coverage counts only dedicated run-step programs, not nested or short-circuited command text', () => {
  const commands = completeRunSteps('').map((line) => line.replace(/^- run:\s*/, ''));
  const attacks = [
    {
      name: 'quoted-payload',
      lines: ["payload='", ...commands, "'"]
    },
    {
      name: 'early-exit',
      lines: ['exit 0', ...commands]
    },
    {
      name: 'uninvoked-function',
      lines: ['fake_verification() {', ...commands.map((line) => `  ${line}`), '}']
    },
    {
      name: 'false-conditional',
      lines: ['if false; then', ...commands.map((line) => `  ${line}`), 'fi']
    },
    {
      name: 'command-substitution',
      lines: ['payload="$(', ...commands, ')"']
    },
    {
      name: 'subshell-group',
      lines: ['(', ...commands, ')']
    },
    {
      name: 'brace-group',
      lines: ['{', ...commands, '}']
    },
    {
      name: 'non-matching-case',
      lines: ['case never in', '  match)', ...commands.map((line) => `    ${line}`), '    ;;', 'esac']
    }
  ];

  for (const attack of attacks) {
    withRoot((root) => {
      writeWorkflow(root, [
        `name: ${attack.name}`,
        'on: [push]',
        'jobs:',
        '  checks:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        `      - uses: actions/checkout@${CHECKOUT_SHA}`,
        '      - run: |',
        ...attack.lines.map((line) => `          ${line}`)
      ]);

      const codes = missingCoverageCodes(validateCiCoverageDeclaration({ root }));
      for (const code of REQUIRED_COVERAGE_FAILURES) {
        assert.ok(codes.has(code), `${attack.name} ${code}`);
      }
    });
  }
});

test('ci coverage rejects custom and inherited shells for required verification commands', () => {
  const cases = [
    {
      name: 'step-shell',
      beforeJobs: [],
      jobSettings: [],
      steps: completeRunSteps().flatMap((line) => [
        line,
        '        shell: bash -c "exit 0" -- {0}'
      ])
    },
    {
      name: 'job-default-shell',
      beforeJobs: [],
      jobSettings: [
        '    defaults:',
        '      run:',
        '        shell: bash -c "exit 0" -- {0}'
      ],
      steps: completeRunSteps()
    },
    {
      name: 'workflow-default-shell',
      beforeJobs: [
        'defaults:',
        '  run:',
        '    shell: bash -c "exit 0" -- {0}'
      ],
      jobSettings: [],
      steps: completeRunSteps()
    }
  ];

  for (const item of cases) {
    withRoot((root) => {
      writeWorkflow(root, [
        `name: ${item.name}`,
        'on: [push]',
        ...item.beforeJobs,
        'jobs:',
        '  checks:',
        ...item.jobSettings,
        '    runs-on: ubuntu-latest',
        '    steps:',
        `      - uses: actions/checkout@${CHECKOUT_SHA}`,
        ...item.steps
      ]);

      const codes = missingCoverageCodes(validateCiCoverageDeclaration({ root }));
      for (const code of REQUIRED_COVERAGE_FAILURES) {
        assert.ok(codes.has(code), `${item.name} ${code}`);
      }
    });
  }
});

test('ci coverage rejects required verification jobs that can be skipped through needs', () => withRoot((root) => {
  writeWorkflow(root, [
    'name: skipped-needs-job',
    'on: [push]',
    'jobs:',
    '  blocker:',
    '    if: false',
    '    runs-on: ubuntu-latest',
    '    steps:',
    '      - run: true',
    '  checks:',
    '    needs: blocker',
    '    runs-on: ubuntu-latest',
    '    steps:',
    `      - uses: actions/checkout@${CHECKOUT_SHA}`,
    ...completeRunSteps()
  ]);

  const codes = missingCoverageCodes(validateCiCoverageDeclaration({ root }));
  for (const code of REQUIRED_COVERAGE_FAILURES) {
    assert.ok(codes.has(code), code);
  }
}));

test('ci required commands fail closed when shell constructs can mask failure', () => {
  const attacks = [
    {
      name: 'or-true',
      replace: ['      - run: npm ci || true'],
      index: 0,
      missing: 'root-npm-ci-missing'
    },
    {
      name: 'or-colon',
      replace: ['      - run: "npm run check || :"'],
      index: 1,
      missing: 'node-governance-ci-missing'
    },
    {
      name: 'semicolon-true',
      replace: ['      - run: npm test; true'],
      index: 2,
      missing: 'root-npm-test-missing'
    },
    {
      name: 'pipeline-without-pipefail',
      replace: [
        '      - run: |',
        '          mvn -pl ruoyi-business -am -Pintegration-test verify | tee maven.log'
      ],
      index: 3,
      missing: 'maven-integration-ci-missing'
    },
    {
      name: 'background-command',
      replace: [
        '      - run: |',
        '          npm --prefix ruoyi-ui run build:prod &'
      ],
      index: 7,
      missing: 'frontend-build-ci-missing'
    },
    {
      name: 'set-plus-e-and-trailing-true',
      replace: [
        '      - run: |',
        '          set +e',
        '          npm --prefix ruoyi-ui audit --audit-level=moderate --include=dev',
        '          true'
      ],
      index: 6,
      missing: 'frontend-audit-ci-missing'
    }
  ];

  for (const attack of attacks) {
    withRoot((root) => {
      const steps = completeRunSteps();
      steps.splice(attack.index, 1, ...attack.replace);
      writeWorkflow(root, [
        `name: ${attack.name}`,
        'on: [push]',
        'jobs:',
        '  checks:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        `      - uses: actions/checkout@${CHECKOUT_SHA}`,
        ...steps
      ]);

      const result = validateCiCoverageDeclaration({ root });
      assert.ok(result.failures.some((failure) => failure.code === 'ci-required-command-failure-masked'), attack.name);
      assert.ok(result.failures.some((failure) => failure.code === attack.missing), `${attack.name} ${attack.missing}`);
    });
  }
});

test('ci required command pipelines pass when pipefail is explicitly enabled', () => withRoot((root) => {
  const steps = completeRunSteps();
  steps.splice(3, 1,
    '      - run: |',
    '          set -o pipefail',
    '          mvn -pl ruoyi-business -am -Pintegration-test verify | tee maven.log');
  writeWorkflow(root, [
    'name: pipeline-with-pipefail',
    'on: [push]',
    'jobs:',
    '  checks:',
    '    runs-on: ubuntu-latest',
    '    steps:',
    `      - uses: actions/checkout@${CHECKOUT_SHA}`,
    ...steps
  ]);

  assert.deepEqual(validateCiCoverageDeclaration({ root }).failures, []);
}));
