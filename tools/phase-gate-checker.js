import { ensure, finish, isCli, readJson, readText } from './common.js';
import { collectChangedFiles } from './diff-checker.js';

const REQUIRED_GATES = [
  'beforeSalesOrder',
  'beforeDelivery',
  'beforeFinance',
  'beforeProduction'
];

const REQUIRED_BEFORE_SALES_ORDER = [
  'multi-role-review',
  'current-context',
  'doc-size',
  'read-budget',
  'context-pack',
  'file-weight',
  'roadmap-check',
  'phase-gate-check',
  'refactor-debt-check',
  'snapshot-contract',
  'state-machine-contract',
  'fund-boundary-contract'
];

const COMPLETE_STATUSES = new Set(['complete', 'completed', 'done', 'passed', 'verified']);

function readCurrentImpact(readJsonFile) {
  try {
    const current = readJsonFile('ai/changes/CURRENT_CHANGE.json').current;
    return current ? readJsonFile(`ai/changes/${current}/impact.json`) : {};
  } catch {
    return {};
  }
}

const SALES_ORDER_IMPLEMENTATION_ROOTS = [
  'ruoyi-business/src/main/java/com/ruoyi/business/',
  'ruoyi-admin/src/main/java/com/ruoyi/web/controller/business/',
  'ruoyi-business/src/main/resources/mapper/',
  'ruoyi-admin/src/main/resources/mapper/',
  'ruoyi-system/src/main/java/',
  'ruoyi-system/src/main/resources/',
  'ruoyi-generator/src/main/java/',
  'ruoyi-generator/src/main/resources/',
  'ruoyi-quartz/src/main/java/',
  'ruoyi-quartz/src/main/resources/',
  'ruoyi-admin/sql/',
  'ruoyi-admin/src/main/resources/sql/',
  'ruoyi-ui/src/router/',
  'ruoyi-ui/src/store/',
  'ruoyi-ui/src/views/',
  'ruoyi-ui/src/api/',
  'ruoyi-ui/src/permission.js',
  'sql/'
];

const SALES_ORDER_RUNTIME_TEXT_ROOTS = [
  'ruoyi-business/src/main/java/com/ruoyi/business/',
  'ruoyi-admin/src/main/java/com/ruoyi/web/controller/business/',
  'ruoyi-business/src/main/resources/mapper/',
  'ruoyi-admin/src/main/resources/mapper/',
  'ruoyi-system/src/main/java/',
  'ruoyi-system/src/main/resources/',
  'ruoyi-generator/src/main/java/',
  'ruoyi-generator/src/main/resources/',
  'ruoyi-quartz/src/main/java/',
  'ruoyi-quartz/src/main/resources/',
  'ruoyi-admin/sql/',
  'ruoyi-admin/src/main/resources/sql/',
  'ruoyi-ui/src/router/',
  'ruoyi-ui/src/store/',
  'ruoyi-ui/src/views/',
  'ruoyi-ui/src/api/',
  'ruoyi-ui/src/permission.js',
  'sql/'
];

const SALES_ORDER_RUNTIME_TEXT_PATTERNS = [
  /\bcreate\s+table\s+(?:if\s+not\s+exists\s+)?[`"]?sales_order[`"]?/i,
  /\bcreate\s+table\s+(?:if\s+not\s+exists\s+)?[`"]?sales_order_item[`"]?/i,
  /['"`][^'"`]*(?:sales-order|salesorder|sales_order|sales\/order|salesOrder|\/sales-order|\/salesorder|\/sales_order|\/sales\/order|\/salesOrder)[^'"`]*['"`]/,
  /\bbusiness:sales(?::|-|_)?order\b/i
];

function salesOrderKey(segment) {
  return String(segment || '')
    .split('.')[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function hasSalesOrderName(relativePath) {
  const keys = String(relativePath || '')
    .split('/')
    .filter(Boolean)
    .map(salesOrderKey);
  return keys.some((key) => key === 'salesorder' || key.startsWith('salesorder'))
    || keys.some((key, index) => key === 'sales' && keys[index + 1]?.startsWith('order'));
}

export function isSalesOrderImplementationPath(file) {
  const normalized = String(file).replace(/\\/g, '/').replace(/^\.\/+/, '');
  return SALES_ORDER_IMPLEMENTATION_ROOTS.some((root) => {
    if (!normalized.startsWith(root)) {
      return false;
    }
    return hasSalesOrderName(normalized.slice(root.length));
  });
}

function isSalesOrderRuntimeTextRoot(file) {
  const normalized = String(file).replace(/\\/g, '/').replace(/^\.\/+/, '');
  return SALES_ORDER_RUNTIME_TEXT_ROOTS.some((root) => normalized.startsWith(root));
}

function readTextSafe(readTextFile, file) {
  try {
    return readTextFile(file);
  } catch {
    return '';
  }
}

export function isSalesOrderImplementationContent(file, readTextFile = readText) {
  if (!isSalesOrderRuntimeTextRoot(file)) {
    return false;
  }
  const text = readTextSafe(readTextFile, file);
  return SALES_ORDER_RUNTIME_TEXT_PATTERNS.some((pattern) => pattern.test(text));
}

function salesOrderAttempted({ impact, changedFiles, readTextFile }) {
  const hasRuntimeChange = changedFiles.some((file) => (
    isSalesOrderImplementationPath(file)
    || isSalesOrderImplementationContent(file, readTextFile)
  ));
  if (impact?.noSalesOrderImplementation === true || impact?.mode === 'rule-change' || impact?.mode === 'governance') {
    return hasRuntimeChange;
  }
  const featureId = typeof impact?.feature === 'object' ? impact.feature.id : impact?.feature;
  return featureId === 'sales-order' || hasRuntimeChange;
}

function backlogStatusMap(readJsonFile) {
  try {
    const backlog = readJsonFile('ai/roadmap/enhancement-backlog.json');
    return new Map((backlog.items || []).map((item) => [item.id, item.status]));
  } catch {
    return new Map();
  }
}

export function validatePhaseGates({
  file = 'ai/roadmap/phase-gates.json',
  readJsonFile = readJson,
  readTextFile = readText,
  changedFiles = collectChangedFiles()
} = {}) {
  const errors = [];
  let data;
  try {
    data = readJsonFile(file);
  } catch (error) {
    return [`${file} could not be read as JSON: ${error.message}`];
  }

  ensure(data.schemaVersion === 1, `${file} schemaVersion must be 1.`, errors);
  ensure(data.gates && typeof data.gates === 'object', `${file} gates must be an object.`, errors);
  if (!data.gates || typeof data.gates !== 'object') {
    return errors;
  }

  for (const gateId of REQUIRED_GATES) {
    const gate = data.gates[gateId];
    ensure(Boolean(gate), `${file} must define ${gateId}.`, errors);
    if (!gate) {
      continue;
    }
    ensure(Array.isArray(gate.required), `${file} ${gateId}.required must be an array.`, errors);
    ensure(Array.isArray(gate.deferred), `${file} ${gateId}.deferred must be an array.`, errors);
    for (const deferred of gate.deferred || []) {
      ensure(typeof deferred.reason === 'string' && deferred.reason.trim().length > 0, `${file} ${gateId}.deferred item ${deferred.id || '<missing id>'} must include reason.`, errors);
    }
  }

  const beforeSalesOrder = data.gates.beforeSalesOrder || {};
  for (const id of REQUIRED_BEFORE_SALES_ORDER) {
    ensure((beforeSalesOrder.required || []).includes(id), `${file} beforeSalesOrder.required must include ${id}.`, errors);
  }

  const impact = readCurrentImpact(readJsonFile);
  if (salesOrderAttempted({ impact, changedFiles, readTextFile })) {
    const statuses = backlogStatusMap(readJsonFile);
    const incomplete = REQUIRED_BEFORE_SALES_ORDER.filter((id) => !COMPLETE_STATUSES.has(statuses.get(id)));
    ensure(incomplete.length === 0, `sales-order implementation is blocked until beforeSalesOrder.required is complete: ${incomplete.join(', ')}.`, errors);
  }

  return errors;
}

if (isCli(import.meta.url)) {
  finish('check:phase-gate', validatePhaseGates());
}
