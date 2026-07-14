import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { validateCiCoverageDeclaration } from '../tools/ci-coverage-declaration-checker.js';

const CHECKOUT_SHA = '1111111111111111111111111111111111111111';
const REUSABLE_SHA = '2222222222222222222222222222222222222222';
const IMAGE_DIGEST = 'a'.repeat(64);

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
    `${indent}- run: npm --prefix ruoyi-ui audit --audit-level=high`,
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
  'frontend-audit-ci-missing',
  'frontend-build-ci-missing'
];

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
      index: 6,
      missing: 'frontend-build-ci-missing'
    },
    {
      name: 'set-plus-e-and-trailing-true',
      replace: [
        '      - run: |',
        '          set +e',
        '          npm --prefix ruoyi-ui audit --audit-level=high',
        '          true'
      ],
      index: 5,
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
