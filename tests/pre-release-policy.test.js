import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { readJson } from '../tools/common.js';
import { validatePreReleasePolicy } from '../tools/pre-release-policy-checker.js';

function withRoot(fn) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-pre-release-policy-'));
  try {
    return fn(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function write(root, file, content) {
  const absolute = path.join(root, file);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, content);
}

function writeJson(root, file, value) {
  write(root, file, `${JSON.stringify(value, null, 2)}\n`);
}

function validPolicy() {
  return {
    schemaVersion: 1,
    name: 'pre-release-policy',
    releaseStage: 'pre-release',
    defaultCompatibilityMode: 'breaking-change',
    rules: {
      doNotAddLegacyCompatibilityByDefault: true,
      requireExplicitUserApprovalForCompatibility: true,
      preferReplacingOldContracts: true,
      removeStaleCodeWithinApprovedScope: true,
      allowDevelopmentDataReset: true,
      requireProductionMigrationPlanForReleasedData: true,
      requireCrossModuleImpactExpansion: true
    }
  };
}

function writeDocs(root) {
  write(root, 'AGENTS.md', [
    '# AGENTS',
    '',
    '## Pre-Release Breaking Change Policy',
    '',
    'Do not add old-code or old-data compatibility by default.',
    'Local development data may be reset or rebuilt when the change record documents it.',
    'Compatibility layers require explicit user approval.',
    ''
  ].join('\n'));
  write(root, 'docs/chat-driven-codex-workflow.md', [
    '# Workflow',
    '',
    '## Pre-release breaking-change mode',
    '',
    'The default is breaking while the project is unreleased.',
    'Codex may rebuild or reset development data when documented.',
    ''
  ].join('\n'));
}

test('repository pre-release policy is wired into package check', () => {
  const pkg = readJson('package.json');
  assert.equal(pkg.scripts['check:pre-release-policy'], 'node tools/pre-release-policy-checker.js');
  assert.ok(pkg.scripts.check.includes('npm run check:pre-release-policy'));
});

test('pre-release policy accepts breaking-change defaults and docs', () => withRoot((root) => {
  writeJson(root, 'ai/rules/pre-release-policy.json', validPolicy());
  writeDocs(root);

  const result = validatePreReleasePolicy({ root });
  assert.deepEqual(result.failures, []);
}));

test('pre-release policy rejects default compatibility mode', () => withRoot((root) => {
  writeJson(root, 'ai/rules/pre-release-policy.json', {
    ...validPolicy(),
    defaultCompatibilityMode: 'backward-compatible'
  });
  writeDocs(root);

  const result = validatePreReleasePolicy({ root });
  assert.ok(result.failures.some((failure) => failure.code === 'pre-release-policy-value'));
}));

test('pre-release policy requires documentation in AGENTS and workflow', () => withRoot((root) => {
  writeJson(root, 'ai/rules/pre-release-policy.json', validPolicy());
  write(root, 'AGENTS.md', '# AGENTS\n');
  write(root, 'docs/chat-driven-codex-workflow.md', '# Workflow\n');

  const result = validatePreReleasePolicy({ root });
  assert.ok(result.failures.some((failure) => failure.file === 'AGENTS.md'));
  assert.ok(result.failures.some((failure) => failure.file === 'docs/chat-driven-codex-workflow.md'));
}));
