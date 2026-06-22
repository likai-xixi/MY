import test from 'node:test';
import assert from 'node:assert/strict';
import { validateHandoverQuality, validateMemoryQuality, validateSessions, validateTasks } from '../tools/memory-quality-checker.js';

test('memory quality passes for scaffold memory', () => {
  assert.deepEqual(validateMemoryQuality(), []);
});

test('task validator catches missing latest session', () => {
  const errors = validateTasks({
    exists: (relativePath) => relativePath !== 'missing.md' && relativePath !== 'features/missing.md',
    read: () => ({
      schemaVersion: 1,
      tasks: [
        {
          id: 'TASK-1000',
          feature: 'missing',
          title: 'Broken task',
          status: 'todo',
          owner: 'workflow',
          priority: 'normal',
          statusReason: 'test',
          nextStep: 'test',
          blockedBy: [],
          verification: ['npm run check'],
          latestSession: 'missing.md',
          handoverRequired: true,
          updatedAt: '2026-06-21'
        }
      ]
    })
  });
  assert.ok(errors.some((error) => error.includes('latestSession does not exist')));
  assert.ok(errors.some((error) => error.includes('references missing feature')));
});

test('handover quality rejects placeholder text', () => {
  const errors = validateHandoverQuality({
    exists: () => true,
    read: () => [
      '# Handover',
      '',
      '## Summary',
      '',
      'Describe what changed.',
      '',
      '## Changed Files',
      '',
      '- file',
      '',
      '## Commands',
      '',
      '- `npm run check`',
      '',
      '## Verification',
      '',
      'check',
      '',
      '## Risks',
      '',
      'risk',
      '',
      '## Next Actions',
      '',
      'next',
      ''
    ].join('\n')
  });
  assert.ok(errors.some((error) => error.includes('placeholder')));
});

test('session validator requires task id and status', () => {
  const errors = validateSessions({
    files: () => ['memory/sessions/test.md'],
    read: () => [
      '# Session',
      '',
      '## Task',
      '',
      'none',
      '',
      '## Status',
      '',
      'unknown',
      '',
      '## Goal',
      '',
      'goal',
      '',
      '## Changed Files',
      '',
      '- file',
      '',
      '## Commands',
      '',
      '- `npm run check`',
      '',
      '## Verification',
      '',
      'check',
      '',
      '## Risks',
      '',
      'risk',
      '',
      '## Next Entry Point',
      '',
      'next',
      ''
    ].join('\n')
  });
  assert.ok(errors.some((error) => error.includes('Task must include a task id')));
  assert.ok(errors.some((error) => error.includes('Status must use a task status')));
});
