import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CLOSED_TASK_STATUSES,
  isOpenTask,
  latestSession,
  summarizeTasks
} from '../scripts/resume.js';

test('closed task statuses include verified lifecycle states', () => {
  assert.equal(CLOSED_TASK_STATUSES.has('done'), true);
  assert.equal(CLOSED_TASK_STATUSES.has('verified'), true);
  assert.equal(CLOSED_TASK_STATUSES.has('closed'), true);
  assert.equal(CLOSED_TASK_STATUSES.has('completed'), true);
});

test('verified and done tasks do not appear in Open Tasks', () => {
  const output = summarizeTasks({
    tasks: [
      { id: 'TASK-VERIFIED', status: 'verified', title: 'Verified task', nextStep: 'none' },
      { id: 'TASK-DONE', status: 'done', title: 'Done task', nextStep: 'none' }
    ]
  });
  assert.equal(output, '- none');
});

test('todo and in_progress tasks appear in Open Tasks', () => {
  const output = summarizeTasks({
    tasks: [
      { id: 'TASK-TODO', status: 'todo', title: 'Todo task', nextStep: 'start' },
      { id: 'TASK-ACTIVE', status: 'in_progress', title: 'Active task', nextStep: 'continue' }
    ]
  });
  assert.match(output, /TASK-TODO \[todo\] Todo task -> start/);
  assert.match(output, /TASK-ACTIVE \[in_progress\] Active task -> continue/);
});

test('latestSession prefers open task session over verified task session', () => {
  const session = latestSession({
    tasks: [
      { id: 'TASK-VERIFIED', status: 'verified', latestSession: 'memory/sessions/verified.md' },
      { id: 'TASK-OPEN', status: 'todo', latestSession: 'memory/sessions/open.md' }
    ]
  });
  assert.equal(session, 'memory/sessions/open.md');
});

test('only verified tasks render Open Tasks as none', () => {
  assert.equal(isOpenTask({ status: 'verified' }), false);
  assert.equal(summarizeTasks({
    tasks: [
      { id: 'TASK-ONLY', status: 'verified', title: 'Only verified', nextStep: 'none' }
    ]
  }), '- none');
});
