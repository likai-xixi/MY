import { finish, isCli } from '../tools/common.js';
import {
  addFeatureWorkflow,
  removeFeatureApplyWorkflow,
  removeFeatureDryRunWorkflow,
  updateFeatureWorkflow
} from './chat-feature.js';

const ACTION_PATTERNS = [
  { action: 'remove-apply', pattern: /^(?:确认删除|删除确认|确认移除|确认删除功能|确认删除模块)\s*(?:[:：|｜\-]\s*)?/u },
  { action: 'remove-dry-run', pattern: /^(?:删除功能预分析|删除预分析|预分析删除|删除影响分析|移除预分析)\s*(?:[:：|｜\-]\s*)?/u },
  { action: 'remove-dry-run', pattern: /^(?:删除功能|删除模块|移除功能|移除模块)\s*(?:[:：|｜\-]\s*)?/u },
  { action: 'add', pattern: /^(?:新增功能|新增模块|新建功能|新建模块|创建功能|创建模块|增加功能|增加模块)\s*(?:[:：|｜\-]\s*)?/u },
  { action: 'update', pattern: /^(?:功能迭代|迭代功能|修改功能|更新功能|优化功能|调整功能|维护功能)\s*(?:[:：|｜\-]\s*)?/u }
];

export function detectChatAction(input = '') {
  const headline = String(input || '').split(/\r?\n/).map((line) => line.trim()).find(Boolean) || '';
  for (const item of ACTION_PATTERNS) {
    if (item.pattern.test(headline)) {
      return item.action;
    }
  }
  return 'update';
}

function parseArgs(args) {
  const confirmIndex = args.indexOf('--confirm');
  const confirm = confirmIndex === -1 ? '' : args[confirmIndex + 1] || '';
  const text = args.filter((arg, index) => {
    if (arg === '--confirm') {
      return false;
    }
    if (confirmIndex !== -1 && index === confirmIndex + 1) {
      return false;
    }
    return true;
  }).join(' ').trim();
  return { text, confirm };
}

export function runChatCommand({ text = '', confirm = '' } = {}) {
  if (!text) {
    return ['Usage: npm run ai:do -- "新增功能：客户管理" | "功能迭代：客户管理" | "删除功能预分析：客户管理" | "确认删除：客户管理"'];
  }
  const action = detectChatAction(text);
  if (action === 'add') {
    return addFeatureWorkflow({ name: text });
  }
  if (action === 'update') {
    return updateFeatureWorkflow({ name: text });
  }
  if (action === 'remove-dry-run') {
    return removeFeatureDryRunWorkflow({ name: text });
  }
  return removeFeatureApplyWorkflow({ name: text, confirm });
}

if (isCli(import.meta.url)) {
  const { text, confirm } = parseArgs(process.argv.slice(2));
  finish('ai:do', runChatCommand({ text, confirm }));
}
