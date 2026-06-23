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

function handoverText(prefix = '') {
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
    '- `tools/change-handoff-integrity-checker.js`',
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
  changedFiles,
  actualFiles = changedFiles,
  verification = verifiedText(),
  handover = handoverText(),
  memoryHandover = handoverText(`Current change record: \`ai/changes/${id}\`.`),
  changelog = `# Changelog\n\n- Change: \`ai/changes/${id}\`.\n`,
  tasks = { schemaVersion: 1, tasks: [{ id: 'TASK-1', latestChange: id }] }
} = {}) {
  const json = new Map([
    [`ai/changes/${id}/changed-files.json`, { schemaVersion: 1, files: changedFiles }],
    ['memory/TASKS.json', tasks]
  ]);
  const text = new Map([
    [`ai/changes/${id}/verification.md`, verification],
    [`ai/changes/${id}/handover.md`, handover],
    ['memory/HANDOVER.md', memoryHandover],
    ['memory/CHANGELOG.md', changelog]
  ]);
  return validateChangeHandoffIntegrity({
    id,
    actualFiles,
    readJsonFile: (file) => {
      if (!json.has(file)) {
        throw new Error(`unexpected json read ${file}`);
      }
      return json.get(file);
    },
    readFile: (file) => text.get(file) || '',
    exists: (file) => text.has(file) || json.has(file)
  });
}

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

test('rejects real git changes missing from changed-files', () => {
  const errors = harness({
    changedFiles: [`ai/changes/${id}/verification.md`, 'memory/HANDOVER.md', 'memory/CHANGELOG.md', 'memory/TASKS.json'],
    actualFiles: ['tools/change-handoff-integrity-checker.js']
  });
  assert.ok(errors.some((error) => error.includes('missing from ai/changes/CR-TEST-handoff/changed-files.json')));
});

test('rejects template verification for substantive changes', () => {
  const errors = harness({
    changedFiles: ['tools/change-handoff-integrity-checker.js', 'memory/HANDOVER.md', 'memory/CHANGELOG.md', 'memory/TASKS.json'],
    verification: '# Verification\n\nStatus: prepared\n\n## Evidence\n\nThe change record was populated before the main gate.\n'
  });
  assert.ok(errors.some((error) => error.includes('template evidence')));
  assert.ok(errors.some((error) => error.includes('pending/prepared status')));
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
