import test from 'node:test';
import assert from 'node:assert/strict';
import { fileExists, readJson, readText } from '../tools/common.js';

const CUSTOMER_SERVICE = 'ruoyi-business/src/main/java/com/ruoyi/business/customer/service/impl/CustomerServiceImpl.java';
const CUSTOMER_SERVICE_INTERFACE = 'ruoyi-business/src/main/java/com/ruoyi/business/customer/service/ICustomerService.java';
const CUSTOMER_FUND_SERVICE = 'ruoyi-business/src/main/java/com/ruoyi/business/customer/service/impl/CustomerFundServiceImpl.java';
const CUSTOMER_FUND_SERVICE_INTERFACE = 'ruoyi-business/src/main/java/com/ruoyi/business/customer/service/ICustomerFundService.java';
const CUSTOMER_MAPPER = 'ruoyi-business/src/main/java/com/ruoyi/business/customer/mapper/CustomerMapper.java';
const CUSTOMER_MAPPER_XML = 'ruoyi-business/src/main/resources/mapper/customer/CustomerMapper.xml';
const CUSTOMER_CONTROLLER = 'ruoyi-admin/src/main/java/com/ruoyi/web/controller/business/customer/CustomerController.java';
const CUSTOMER_API = 'ruoyi-ui/src/api/customer.js';
const CUSTOMER_API_CONTRACT = 'ruoyi-ui/src/api/customer.contract.md';
const CUSTOMER_API_OWNERSHIP_CONTRACT = 'ai/contracts/customer.api.md';
const CUSTOMER_UI_CONTRACT = 'ai/contracts/customer.ui.md';
const CUSTOMER_FEATURE = 'features/customer.md';
const CUSTOMER_VIEW = 'ruoyi-ui/src/views/customer/index.vue';
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
  const fundService = readText(CUSTOMER_FUND_SERVICE);
  const resolveFlowType = methodBody(fundService, 'private String resolveFlowType');

  assert.match(resolveFlowType, /CUSTOMER_DEPOSIT\.equals\(accountType\)/);
  assert.match(resolveFlowType, /DEPOSIT_IN\.equals\(flowType\)[\s\S]*return DEPOSIT_IN/);
  assert.match(resolveFlowType, /isDepositChangeFlowType\(flowType\)[\s\S]*throw new ServiceException\(DEPOSIT_IN_ONLY_MESSAGE\)/);
  assert.doesNotMatch(
    resolveFlowType,
    /isDepositChangeFlowType\(flowType\)[\s\S]{0,160}return flowType/,
    'deposit change flow types must be rejected, not returned'
  );

  for (const flowType of BLOCKED_DEPOSIT_FLOW_TYPES) {
    assert.match(fundService, new RegExp(`${flowType}\\.equals\\(flowType\\)`), `${flowType} must be explicitly rejected`);
  }
});

test('customer deposit endpoint is account-locked to customer deposit', () => {
  const controller = readText(CUSTOMER_CONTROLLER);
  const serviceInterface = readText(CUSTOMER_SERVICE_INTERFACE);
  const service = readText(CUSTOMER_SERVICE);
  const fundServiceInterface = readText(CUSTOMER_FUND_SERVICE_INTERFACE);
  const fundService = readText(CUSTOMER_FUND_SERVICE);
  const fundDeposit = methodBody(controller, 'public AjaxResult fundDeposit');
  const serviceRecordCustomerDeposit = methodBody(service, 'public CustomerFundFlow recordCustomerDeposit');
  const fundRecordCustomerDeposit = methodBody(fundService, 'public CustomerFundFlow recordCustomerDeposit');
  const validateAccountType = methodBody(fundService, 'private void validateCustomerDepositAccountType');

  assert.match(serviceInterface, /recordCustomerDeposit\(Long customerId, CustomerFundEntry entry, Long operatorId, String operatorName\)/);
  assert.match(fundServiceInterface, /recordCustomerDeposit\(Long customerId, CustomerFundEntry entry, Long operatorId, String operatorName\)/);
  assert.match(fundDeposit, /customerService\.recordCustomerDeposit\(customerId, entry, getUserId\(\), getUsername\(\)\)/);
  assert.doesNotMatch(fundDeposit, /recordFundEntry/, 'external fund deposit endpoint must not call the generic fund-entry path directly');

  assert.match(serviceRecordCustomerDeposit, /customerFundService\.recordCustomerDeposit\(customerId, entry, operatorId, operatorName\)/);
  assert.doesNotMatch(serviceRecordCustomerDeposit, /recordFundEntry/, 'customer service deposit wrapper must delegate to fund service, not generic fund entry');

  assert.match(fundRecordCustomerDeposit, /validateCustomerDepositAccountType\(entry\.getAccountType\(\)\)/);
  assert.match(fundRecordCustomerDeposit, /entry\.setAccountType\(CUSTOMER_DEPOSIT\)/);
  assert.match(fundRecordCustomerDeposit, /return recordFundEntryInternal\(customerId, entry, operatorId, operatorName\)/);

  const validateIndex = fundRecordCustomerDeposit.indexOf('validateCustomerDepositAccountType(entry.getAccountType())');
  const setIndex = fundRecordCustomerDeposit.indexOf('entry.setAccountType(CUSTOMER_DEPOSIT)');
  const recordIndex = fundRecordCustomerDeposit.indexOf('recordFundEntryInternal(customerId, entry, operatorId, operatorName)');
  assert.ok(validateIndex < setIndex, 'account type must be validated before defaulting/stamping CUSTOMER_DEPOSIT');
  assert.ok(setIndex < recordIndex, 'CUSTOMER_DEPOSIT must be stamped before the shared fund-entry transaction runs');
  assert.doesNotMatch(
    fundRecordCustomerDeposit,
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
  const fundService = readText(CUSTOMER_FUND_SERVICE);
  const createSampleRebate = methodBody(service, 'public SampleRebateRecord createSampleRebateRecord');
  const recordSampleRebateFlow = methodBody(fundService, 'public CustomerFundFlow recordSampleRebateFlow');
  const recordFundEntryInternal = methodBody(fundService, 'private CustomerFundFlow recordFundEntryInternal');

  assert.match(createSampleRebate, /customerMapper\.insertSampleRebateRecord\(record\)/);
  assert.match(createSampleRebate, /customerFundService\.recordSampleRebateFlow\(record, operatorId, operatorName\)/);
  assert.doesNotMatch(createSampleRebate, /recordCustomerDeposit/, 'sample rebate must not go through the external deposit-only wrapper');

  const insertRecordIndex = createSampleRebate.indexOf('customerMapper.insertSampleRebateRecord(record)');
  const internalFundIndex = createSampleRebate.indexOf('customerFundService.recordSampleRebateFlow(record, operatorId, operatorName)');
  assert.ok(insertRecordIndex < internalFundIndex, 'sample rebate must create sample_rebate_record before internal SAMPLE_REBATE flow');
  assert.match(recordSampleRebateFlow, /entry\.setAccountType\(SAMPLE_REBATE\)/);
  assert.match(recordSampleRebateFlow, /entry\.setFlowType\(SAMPLE_REBATE_GENERATE\)/);
  assert.match(recordSampleRebateFlow, /recordFundEntryInternal\(record\.getCustomerId\(\), entry, operatorId, operatorName\)/);
  assert.match(recordFundEntryInternal, /String accountType = normalizeAccountType\(entry\.getAccountType\(\)\)/);
  assert.match(recordFundEntryInternal, /SAMPLE_REBATE\.equals\(accountType\)/, 'generic internal fund-entry path must still support SAMPLE_REBATE');
  assert.match(recordFundEntryInternal, /if \(!SAMPLE_REBATE\.equals\(accountType\)\)/, 'sample rebate must not create a customer deposit batch');
});

test('customer fund service owns concurrency-safe fund mutation', () => {
  assert.equal(fileExists(CUSTOMER_FUND_SERVICE_INTERFACE), true);
  assert.equal(fileExists(CUSTOMER_FUND_SERVICE), true);

  const service = readText(CUSTOMER_SERVICE);
  const fundService = readText(CUSTOMER_FUND_SERVICE);
  const mapper = readText(CUSTOMER_MAPPER);
  const mapperXml = readText(CUSTOMER_MAPPER_XML);
  const recordFundEntryInternal = methodBody(fundService, 'private CustomerFundFlow recordFundEntryInternal');
  const ensureForUpdate = methodBody(fundService, 'private CustomerFundAccount ensureFundAccountForUpdate');
  const insertFundFlowWithRetry = methodBody(fundService, 'private void insertFundFlowWithRetry');
  const insertDepositBatchWithRetry = methodBody(fundService, 'private void insertDepositBatchWithRetry');

  assert.match(service, /private ICustomerFundService customerFundService/);
  assert.doesNotMatch(service, /selectFundAccountForUpdate|updateFundAccountBalance|insertDepositBatch|insertFundFlow/);
  assert.doesNotMatch(service, /ensureFundAccountForUpdate|insertFundFlowWithRetry|insertDepositBatchWithRetry/);

  assert.match(mapper, /selectFundAccountForUpdate\(@Param\("customerId"\) Long customerId, @Param\("accountType"\) String accountType\)/);
  assert.match(mapperXml, /<select id="selectFundAccountForUpdate"[\s\S]*from customer_fund_account[\s\S]*where customer_id = #\{customerId\}[\s\S]*and account_type = #\{accountType\}[\s\S]*limit 1[\s\S]*for update[\s\S]*<\/select>/);

  assert.match(fundService, /@Transactional[\s\S]{0,100}public CustomerFundFlow recordCustomerDeposit/);
  assert.match(fundService, /@Transactional[\s\S]{0,100}public CustomerFundFlow recordFundEntry/);
  assert.match(fundService, /@Transactional[\s\S]{0,100}public CustomerFundFlow recordSampleRebateFlow/);

  assert.match(recordFundEntryInternal, /CustomerFundAccount account = ensureFundAccountForUpdate\(customerId, accountType, operatorName\)/);
  assert.match(recordFundEntryInternal, /BigDecimal beforeBalance = money\(account\.getBalanceAmount\(\)\)/);
  assert.ok(
    recordFundEntryInternal.indexOf('ensureFundAccountForUpdate(customerId, accountType, operatorName)')
      < recordFundEntryInternal.indexOf('BigDecimal beforeBalance = money(account.getBalanceAmount())'),
    'balance calculation must happen after the locked account read'
  );

  assert.match(ensureForUpdate, /selectFundAccountForUpdate\(customerId, accountType\)/);
  assert.match(ensureForUpdate, /catch \(DuplicateKeyException e\)/);
  assert.match(ensureForUpdate, /account = customerMapper\.selectFundAccountForUpdate\(customerId, accountType\)/);
  assert.ok(
    ensureForUpdate.indexOf('catch (DuplicateKeyException e)')
      < ensureForUpdate.lastIndexOf('selectFundAccountForUpdate(customerId, accountType)'),
    'duplicate account creation must re-read with row lock'
  );

  assert.match(insertFundFlowWithRetry, /for \(int attempt = 0; attempt < UNIQUE_NO_MAX_RETRY; attempt\+\+\)/);
  assert.match(insertFundFlowWithRetry, /flow\.setFlowNo\(nextNo\("FLOW"\)\)/);
  assert.match(insertFundFlowWithRetry, /customerMapper\.insertFundFlow\(flow\)/);
  assert.match(insertFundFlowWithRetry, /catch \(DuplicateKeyException e\)/);
  assert.match(insertFundFlowWithRetry, /资金流水编号生成冲突，请重试/);

  assert.match(insertDepositBatchWithRetry, /for \(int attempt = 0; attempt < UNIQUE_NO_MAX_RETRY; attempt\+\+\)/);
  assert.match(insertDepositBatchWithRetry, /batch\.setDepositBatchNo\(nextNo\("DEP"\)\)/);
  assert.match(insertDepositBatchWithRetry, /customerMapper\.insertDepositBatch\(batch\)/);
  assert.match(insertDepositBatchWithRetry, /catch \(DuplicateKeyException e\)/);
  assert.match(insertDepositBatchWithRetry, /定金批次编号生成冲突，请重试/);
});

test('customer api contract Client Methods match customer.js exports', () => {
  const apiExports = exportedApiMethods(readText(CUSTOMER_API));
  const contractMethods = contractClientMethods(readText(CUSTOMER_API_CONTRACT));

  assert.deepEqual(sorted(contractMethods), sorted(apiExports));
});

test('salesman candidates do not fallback to all normal users', () => {
  const service = readText(CUSTOMER_SERVICE);
  const selectSalesmanCandidates = methodBody(service, 'public List<SysUser> selectSalesmanCandidates');

  assert.doesNotMatch(
    service,
    /salesmen\.isEmpty\(\)\s*\?\s*users\s*:\s*salesmen/,
    'CustomerServiceImpl must not return all normal users when no sales roles match'
  );
  assert.match(
    selectSalesmanCandidates,
    /return\s+salesmen\s*;/,
    'selectSalesmanCandidates must return only users with matching sales roles'
  );
});

test('salesman candidate contracts document empty no-fallback behavior', () => {
  for (const file of [CUSTOMER_FEATURE, CUSTOMER_API_OWNERSHIP_CONTRACT, CUSTOMER_UI_CONTRACT]) {
    const text = readText(file);
    assert.match(text, /业务员候选只返回拥有销售\/业务员角色的正常用户/, `${file} must define strict salesman candidates`);
    assert.match(text, /返回空列表/, `${file} must document the empty-list result`);
    assert.match(text, /不回退到全部用户/, `${file} must reject fallback to all users`);
  }
});

test('frontend warns when no salesman role users are configured', () => {
  const view = readText(CUSTOMER_VIEW);
  assert.match(view, /未找到销售\/业务员角色用户，请先配置销售角色。/);
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
