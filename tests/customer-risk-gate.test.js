import test from 'node:test';
import assert from 'node:assert/strict';
import { fileExists, readJson, readText } from '../tools/common.js';

const CUSTOMER_SERVICE = 'ruoyi-business/src/main/java/com/ruoyi/business/customer/service/impl/CustomerServiceImpl.java';
const CUSTOMER_API = 'ruoyi-ui/src/api/customer.js';
const CUSTOMER_API_CONTRACT = 'ruoyi-ui/src/api/customer.contract.md';
const CUSTOMER_UI_CONTRACT = 'ai/contracts/customer.ui.md';
const CUSTOMER_FEATURE = 'features/customer.md';
const CUSTOMER_SQL = 'sql/customer.ownership.md';

const BLOCKED_DEPOSIT_FLOW_TYPES = [
  'DEPOSIT_DEDUCT',
  'DEPOSIT_REFUND',
  'DEPOSIT_ADJUST',
  'DEPOSIT_REVERSE'
];

function sorted(values) {
  return [...values].sort((a, b) => a.localeCompare(b));
}

function exportedApiMethods(source) {
  return [...source.matchAll(/^export function\s+([A-Za-z0-9_]+)/gm)].map((match) => match[1]);
}

function contractClientMethods(contractText) {
  const section = contractText.match(/^## Client Methods\s*\n([\s\S]*?)(?=^##\s|\z)/m)?.[1] || '';
  return [...section.matchAll(/^\s*-\s+`([^`]+)`/gm)].map((match) => match[1]);
}

function methodBody(source, signature) {
  const signatureIndex = source.indexOf(signature);
  assert.notEqual(signatureIndex, -1, `${signature} must exist`);
  const openIndex = source.indexOf('{', signatureIndex);
  assert.notEqual(openIndex, -1, `${signature} must have a body`);
  let depth = 0;
  for (let index = openIndex; index < source.length; index += 1) {
    if (source[index] === '{') {
      depth += 1;
    } else if (source[index] === '}') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(openIndex + 1, index);
      }
    }
  }
  assert.fail(`${signature} body must be balanced`);
}

test('main check reaches the customer risk gate through npm test', () => {
  const pkg = readJson('package.json');
  assert.ok(pkg.scripts.check.includes('npm test'), 'npm run check must include npm test');
  assert.equal(pkg.scripts.test, 'node --test tests/*.test.js');
  assert.equal(fileExists('tests/customer-risk-gate.test.js'), true);
});

test('customer deposit entry endpoint stays deposit-in only', () => {
  const service = readText(CUSTOMER_SERVICE);
  const resolveFlowType = methodBody(service, 'private String resolveFlowType');

  assert.match(resolveFlowType, /CUSTOMER_DEPOSIT\.equals\(accountType\)/);
  assert.match(resolveFlowType, /DEPOSIT_IN\.equals\(flowType\)[\s\S]*return DEPOSIT_IN/);
  assert.match(resolveFlowType, /isDepositChangeFlowType\(flowType\)[\s\S]*throw new ServiceException\(DEPOSIT_IN_ONLY_MESSAGE\)/);
  assert.doesNotMatch(
    resolveFlowType,
    /isDepositChangeFlowType\(flowType\)[\s\S]{0,160}return flowType/,
    'deposit change flow types must be rejected, not returned'
  );

  for (const flowType of BLOCKED_DEPOSIT_FLOW_TYPES) {
    assert.match(service, new RegExp(`${flowType}\\.equals\\(flowType\\)`), `${flowType} must be explicitly rejected`);
  }
});

test('customer api contract Client Methods match customer.js exports', () => {
  const apiExports = exportedApiMethods(readText(CUSTOMER_API));
  const contractMethods = contractClientMethods(readText(CUSTOMER_API_CONTRACT));

  assert.deepEqual(sorted(contractMethods), sorted(apiExports));
});

test('docs record edit-time default sync as a user requirement', () => {
  for (const file of [CUSTOMER_FEATURE, CUSTOMER_UI_CONTRACT, CUSTOMER_API_CONTRACT]) {
    const text = readText(file);
    assert.match(text, /user requirement/i, `${file} must record the user requirement`);
    assert.match(text, /edit/i, `${file} must mention edit-time behavior`);
    assert.match(text, /REAL|real customer/i, `${file} must scope the sync default to real customers`);
    assert.match(text, /default-contact|syncDefaultContact/i, `${file} must mention default contact sync`);
    assert.match(text, /default-address|syncDefaultAddress/i, `${file} must mention default address sync`);
  }
});

test('public customers stay fixed to the two built-in classification rows', () => {
  const feature = readText(CUSTOMER_FEATURE);
  const sql = readText(CUSTOMER_SQL);

  for (const text of [feature, sql]) {
    assert.match(text, /PUB_DIRECT_SALE/);
    assert.match(text, /PUB_SELF_MEDIA/);
  }

  assert.match(feature, /Only two built-in PUBLIC classification customers/i);
  assert.match(sql, /Expected:\s*public_count\s*=\s*2/i);
  assert.match(sql, /customer_code not in \('PUB_DIRECT_SALE', 'PUB_SELF_MEDIA'\)/i);
  assert.match(sql, /where not exists \(select 1 from customer where customer_code = 'PUB_DIRECT_SALE'\)/i);
  assert.match(sql, /where not exists \(select 1 from customer where customer_code = 'PUB_SELF_MEDIA'\)/i);
});
