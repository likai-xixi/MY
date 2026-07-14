import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildChangelogEntry,
  buildMemoryHandover,
  controlledSectionDuplicates,
  parseArgs,
  projectCalendarDate,
  shouldAppendChangelog,
  shouldReplaceGeneratedText,
  synchronizeChangedFilesSection,
  templatePhrase
} from '../scripts/finalize-change.js';
import { fileExists, readJson } from '../tools/common.js';
import { resolveCommand, runProcess } from '../tools/process-runner.js';

const GATE_SCRIPT_NAME = /^(?:check:.+|scan:.+:check|verify:.+|test|build:.+:check)$/;
const SUCCESS_THEATER_COMMAND = /^(?:echo\s+(?:success|ok)|exit\s+0|true)$/i;
const REAL_GATE_COMMAND = /\b(?:node|npm\s+run|npm\s+--prefix|mvn(?:\.cmd)?|pnpm|yarn)\b/i;

function commandParts(command) {
  return String(command || '')
    .split(/\s*&&\s*|\s*;\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
}

test('node-backed package scripts point to existing files', () => {
  const pkg = readJson('package.json');
  assert.equal(pkg.scripts['check:handover-integrity'], 'node tools/change-handoff-integrity-checker.js');
  assert.equal(pkg.scripts['check:change-handoff'], 'npm run check:handover-integrity');
  for (const [name, command] of Object.entries(pkg.scripts)) {
    if (command.startsWith('node --')) {
      continue;
    }
    const match = command.match(/^node\s+([^\s]+)/);
    if (!match) {
      continue;
    }
    assert.equal(fileExists(match[1]), true, `${name} points to missing ${match[1]}`);
  }
});

test('main check runs handover integrity before closing a change', () => {
  const pkg = readJson('package.json');
  assert.match(pkg.scripts.check, /npm run check:(change|handover-integrity)/);
  assert.ok(pkg.scripts.check.includes('npm run check:change'));
  assert.ok(pkg.scripts['check:change'].includes('check:handover-integrity'));
  assert.ok(pkg.scripts['check:change'].includes('close:change'));
});

test('Windows package manager commands resolve to command shims without executing npm', () => {
  const fakeEnv = {
    Path: 'C:\\tools\\nodejs;C:\\tools\\maven',
    PATHEXT: '.cmd;.exe'
  };
  const existing = new Set([
    'c:\\tools\\nodejs\\npm.cmd',
    'c:\\tools\\nodejs\\pnpm.cmd',
    'c:\\tools\\nodejs\\yarn.cmd',
    'c:\\tools\\maven\\mvn.cmd'
  ]);
  const existsSync = (candidate) => existing.has(candidate.toLowerCase());

  assert.equal(resolveCommand('npm', { env: fakeEnv, existsSync, platform: 'win32' }), 'C:\\tools\\nodejs\\npm.cmd');
  assert.equal(resolveCommand('pnpm', { env: fakeEnv, existsSync, platform: 'win32' }), 'C:\\tools\\nodejs\\pnpm.cmd');
  assert.equal(resolveCommand('yarn', { env: fakeEnv, existsSync, platform: 'win32' }), 'C:\\tools\\nodejs\\yarn.cmd');
  assert.equal(resolveCommand('mvn', { env: fakeEnv, existsSync, platform: 'win32' }), 'C:\\tools\\maven\\mvn.cmd');
});

test('Windows npm resolution falls back to npm.cmd without requiring real npm', () => {
  assert.equal(
    resolveCommand('npm', {
      env: { Path: 'C:\\missing', PATHEXT: '.exe;.cmd' },
      existsSync: () => false,
      platform: 'win32'
    }),
    'npm.cmd'
  );
});

test('non-Windows package manager commands are left for normal PATH lookup', () => {
  assert.equal(
    resolveCommand('npm', {
      env: { PATH: '/usr/bin' },
      existsSync: () => {
        throw new Error('non-Windows resolution should not probe PATH');
      },
      platform: 'linux'
    }),
    'npm'
  );
});

test('Windows command shims run through cmd call without executing real npm', () => {
  const fakeEnv = {
    ComSpec: 'C:\\Windows\\System32\\cmd.exe',
    Path: 'C:\\tools\\nodejs',
    PATHEXT: '.cmd'
  };
  let invocation;
  const result = runProcess('npm', ['--version'], {
    env: fakeEnv,
    existsSync: (candidate) => candidate.toLowerCase() === 'c:\\tools\\nodejs\\npm.cmd',
    platform: 'win32',
    spawnSyncImpl(command, args, options) {
      invocation = { command, args, options };
      return { status: 0 };
    }
  });

  assert.equal(result.status, 0);
  assert.equal(invocation.command, 'C:\\Windows\\System32\\cmd.exe');
  assert.deepEqual(invocation.args, [
    '/d',
    '/s',
    '/c',
    'call "C:\\tools\\nodejs\\npm.cmd" "--version"'
  ]);
  assert.equal(invocation.options.windowsVerbatimArguments, true);
});

test('finalize:change parses explicit verification status and evidence', () => {
  const parsed = parseArgs([
    '--id',
    'CR-TEST',
    '--summary',
    'Governance closeout',
    '--status',
    'verified',
    '--evidence',
    'npm test passed',
    '--command',
    'node --test tests/resume.test.js',
    'npm run check',
    '--force-verification'
  ]);

  assert.equal(parsed.id, 'CR-TEST');
  assert.equal(parsed.summary, 'Governance closeout');
  assert.equal(parsed.verificationStatus, 'verified');
  assert.equal(parsed.verificationEvidence, 'npm test passed');
  assert.equal(parsed.forceVerification, true);
  assert.deepEqual(parsed.commands, [
    'node --test tests/resume.test.js',
    'npm run check'
  ]);
});

test('finalize:change changelog entries are separated and idempotent by change id', () => {
  const id = 'CR-TEST-IDEMPOTENT';
  const entry = buildChangelogEntry({
    id,
    featureId: 'platform',
    mode: 'rule-change',
    today: '2026-07-15'
  });
  assert.match(entry, /^## 2026-07-15 - rule-change\n\n- Change:/);
  assert.match(entry, /\n- Feature: `platform`\.\n$/);
  assert.equal(shouldAppendChangelog('# Changelog\n', id), true);
  assert.equal(shouldAppendChangelog(`# Changelog\n\n${entry}`, id), false);
});

test('finalize:change uses the project calendar date across the UTC boundary', () => {
  assert.equal(projectCalendarDate(new Date('2026-07-14T15:59:59.999Z')), '2026-07-14');
  assert.equal(projectCalendarDate(new Date('2026-07-14T16:00:00.000Z')), '2026-07-15');
});

test('finalize:change detects template verification and preserves real evidence by default', () => {
  assert.equal(templatePhrase('Status: prepared'), 'Status: prepared');
  assert.equal(shouldReplaceGeneratedText('# Verification\n\nStatus: pending\n'), true);
  assert.equal(shouldReplaceGeneratedText('# Verification\n\nStatus: verified\n\n## Evidence\n\nnpm test passed.\n'), false);
  const verifiedWithQuotedPendingStatus = [
    '# Verification',
    '',
    'Status: verified',
    '',
    '## Evidence',
    '',
    'The regression fixture contains the literal text `Status: pending` in its body.'
  ].join('\n');
  assert.equal(templatePhrase(verifiedWithQuotedPendingStatus), '');
  assert.equal(shouldReplaceGeneratedText(verifiedWithQuotedPendingStatus), false);
  for (const phrase of [
    'Pending implementation',
    'Describe passing and failing verification',
    'Use `npm run check` as the full governance gate'
  ]) {
    const verifiedBody = `# Verification\n\nStatus: verified [local]\n\n## Evidence\n\nQuoted fixture: ${phrase}`;
    assert.equal(templatePhrase(verifiedBody), '', phrase);
    assert.equal(shouldReplaceGeneratedText(verifiedBody), false, phrase);
  }
  const fencedPending = '# Verification\n\nStatus: verified [local]\n\n```text\nStatus: pending [not-run]\n```\n\n## Evidence\n\nReal evidence.';
  assert.equal(templatePhrase(fencedPending), '');
  assert.equal(shouldReplaceGeneratedText(fencedPending), false);
  assert.equal(templatePhrase('# Verification\n\nStatus: pending [not-run]\n'), 'Status: pending');
  assert.equal(templatePhrase('# Verification\n\nStatus: prepared [not-run]\n'), 'Status: prepared');
  const duplicateStatus = '# Verification\n\nStatus: verified [local]\nStatus: pending [not-run]\n';
  assert.equal(templatePhrase(duplicateStatus), '');
  assert.equal(shouldReplaceGeneratedText(duplicateStatus), false);
  assert.equal(shouldReplaceGeneratedText('# Verification\n\nStatus: verified\n\n## Evidence\n\nnpm test passed.\n', { force: true }), true);
  assert.equal(shouldReplaceGeneratedText('# Handover\n\n## Verification\n\nUse `npm run check` as the full governance gate.\n'), false);
  assert.equal(shouldReplaceGeneratedText('# Plan\n\n## Remaining Work\n\nIndependent staged review is still required.\n'), false);
});

test('finalize:change generated handover uses explicit not-run provenance', () => {
  const handover = buildMemoryHandover({
    id: 'CR-TEST',
    summary: 'Governance closeout',
    changedFiles: ['tools/diff-checker.js'],
    commands: ['npm test', '[local] npm run check:diff']
  });
  assert.match(handover, /\[not-run\] `npm test`/);
  assert.match(handover, /\[local\] `npm run check:diff`/);
  assert.match(handover, /\[not-run\] `npm run check` is the remaining full governance gate/);
});

test('finalize:change memory handover lists every changed file without a truncation summary', () => {
  const changedFiles = Array.from({ length: 35 }, (_, index) => `tools/generated-${index}.js`);
  const handover = buildMemoryHandover({
    id: 'CR-TEST',
    summary: 'Governance closeout',
    changedFiles,
    commands: ['npm test']
  });
  for (const file of changedFiles) {
    assert.ok(handover.split('\n').includes(`- \`${file}\``), file);
  }
  assert.doesNotMatch(handover, /additional files in the current change record/);
});

test('finalize:change synchronizes exact changed files without replacing rich handover evidence', () => {
  const rich = [
    '# Handover',
    '',
    '## Summary',
    '',
    'Keep this independently reviewed summary.',
    '',
    '  ## Changed Files',
    '',
    '- Governance tools and focused tests.',
    '',
    '## Verification',
    '',
    'Keep this independently reviewed verification evidence.',
    ''
  ].join('\n');
  const synchronized = synchronizeChangedFilesSection(rich, [
    'tests/change-handoff-integrity-checker.test.js',
    'tools/change-handoff-integrity-checker.js'
  ]);
  assert.match(synchronized, /Keep this independently reviewed summary/);
  assert.match(synchronized, /Keep this independently reviewed verification evidence/);
  assert.ok(synchronized.split('\n').includes('- `tests/change-handoff-integrity-checker.test.js`'));
  assert.ok(synchronized.split('\n').includes('- `tools/change-handoff-integrity-checker.js`'));
  assert.doesNotMatch(synchronized, /Governance tools and focused tests/);
  assert.match(synchronized, /- `tools\/change-handoff-integrity-checker\.js`\n\n## Verification/);
});

test('finalize:change collapses duplicate Changed Files sections into one exact controlled section', () => {
  const handover = [
    '# Handover',
    '',
    '## Summary',
    '',
    'Keep this summary.',
    '',
    '## Changed Files',
    '',
    '- stale first claim',
    '',
    '## Verification',
    '',
    'Keep verified evidence.',
    '',
    '## Changed Files',
    '',
    '- deceptive second claim',
    '',
    '## Risks',
    '',
    'No runtime risk.',
    ''
  ].join('\n');
  const synchronized = synchronizeChangedFilesSection(handover, [
    'tools/change-handoff-integrity-checker.js'
  ]);

  assert.equal((synchronized.match(/^ {0,3}## Changed Files$/gm) || []).length, 1);
  assert.ok(synchronized.split('\n').includes('- `tools/change-handoff-integrity-checker.js`'));
  assert.doesNotMatch(synchronized, /stale first claim|deceptive second claim/);
  assert.match(synchronized, /Keep verified evidence/);
});

test('finalize:change identifies duplicate controlled sections that must be rejected', () => {
  const handover = [
    '# Handover',
    '',
    '   ## Verification',
    '',
    'First evidence.',
    '',
    '## Risks',
    '',
    'No runtime risk.',
    '',
    '## Verification',
    '',
    'Deceptive second evidence.',
    ''
  ].join('\n');
  assert.deepEqual(controlledSectionDuplicates(handover), ['## Verification']);

  const codeBlock = `${handover}\n    ## Verification\n\n    Example code, not a heading.\n`;
  assert.deepEqual(controlledSectionDuplicates(codeBlock), ['## Verification']);
});

test('package gate scripts cannot be success theater', () => {
  const pkg = readJson('package.json');
  for (const [name, command] of Object.entries(pkg.scripts)) {
    if (!GATE_SCRIPT_NAME.test(name)) {
      continue;
    }
    assert.notEqual(String(command).trim(), '', `${name} must not be an empty script`);
    assert.match(command, REAL_GATE_COMMAND, `${name} must run a real validator, test, check, or build command`);
    for (const part of commandParts(command)) {
      assert.doesNotMatch(part, SUCCESS_THEATER_COMMAND, `${name} contains fake-green command: ${part}`);
      assert.doesNotMatch(part, /^echo\s+["']?(?:success|ok)["']?$/i, `${name} must not only print success`);
    }
  }
});

test('main check includes the false-green matrix checker', () => {
  const pkg = readJson('package.json');
  assert.ok(pkg.scripts.check.includes('npm run check:false-green-matrix'));
});

test('false-green matrix check points to a real checker file', () => {
  const pkg = readJson('package.json');
  assert.equal(pkg.scripts['check:false-green-matrix'], 'node tools/false-green-matrix-checker.js');
  assert.equal(fileExists('tools/false-green-matrix-checker.js'), true);
});

test('main check runs the legacy baseline before legacy component and boundary gates', () => {
  const pkg = readJson('package.json');
  assert.equal(pkg.scripts['check:legacy-baseline'], 'node tools/legacy-baseline.js');
  assert.equal(fileExists('tools/legacy-baseline.js'), true);

  const check = pkg.scripts.check;
  const baselineIndex = check.indexOf('npm run check:legacy-baseline');
  assert.ok(baselineIndex >= 0);
  for (const command of ['npm run check:components', 'npm run check:component-similarity', 'npm run check:boundaries']) {
    assert.ok(baselineIndex < check.indexOf(command), `${command} must run after check:legacy-baseline`);
  }
});
