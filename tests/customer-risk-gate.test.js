import test from 'node:test';
import assert from 'node:assert/strict';
import { fileExists, readJson, readText } from '../tools/common.js';

const CUSTOMER_SERVICE = 'ruoyi-business/src/main/java/com/ruoyi/business/customer/service/impl/CustomerServiceImpl.java';
const CUSTOMER_SERVICE_INTERFACE = 'ruoyi-business/src/main/java/com/ruoyi/business/customer/service/ICustomerService.java';
const CUSTOMER_CONTROLLER = 'ruoyi-admin/src/main/java/com/ruoyi/web/controller/business/customer/CustomerController.java';
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

test('customer deposit endpoint is account-locked to customer deposit', () => {
  const controller = readText(CUSTOMER_CONTROLLER);
  const serviceInterface = readText(CUSTOMER_SERVICE_INTERFACE);
  const service = readText(CUSTOMER_SERVICE);
  const fundDeposit = methodBody(controller, 'public AjaxResult fundDeposit');
  const recordCustomerDeposit = methodBody(service, 'public CustomerFundFlow recordCustomerDeposit');
  const validateAccountType = methodBody(service, 'private void validateCustomerDepositAccountType');

  assert.match(serviceInterface, /recordCustomerDeposit\(Long customerId, CustomerFundEntry entry, Long operatorId, String operatorName\)/);
  assert.match(fundDeposit, /customerService\.recordCustomerDeposit\(customerId, entry, getUserId\(\), getUsername\(\)\)/);
  assert.doesNotMatch(fundDeposit, /recordFundEntry/, 'external fund deposit endpoint must not call the generic fund-entry path directly');

  assert.match(recordCustomerDeposit, /validateCustomerDepositAccountType\(entry\.getAccountType\(\)\)/);
  assert.match(recordCustomerDeposit, /entry\.setAccountType\(CUSTOMER_DEPOSIT\)/);
  assert.match(recordCustomerDeposit, /return recordFundEntry\(customerId, entry, operatorId, operatorName\)/);

  const validateIndex = recordCustomerDeposit.indexOf('validateCustomerDepositAccountType(entry.getAccountType())');
  const setIndex = recordCustomerDeposit.indexOf('entry.setAccountType(CUSTOMER_DEPOSIT)');
  const recordIndex = recordCustomerDeposit.indexOf('recordFundEntry(customerId, entry, operatorId, operatorName)');
  assert.ok(validateIndex < setIndex, 'account type must be validated before defaulting/stamping CUSTOMER_DEPOSIT');
  assert.ok(setIndex < recordIndex, 'CUSTOMER_DEPOSIT must be stamped before the shared fund-entry transaction runs');
  assert.doesNotMatch(
    recordCustomerDeposit,
    /ensureFundAccount|updateFundAccountBalance|insertDepositBatch|insertFundFlow/,
    'rejected account types must fail before account balances, batches, or fund flows can be mutated'
  );

  assert.match(validateAccountType, /StringUtils\.isEmpty\(accountType\)/, 'omitted accountType must be accepted for default CUSTOMER_DEPOSIT');
  assert.match(validateAccountType, /CUSTOMER_DEPOSIT\.equals\(accountType\)/, 'explicit CUSTOMER_DEPOSIT must be accepted');
  assert.doesNotMatch(
    validateAccountType,
    /SAMPLE_REBATE\.equals\(accountType\)[\s\S]{0,120}return/,
    'SAMPLE_REBATE must not be accepted by the external deposit endpoint'
  );
  assert.match(validateAccountType, /throw new ServiceException\(DEPOSIT_ACCOUNT_ONLY_MESSAGE\)/, 'all non-CUSTOMER_DEPOSIT account types must fail');
});

test('sample rebate keeps its internal sample-rebate fund flow path', () => {
  const service = readText(CUSTOMER_SERVICE);
  const createSampleRebate = methodBody(service, 'public SampleRebateRecord createSampleRebateRecord');
  const recordFundEntry = methodBody(service, 'public CustomerFundFlow recordFundEntry');

  assert.match(createSampleRebate, /customerMapper\.insertSampleRebateRecord\(record\)/);
  assert.match(createSampleRebate, /entry\.setAccountType\(SAMPLE_REBATE\)/);
  assert.match(createSampleRebate, /entry\.setFlowType\(SAMPLE_REBATE_GENERATE\)/);
  assert.match(createSampleRebate, /recordFundEntry\(record\.getCustomerId\(\), entry, operatorId, operatorName\)/);
  assert.doesNotMatch(createSampleRebate, /recordCustomerDeposit/, 'sample rebate must not go through the external deposit-only wrapper');

  const insertRecordIndex = createSampleRebate.indexOf('customerMapper.insertSampleRebateRecord(record)');
  const internalFundIndex = createSampleRebate.indexOf('recordFundEntry(record.getCustomerId(), entry, operatorId, operatorName)');
  assert.ok(insertRecordIndex < internalFundIndex, 'sample rebate must create sample_rebate_record before internal SAMPLE_REBATE flow');
  assert.match(recordFundEntry, /String accountType = normalizeAccountType\(entry\.getAccountType\(\)\)/);
  assert.match(recordFundEntry, /SAMPLE_REBATE\.equals\(accountType\)/, 'generic internal fund-entry path must still support SAMPLE_REBATE');
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
