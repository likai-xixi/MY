import test from 'node:test';
import assert from 'node:assert/strict';
import { validateHandover } from '../scripts/generate-handover.js';
import { buildModuleMapMarkdown } from '../scripts/sync-memory.js';
import { readText } from '../tools/common.js';

test('handover has required sections', () => {
  assert.deepEqual(validateHandover(), []);
});

test('missing handover returns a recoverable error', () => {
  assert.deepEqual(validateHandover({ exists: () => false }), [
    'memory/HANDOVER.md is missing. Run npm run handover to create a template.'
  ]);
});

test('module map matches generated graph summary', () => {
  assert.equal(readText('memory/MODULE_MAP.md'), buildModuleMapMarkdown());
});
