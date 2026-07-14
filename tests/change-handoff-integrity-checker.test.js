import test from 'node:test';
import assert from 'node:assert/strict';
import { validateChangeHandoffIntegrity } from '../tools/change-handoff-integrity-checker.js';

const id = 'CR-TEST-handoff';

function verifiedText(extra = '') {
  return [
    '# Verification',
    '',
    'Status: verified',
    '',
    '## Commands',
    '',
    '- `npm test` passed with 1 test.',
    '- `npm run check` passed.',
    '',
    '## Evidence',
    '',
    '- Node tests passed.',
    '- Full governance gate passed.',
    extra,
    ''
  ].join('\n');
}

function handoverText(prefix = '', changedFiles = ['tools/change-handoff-integrity-checker.js']) {
  return [
    '# Handover',
    '',
    '## Summary',
    '',
    prefix || 'Handoff integrity checker completed.',
    '',
    '## Impact',
    '',
    'Governance closeout now validates change evidence, memory sync, and semantic scan notes.',
    '',
    '## Changed Files',
    '',
    ...changedFiles.map((file) => `- \`${file}\``),
    '',
    '## Commands',
    '',
    '- `npm test`',
    '- `npm run check`',
    '',
    '## Verification',
    '',
    'Tests and the full governance gate passed.',
    '',
    '## Risks',
    '',
    'No runtime business behavior changed.',
    '',
    '## Next Actions',
    '',
    'Use the checker in close:change for future handoffs.',
    ''
  ].join('\n');
}

function harness({
  changedFiles = [],
  actualFiles = changedFiles,
  fileDiffs = new Map(),
  verification = verifiedText(),
  handover,
  memoryHandover,
  changelog = `# Changelog\n\n- Change: \`ai/changes/${id}\`.\n`,
  tasks = { schemaVersion: 1, tasks: [{ id: 'TASK-1', latestChange: id }] },
  impact = { schemaVersion: 1, mode: 'update', baseRevision: 'base-revision', feature: { id: 'order' } },
  missingFiles = []
} = {}) {
  const resolvedHandover = handover === undefined ? handoverText('', changedFiles) : handover;
  const resolvedMemoryHandover = memoryHandover === undefined
    ? handoverText(`Current change record: \`ai/changes/${id}\`.`, changedFiles)
    : memoryHandover;
  const json = new Map([
    [`ai/changes/${id}/changed-files.json`, { schemaVersion: 1, files: changedFiles }],
    [`ai/changes/${id}/impact.json`, impact],
    ['memory/TASKS.json', tasks]
  ]);
  const text = new Map([
    [`ai/changes/${id}/verification.md`, verification],
    [`ai/changes/${id}/handover.md`, resolvedHandover],
    ['memory/HANDOVER.md', resolvedMemoryHandover],
    ['memory/CHANGELOG.md', changelog]
  ]);
  for (const file of missingFiles) {
    json.delete(file);
    text.delete(file);
  }
  return validateChangeHandoffIntegrity({
    id,
    actualFiles,
    fileDiffs,
    readJsonFile: (file) => {
      if (!json.has(file)) {
        throw new Error(`unexpected json read ${file}`);
      }
      return json.get(file);
    },
    readFile: (file) => text.get(file) || '',
    exists: (file) => text.has(file) || json.has(file),
    validateBaseRevisionFn: () => []
  });
}

test('fails when current change id is missing', () => {
  const errors = validateChangeHandoffIntegrity({
    id: '',
    actualFiles: [],
    readJsonFile: () => ({ schemaVersion: 1, files: [] }),
    readFile: () => '',
    exists: () => false
  });
  assert.ok(errors.some((error) => error.includes('No change id provided')));
});

test('passes for complete governance handoff evidence', () => {
  const errors = harness({
    changedFiles: [
      'tools/change-handoff-integrity-checker.js',
      `ai/changes/${id}/verification.md`,
      'memory/HANDOVER.md',
      'memory/CHANGELOG.md',
      'memory/TASKS.json'
    ]
  });
  assert.deepEqual(errors, []);
});

test('rejects handover changed-file omissions and overclaims in both directions', () => {
  const changedFiles = [
    'tools/change-handoff-integrity-checker.js',
    `ai/changes/${id}/verification.md`,
    'memory/HANDOVER.md',
    'memory/CHANGELOG.md',
    'memory/TASKS.json'
  ];
  const errors = harness({
    changedFiles,
    handover: handoverText('', changedFiles.filter((file) => file !== 'memory/TASKS.json')),
    memoryHandover: handoverText(
      `Current change record: \`ai/changes/${id}\`.`,
      [...changedFiles, 'docs/not-in-changed-files.md']
    )
  });
  assert.ok(errors.some((error) => (
    error.includes(`ai/changes/${id}/handover.md`)
    && error.includes('memory/TASKS.json')
    && error.includes('missing')
  )));
  assert.ok(errors.some((error) => (
    error.includes('memory/HANDOVER.md')
    && error.includes('docs/not-in-changed-files.md')
    && error.includes('not recorded')
  )));
});

test('fails closed when either Changed Files section is missing or malformed', () => {
  const changedFiles = [
    'tools/change-handoff-integrity-checker.js',
    'memory/HANDOVER.md',
    'memory/CHANGELOG.md',
    'memory/TASKS.json'
  ];
  const missingSection = handoverText('', changedFiles).replace(
    /## Changed Files[\s\S]*?(?=## Commands)/,
    ''
  );
  const malformedSection = handoverText(
    `Current change record: \`ai/changes/${id}\`.`,
    changedFiles
  ).replace('- `tools/change-handoff-integrity-checker.js`', '- governance checker files');
  const errors = harness({
    changedFiles,
    handover: missingSection,
    memoryHandover: malformedSection
  });
  assert.ok(errors.some((error) => (
    error.includes(`ai/changes/${id}/handover.md`)
    && error.includes('must include ## Changed Files')
  )));
  assert.ok(errors.some((error) => (
    error.includes('memory/HANDOVER.md')
    && error.includes('cannot parse Changed Files line')
  )));
});

test('rejects real git changes missing from changed-files', () => {
  const errors = harness({
    changedFiles: [`ai/changes/${id}/verification.md`, 'memory/HANDOVER.md', 'memory/CHANGELOG.md', 'memory/TASKS.json'],
    actualFiles: ['tools/change-handoff-integrity-checker.js']
  });
  assert.ok(errors.some((error) => error.includes('missing from ai/changes/CR-TEST-handoff/changed-files.json')));
});

test('rejects changed-files entries that are not in the exact Git change set', () => {
  const errors = harness({
    changedFiles: [
      'tools/change-handoff-integrity-checker.js',
      'docs/untouched-overclaim.md',
      `ai/changes/${id}/verification.md`,
      'memory/HANDOVER.md',
      'memory/CHANGELOG.md',
      'memory/TASKS.json'
    ],
    actualFiles: [
      'tools/change-handoff-integrity-checker.js',
      `ai/changes/${id}/verification.md`,
      'memory/HANDOVER.md',
      'memory/CHANGELOG.md',
      'memory/TASKS.json'
    ]
  });
  assert.ok(errors.some((error) => error.includes('docs/untouched-overclaim.md')));
  assert.ok(errors.some((error) => error.includes('not changed since impact.baseRevision')));
});

test('still rejects overclaimed changed-files when the Git change set is clean', () => {
  const errors = harness({
    changedFiles: ['docs/untouched-overclaim.md'],
    actualFiles: []
  });
  assert.ok(errors.some((error) => error.includes('not changed since impact.baseRevision')));
});

test('validates every raw changed-files entry before normalization or deduplication', () => {
  const cases = [
    {
      changedFiles: ['./tools/change-handoff-integrity-checker.js'],
      expected: 'must be one exact canonical repository-relative path'
    },
    {
      changedFiles: ['tools\\change-handoff-integrity-checker.js'],
      expected: 'must be one exact canonical repository-relative path'
    },
    {
      changedFiles: [
        'tools/change-handoff-integrity-checker.js',
        'tools/change-handoff-integrity-checker.js'
      ],
      expected: 'contains duplicate raw file entry'
    }
  ];

  for (const { changedFiles, expected } of cases) {
    const errors = harness({
      changedFiles,
      actualFiles: ['tools/change-handoff-integrity-checker.js']
    });
    assert.ok(
      errors.some((error) => error.includes(`ai/changes/${id}/changed-files.json`) && error.includes(expected)),
      `${JSON.stringify(changedFiles)}: ${errors.join('\n')}`
    );
  }
});

test('fails closed when non-success provenance claims a successful verification result', () => {
  const changedFiles = [
    'tools/change-handoff-integrity-checker.js',
    'memory/HANDOVER.md',
    'memory/CHANGELOG.md',
    'memory/TASKS.json'
  ];
  const verificationErrors = harness({
    changedFiles,
    verification: verifiedText('- [not-run] `npm test` passed with 42 tests.')
  });
  assert.ok(verificationErrors.some((error) => (
    error.includes(`ai/changes/${id}/verification.md`)
    && error.includes('non-success provenance')
  )));
  const wrappedVerificationErrors = harness({
    changedFiles,
    verification: verifiedText('- [not-run] `npm test`\n  passed with 42 tests.')
  });
  assert.ok(wrappedVerificationErrors.some((error) => (
    error.includes(`ai/changes/${id}/verification.md`)
    && error.includes('non-success provenance')
  )));
  const contrastVerificationErrors = harness({
    changedFiles,
    verification: verifiedText('- [not-run] `npm test` was not run but passed.')
  });
  assert.ok(contrastVerificationErrors.some((error) => (
    error.includes(`ai/changes/${id}/verification.md`)
    && error.includes('non-success provenance')
  )));

  const contradictoryHandover = handoverText('', changedFiles).replace(
    'Tests and the full governance gate passed.',
    '- [inconclusive] `npm run check` verified successfully.'
  );
  const handoverErrors = harness({ changedFiles, handover: contradictoryHandover });
  assert.ok(handoverErrors.some((error) => (
    error.includes(`ai/changes/${id}/handover.md`)
    && error.includes('non-success provenance')
  )));
});

test('rejects duplicate controlled handover sections', () => {
  const changedFiles = [
    'tools/change-handoff-integrity-checker.js',
    'memory/HANDOVER.md',
    'memory/CHANGELOG.md',
    'memory/TASKS.json'
  ];
  for (const duplicateHeading of ['## Verification', '  ## Verification']) {
    const handover = `${handoverText('', changedFiles)}\n${duplicateHeading}\n\nDeceptive second verification section.\n`;
    const errors = harness({ changedFiles, handover });
    assert.ok(errors.some((error) => (
      error.includes(`ai/changes/${id}/handover.md`)
      && error.includes('must contain exactly one ## Verification section')
    )), duplicateHeading);
  }

  const indentedCode = `${handoverText('', changedFiles)}\n    ## Verification\n\n    Example code, not a heading.\n`;
  const codeErrors = harness({ changedFiles, handover: indentedCode });
  assert.ok(!codeErrors.some((error) => error.includes('must contain exactly one ## Verification section')));
});

test('rejects template verification for substantive changes', () => {
  const errors = harness({
    changedFiles: ['tools/change-handoff-integrity-checker.js', 'memory/HANDOVER.md', 'memory/CHANGELOG.md', 'memory/TASKS.json'],
    verification: '# Verification\n\nStatus: prepared\n\n## Evidence\n\nThe change record was populated before the main gate.\n'
  });
  assert.ok(errors.some((error) => error.includes('template evidence')));
  assert.ok(errors.some((error) => error.includes('pending/prepared status')));
});

test('uses one fenced-code-aware top-level Status field with provenance suffixes', () => {
  const changedFiles = ['tools/change-handoff-integrity-checker.js', 'memory/HANDOVER.md', 'memory/CHANGELOG.md', 'memory/TASKS.json'];
  for (const status of ['pending', 'prepared']) {
    const errors = harness({
      changedFiles,
      verification: verifiedText().replace('Status: verified', `Status: ${status} [not-run]`)
    });
    assert.ok(errors.some((error) => error.includes('pending/prepared status')), status);
  }

  const duplicateErrors = harness({
    changedFiles,
    verification: verifiedText().replace('Status: verified', 'Status: verified [local]\nStatus: pending [not-run]')
  });
  assert.ok(duplicateErrors.some((error) => error.includes('exactly one top-level Status field')));

  const fencedStatus = verifiedText([
    '```text',
    'Status: pending [not-run]',
    '```'
  ].join('\n'));
  assert.deepEqual(harness({ changedFiles, verification: fencedStatus }), []);
});

test('rejects missing or empty verification evidence', () => {
  const missingErrors = harness({
    changedFiles: ['tools/change-handoff-integrity-checker.js', 'memory/HANDOVER.md', 'memory/CHANGELOG.md', 'memory/TASKS.json'],
    missingFiles: [`ai/changes/${id}/verification.md`]
  });
  assert.ok(missingErrors.some((error) => error.includes('verification.md is missing')));

  const emptyErrors = harness({
    changedFiles: ['tools/change-handoff-integrity-checker.js', 'memory/HANDOVER.md', 'memory/CHANGELOG.md', 'memory/TASKS.json'],
    verification: ''
  });
  assert.ok(emptyErrors.some((error) => error.includes('verification.md must not be empty')));
});

test('rejects vague handover sections for substantive changes', () => {
  const vague = [
    '# Handover',
    '',
    '## Impact',
    'ok',
    '',
    '## Verification',
    'ok',
    '',
    '## Risks',
    'none',
    '',
    '## Next Actions',
    'none',
    ''
  ].join('\n');
  const errors = harness({
    changedFiles: ['tools/change-handoff-integrity-checker.js', 'memory/HANDOVER.md', 'memory/CHANGELOG.md', 'memory/TASKS.json'],
    handover: vague
  });
  assert.ok(errors.some((error) => error.includes('Impact must describe the changed surface')));
  assert.ok(errors.some((error) => error.includes('Verification must describe the verification result')));
});

test('requires memory files to reference the current change', () => {
  const errors = harness({
    changedFiles: ['tools/change-handoff-integrity-checker.js', 'memory/HANDOVER.md', 'memory/CHANGELOG.md', 'memory/TASKS.json'],
    memoryHandover: handoverText('Current change record: `ai/changes/CR-OLD`.'),
    changelog: '# Changelog\n\n- Change: `ai/changes/CR-OLD`.\n',
    tasks: { schemaVersion: 1, tasks: [{ id: 'TASK-1', latestChange: 'CR-OLD' }] }
  });
  assert.ok(errors.some((error) => error.includes('memory/HANDOVER.md must reference current change')));
  assert.ok(errors.some((error) => error.includes('memory/CHANGELOG.md must record current change')));
  assert.ok(errors.some((error) => error.includes('memory/TASKS.json must sync current change')));
});

test('API changes require graph/catalog/generated scan updates or no-contract-change evidence', () => {
  const errors = harness({
    changedFiles: [
      'ruoyi-admin/src/main/java/com/ruoyi/web/controller/business/order/OrderController.java',
      'memory/HANDOVER.md',
      'memory/CHANGELOG.md',
      'memory/TASKS.json'
    ]
  });
  assert.ok(errors.some((error) => error.includes('API semantic surface changed')));

  const noContractErrors = harness({
    changedFiles: [
      'ruoyi-admin/src/main/java/com/ruoyi/web/controller/business/order/OrderController.java',
      'memory/HANDOVER.md',
      'memory/CHANGELOG.md',
      'memory/TASKS.json'
    ],
    verification: verifiedText('- API scan completed with no contract changes.\n- Permission scan completed with no contract changes.')
  });
  assert.deepEqual(noContractErrors, []);
});

test('UI changes require graph or no-contract-change evidence', () => {
  const errors = harness({
    changedFiles: [
      'ruoyi-ui/src/views/order/index.vue',
      'memory/HANDOVER.md',
      'memory/CHANGELOG.md',
      'memory/TASKS.json'
    ]
  });
  assert.ok(errors.some((error) => error.includes('UI semantic surface changed')));
});

test('DB changes require generated scan, ownership, contract, or no-contract-change evidence', () => {
  const errors = harness({
    changedFiles: [
      'ruoyi-business/src/main/resources/mapper/order/OrderMapper.xml',
      'memory/HANDOVER.md',
      'memory/CHANGELOG.md',
      'memory/TASKS.json'
    ]
  });
  assert.ok(errors.some((error) => error.includes('DB semantic surface changed')));
});

test('component changes require registry/generated scan updates or no-contract-change evidence', () => {
  const errors = harness({
    changedFiles: [
      'ruoyi-ui/src/components/OrderPicker/index.vue',
      'memory/HANDOVER.md',
      'memory/CHANGELOG.md',
      'memory/TASKS.json'
    ]
  });
  assert.ok(errors.some((error) => error.includes('component semantic surface changed')));
});

test('rejects governance changes synced only to TASK-CUSTOMER', () => {
  const errors = harness({
    changedFiles: [
      'scripts/resume.js',
      'memory/HANDOVER.md',
      'memory/CHANGELOG.md',
      'memory/TASKS.json'
    ],
    impact: { schemaVersion: 1, mode: 'governance', feature: { id: 'platform' } },
    tasks: {
      schemaVersion: 1,
      tasks: [{ id: 'TASK-CUSTOMER', feature: 'customer', latestChange: id }]
    }
  });
  assert.ok(errors.some((error) => error.includes('platform/governance task')));
  assert.ok(errors.some((error) => error.includes('must not sync governance change')));
});

test('ordinary markdown and comment-only changes do not trigger semantic gates', () => {
  const fileDiffs = new Map([
    ['ruoyi-admin/src/main/java/com/ruoyi/web/controller/business/order/OrderController.java', [
      'diff --git a/OrderController.java b/OrderController.java',
      '@@',
      '-// old note',
      '+// clarified note'
    ].join('\n')],
    ['ruoyi-ui/src/views/order/index.vue', [
      'diff --git a/index.vue b/index.vue',
      '@@',
      '-<!-- old note -->',
      '+<!-- clarified note -->'
    ].join('\n')],
    ['ruoyi-business/src/main/resources/mapper/order/OrderMapper.xml', [
      'diff --git a/OrderMapper.xml b/OrderMapper.xml',
      '@@',
      '-<!-- old query note -->',
      '+<!-- clarified query note -->'
    ].join('\n')],
    ['ruoyi-ui/src/components/OrderPicker/index.vue', [
      'diff --git a/index.vue b/index.vue',
      '@@',
      '-<!-- old component note -->',
      '+<!-- clarified component note -->'
    ].join('\n')]
  ]);
  const errors = harness({
    changedFiles: [
      'docs/order-note.md',
      'ruoyi-admin/src/main/java/com/ruoyi/web/controller/business/order/OrderController.java',
      'ruoyi-ui/src/views/order/index.vue',
      'ruoyi-business/src/main/resources/mapper/order/OrderMapper.xml',
      'ruoyi-ui/src/components/OrderPicker/index.vue',
      'memory/HANDOVER.md',
      'memory/CHANGELOG.md',
      'memory/TASKS.json'
    ],
    fileDiffs
  });
  assert.deepEqual(errors, []);
});
