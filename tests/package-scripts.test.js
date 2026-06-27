import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseArgs,
  shouldReplaceGeneratedText,
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

test('finalize:change detects template verification and preserves real evidence by default', () => {
  assert.equal(templatePhrase('Status: prepared'), 'Status: prepared');
  assert.equal(shouldReplaceGeneratedText('# Verification\n\nStatus: pending\n'), true);
  assert.equal(shouldReplaceGeneratedText('# Verification\n\nStatus: verified\n\n## Evidence\n\nnpm test passed.\n'), false);
  assert.equal(shouldReplaceGeneratedText('# Verification\n\nStatus: verified\n\n## Evidence\n\nnpm test passed.\n', { force: true }), true);
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
