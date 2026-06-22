import test from 'node:test';
import assert from 'node:assert/strict';
import { detectChatAction } from '../scripts/ai-do.js';
import { removeFeatureApplyWorkflow, runNpm } from '../scripts/chat-feature.js';

test('chat command router detects add update dry-run and apply actions', () => {
  assert.equal(detectChatAction('新增功能：客户管理'), 'add');
  assert.equal(detectChatAction('功能迭代：客户管理 增加客户等级'), 'update');
  assert.equal(detectChatAction('删除功能预分析：客户管理'), 'remove-dry-run');
  assert.equal(detectChatAction('删除功能：客户管理'), 'remove-dry-run');
  assert.equal(detectChatAction('确认删除：客户管理'), 'remove-apply');
});

test('chat command router detects real Chinese Codex App entry phrases', () => {
  assert.equal(detectChatAction('功能迭代：库存管理'), 'update');
  assert.equal(detectChatAction('新增功能：客户管理'), 'add');
  assert.equal(detectChatAction('删除功能预分析：库存管理'), 'remove-dry-run');
});

test('runNpm uses an injected runner and command without spawning npm', () => {
  const calls = [];
  const result = runNpm(['resume'], {
    cwd: 'C:\\repo',
    stdio: 'pipe',
    processRunner: {
      run: (command, args, options) => {
        calls.push({ command, args, options });
        return { status: 0 };
      }
    }
  });

  assert.deepEqual(result, { status: 0 });
  assert.deepEqual(calls, [{
    command: 'npm',
    args: ['run', 'resume'],
    options: { stdio: 'pipe', cwd: 'C:\\repo' }
  }]);
});

test('runNpm throws when the injected process runner fails', () => {
  assert.throws(() => runNpm(['check'], {
    processRunner: {
      run: () => ({ status: 1, resolvedCommand: 'C:\\Tools\\npm.cmd' })
    }
  }), /npm run check failed resolved as C:\\Tools\\npm\.cmd: exit code 1/);
});

test('remove apply requires an explicit chat confirmation or --confirm flag', () => {
  assert.deepEqual(removeFeatureApplyWorkflow({ name: 'inventory' }), [
    'Deletion apply requires explicit confirmation. Use `确认删除：<feature>` in chat or pass `--confirm <feature-id>`.'
  ]);
});
