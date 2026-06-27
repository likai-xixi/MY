import test from 'node:test';
import assert from 'node:assert/strict';
import { fileExists, readJson, readText } from '../tools/common.js';

const CUSTOMER_SERVICE = 'ruoyi-business/src/main/java/com/ruoyi/business/customer/service/impl/CustomerServiceImpl.java';
const CUSTOMER_SERVICE_INTERFACE = 'ruoyi-business/src/main/java/com/ruoyi/business/customer/service/ICustomerService.java';
const CUSTOMER_FUND_SERVICE = 'ruoyi-business/src/main/java/com/ruoyi/business/customer/service/impl/CustomerFundServiceImpl.java';
const CUSTOMER_FUND_SERVICE_INTERFACE = 'ruoyi-business/src/main/java/com/ruoyi/business/customer/service/ICustomerFundService.java';
const CUSTOMER_MAPPER = 'ruoyi-business/src/main/java/com/ruoyi/business/customer/mapper/CustomerMapper.java';
const CUSTOMER_MAPPER_XML = 'ruoyi-business/src/main/resources/mapper/customer/CustomerMapper.xml';
const CUSTOMER_FUND_ENTRY = 'ruoyi-business/src/main/java/com/ruoyi/business/customer/domain/CustomerFundEntry.java';
const SAMPLE_REBATE_RECORD = 'ruoyi-business/src/main/java/com/ruoyi/business/customer/domain/SampleRebateRecord.java';
const CUSTOMER_CONTROLLER = 'ruoyi-admin/src/main/java/com/ruoyi/web/controller/business/customer/CustomerController.java';
const CUSTOMER_API = 'ruoyi-ui/src/api/customer.js';
const CUSTOMER_API_CONTRACT = 'ruoyi-ui/src/api/customer.contract.md';
const CUSTOMER_API_OWNERSHIP_CONTRACT = 'ai/contracts/customer.api.md';
const CUSTOMER_UI_CONTRACT = 'ai/contracts/customer.ui.md';
const CUSTOMER_FEATURE = 'features/customer.md';
const CUSTOMER_VIEW = 'ruoyi-ui/src/views/customer/index.vue';
const CUSTOMER_SQL = 'sql/customer.ownership.md';
const CUSTOMER_MENU_PERMISSION_SQL = 'sql/migrations/V20260625_003_customer_menu_permission.sql';
const FEATURES_REGISTRY = 'ai/registry/features.json';
const HIGH_RISK_PERMISSION_COVERAGE = 'ai/registry/high-risk-permission-coverage.json';
const IDEMPOTENCY_SERVICE = 'ruoyi-business/src/main/java/com/ruoyi/business/common/idempotency/service/impl/IdempotencyServiceImpl.java';
const IDEMPOTENCY_HASH = 'ruoyi-business/src/main/java/com/ruoyi/business/common/idempotency/support/IdempotencyRequestHash.java';
const IDEMPOTENCY_MAPPER_XML = 'ruoyi-business/src/main/resources/mapper/common/IdempotentRequestMapper.xml';
const IDEMPOTENT_MIGRATION = 'sql/migrations/V20260625_004_idempotent_request.sql';
const IDEMPOTENCY_REGISTRY = 'ai/registry/idempotency-registry.json';
const MIGRATION_REGISTRY = 'ai/registry/migration-registry.json';
const IDEMPOTENCY_SERVICE_TEST = 'ruoyi-business/src/test/java/com/ruoyi/business/common/idempotency/IdempotencyServiceTest.java';
const CUSTOMER_FUND_SERVICE_TEST = 'ruoyi-business/src/test/java/com/ruoyi/business/customer/service/CustomerFundServiceTest.java';
const CUSTOMER_SERVICE_TEST = 'ruoyi-business/src/test/java/com/ruoyi/business/customer/service/CustomerServiceTest.java';
const CUSTOMER_FUND_MYSQL_IT = 'ruoyi-business/src/test/java/com/ruoyi/business/customer/service/CustomerFundMySqlIT.java';

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

function methodAnnotations(source, signature) {
  const signatureIndex = source.indexOf(signature);
  assert.notEqual(signatureIndex, -1, `${signature} must exist`);
  const startIndex = source.lastIndexOf('\n    @PreAuthorize', signatureIndex);
  assert.notEqual(startIndex, -1, `${signature} must have a permission annotation`);
  return source.slice(startIndex, signatureIndex);
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
  assert.match(fundRecordCustomerDeposit, /CustomerFundFlow flow = recordFundEntryInternal\(customerId, entry, operatorId, operatorName\)/);
  assert.match(fundRecordCustomerDeposit, /return flow;/);

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

test('customer fund idempotency payload migration and registries are required', () => {
  const fundEntry = readText(CUSTOMER_FUND_ENTRY);
  const sampleRebateRecord = readText(SAMPLE_REBATE_RECORD);
  const idempotencyService = readText(IDEMPOTENCY_SERVICE);
  const migration = readText(IDEMPOTENT_MIGRATION);
  const mapperXml = readText(IDEMPOTENCY_MAPPER_XML);
  const idempotencyRegistry = readJson(IDEMPOTENCY_REGISTRY);
  const migrationRegistry = readJson(MIGRATION_REGISTRY);

  assert.match(fundEntry, /private String idempotentKey;/);
  assert.match(fundEntry, /getIdempotentKey\(\)/);
  assert.match(sampleRebateRecord, /private String idempotentKey;/);
  assert.match(sampleRebateRecord, /getIdempotentKey\(\)/);

  assert.equal(fileExists(IDEMPOTENT_MIGRATION), true);
  assert.match(migration, /create table idempotent_request \(/i);
  assert.match(migration, /unique key uk_idempotent_biz_key \(biz_type, idempotent_key\)/i);
  assert.doesNotMatch(migration, /unique key uk_idempotent_biz_key \(idempotent_key\)/i);

  for (const status of ['PROCESSING', 'SUCCESS', 'FAILED']) {
    assert.match(idempotencyService, new RegExp(`STATUS_${status} = "${status}"`));
    assert.match(migration, new RegExp(status));
  }
  assert.match(idempotencyService, /required\(trimToNull\(idempotentKey\), "幂等键不能为空"\)/);
  assert.match(idempotencyService, /幂等键已被不同请求使用/);
  assert.match(idempotencyService, /请求处理中，请勿重复提交/);
  assert.match(mapperXml, /for update/);
  assert.match(mapperXml, /status = 'SUCCESS'/);
  assert.match(mapperXml, /status = 'FAILED'/);

  const entriesByApi = new Map(idempotencyRegistry.entries.map((entry) => [entry.api, entry]));
  for (const api of ['/business/customer/{customerId}/fund/deposit', '/business/customer/{customerId}/sample-rebate']) {
    const entry = entriesByApi.get(api);
    assert.ok(entry, `${api} must be registered for idempotency`);
    assert.equal(entry.featureId, 'customer');
    assert.equal(entry.method, 'POST');
    assert.equal(entry.required, true);
    assert.equal(entry.idempotencyKey, 'idempotentKey');
    assert.equal(entry.payloadHashRequired, true);
    assert.equal(entry.conflictBehavior, 'reject-payload-mismatch');
    assert.equal(entry.duplicateBehavior, 'return-existing-result');
    assert.ok(entry.tests.includes('tests/customer-risk-gate.test.js'));
  }

  const migrationEntry = migrationRegistry.entries.find((entry) => entry.migrationId === 'platform-idempotent-request-baseline');
  assert.ok(migrationEntry, 'idempotent_request migration must be registered');
  assert.equal(migrationEntry.file, IDEMPOTENT_MIGRATION);
  assert.equal(migrationEntry.blocking, true);
  assert.ok(migrationEntry.appliesToTables.includes('idempotent_request'));
});

test('customer high-risk fund APIs use dedicated permissions end to end', () => {
  const controller = readText(CUSTOMER_CONTROLLER);
  const view = readText(CUSTOMER_VIEW);
  const menuSql = readText(CUSTOMER_MENU_PERMISSION_SQL);
  const features = readJson(FEATURES_REGISTRY);
  const coverage = readJson(HIGH_RISK_PERMISSION_COVERAGE);
  const depositAnnotations = methodAnnotations(controller, 'public AjaxResult fundDeposit');
  const rebateAnnotations = methodAnnotations(controller, 'public AjaxResult createSampleRebate');
  const customerFeature = features.features.find((feature) => feature.id === 'customer');
  const featurePermissions = new Set(customerFeature.permissions);
  const ownershipPermissions = new Set(customerFeature.ownership.permissions.filter((permission) => permission.startsWith('business:')));
  const entriesByApi = new Map(coverage.entries.map((entry) => [entry.api, entry]));
  const highRiskApis = [
    {
      api: '/business/customer/{customerId}/fund/deposit',
      permission: 'business:customer:fund:deposit',
      annotations: depositAnnotations,
      button: /@click="handleFundEntry"\s+v-hasPermi="\['business:customer:fund:deposit'\]"/
    },
    {
      api: '/business/customer/{customerId}/sample-rebate',
      permission: 'business:customer:sample-rebate:create',
      annotations: rebateAnnotations,
      button: /@click="handleSampleRebate"\s+v-hasPermi="\['business:customer:sample-rebate:create'\]"/
    }
  ];

  for (const item of highRiskApis) {
    assert.match(item.annotations, new RegExp(item.permission.replaceAll(':', ':')));
    assert.doesNotMatch(item.annotations, /business:customer:fund:add/, `${item.api} must not use the legacy shared fund:add permission`);
    assert.match(view, item.button, `${item.api} frontend action must use its dedicated permission`);
    assert.match(menuSql, new RegExp(item.permission.replaceAll(':', ':')), `${item.permission} must be seeded in customer menu SQL`);
    assert.ok(featurePermissions.has(item.permission), `${item.permission} must be registered on customer feature`);
    assert.ok(ownershipPermissions.has(item.permission), `${item.permission} must be registered in customer ownership permissions`);

    const entry = entriesByApi.get(item.api);
    assert.ok(entry, `${item.api} must have high-risk permission coverage`);
    assert.equal(entry.status, 'required');
    assert.equal(entry.backendPermission, item.permission);
    assert.equal(entry.frontendPermission, item.permission);
    assert.equal(entry.menuPermission, item.permission);
    assert.equal(entry.registryPermission, item.permission);
    assert.ok(entry.tests.includes('tests/customer-risk-gate.test.js'));
  }

  assert.notEqual(highRiskApis[0].permission, highRiskApis[1].permission, 'deposit and sample rebate must not share one high-risk permission');
  assert.doesNotMatch(menuSql, /business:customer:fund:add/, 'customer menu SQL must not seed fund:add as the high-risk fund entrypoint');
  assert.equal(featurePermissions.has('business:customer:fund:add'), false);
  assert.equal(ownershipPermissions.has('business:customer:fund:add'), false);
  assert.equal(
    coverage.entries.some((entry) => [
      entry.backendPermission,
      entry.frontendPermission,
      entry.menuPermission,
      entry.registryPermission
    ].includes('business:customer:fund:add')),
    false,
    'high-risk coverage must not keep fund:add as a required or warning entry'
  );
  assert.equal(
    coverage.entries.some((entry) => entry.api?.startsWith('/business/customer/{customerId}/') && entry.status === 'framework-warning'),
    false,
    'customer fund high-risk coverage must be required, not framework-warning'
  );
});

test('customer runtime idempotency Java tests are registered as idempotency evidence', () => {
  const idempotencyRegistry = readJson(IDEMPOTENCY_REGISTRY);
  const runtimeTests = [
    IDEMPOTENCY_SERVICE_TEST,
    CUSTOMER_FUND_SERVICE_TEST,
    CUSTOMER_SERVICE_TEST,
    CUSTOMER_FUND_MYSQL_IT
  ];

  for (const file of runtimeTests) {
    assert.equal(fileExists(file), true, `${file} must exist`);
  }

  const entriesByApi = new Map(idempotencyRegistry.entries.map((entry) => [entry.api, entry]));
  const depositTests = entriesByApi.get('/business/customer/{customerId}/fund/deposit').tests;
  const rebateTests = entriesByApi.get('/business/customer/{customerId}/sample-rebate').tests;

  assert.ok(depositTests.includes(IDEMPOTENCY_SERVICE_TEST));
  assert.ok(depositTests.includes(CUSTOMER_FUND_SERVICE_TEST));
  assert.ok(depositTests.includes(CUSTOMER_FUND_MYSQL_IT));
  assert.ok(rebateTests.includes(IDEMPOTENCY_SERVICE_TEST));
  assert.ok(rebateTests.includes(CUSTOMER_FUND_SERVICE_TEST));
  assert.ok(rebateTests.includes(CUSTOMER_SERVICE_TEST));
});

test('customer page submits stable idempotentKey for fund entry and sample rebate', () => {
  const view = readText(CUSTOMER_VIEW);
  const apiClient = readText(CUSTOMER_API);
  const generateKey = methodBody(view, 'function generateCustomerIdempotentKey');
  const ensureKey = methodBody(view, 'function ensureCustomerIdempotentKey');
  const handleFundEntry = methodBody(view, 'function handleFundEntry');
  const submitFundEntry = methodBody(view, 'function submitFundEntry');
  const handleSampleRebate = methodBody(view, 'function handleSampleRebate');
  const submitSampleRebate = methodBody(view, 'function submitSampleRebate');

  assert.match(generateKey, /randomUUID/);
  assert.match(generateKey, /return `\$\{scope\}-\$\{token\}`/);
  assert.match(ensureKey, /if \(!target\.idempotentKey\)/);
  assert.match(ensureKey, /target\.idempotentKey = generateCustomerIdempotentKey\(scope\)/);

  assert.match(handleFundEntry, /idempotentKey: generateCustomerIdempotentKey\("customer-fund-deposit"\)/);
  assert.match(submitFundEntry, /const idempotentKey = ensureCustomerIdempotentKey\(fundForm\.value, "customer-fund-deposit"\)/);
  assert.match(submitFundEntry, /addFundDeposit\(currentCustomerId\.value, \{[\s\S]*idempotentKey,[\s\S]*amount: fundForm\.value\.amount/);
  assert.equal((submitFundEntry.match(/generateCustomerIdempotentKey/g) || []).length, 0, 'fund submit must reuse the dialog key instead of generating a new key per click');

  assert.match(handleSampleRebate, /idempotentKey: generateCustomerIdempotentKey\("customer-sample-rebate"\)/);
  assert.match(submitSampleRebate, /idempotentKey: ensureCustomerIdempotentKey\(rebateForm\.value, "customer-sample-rebate"\)/);
  assert.match(submitSampleRebate, /createSampleRebate\(currentCustomerId\.value, payload\)/);
  assert.equal((submitSampleRebate.match(/generateCustomerIdempotentKey/g) || []).length, 0, 'sample rebate submit must reuse the dialog key instead of generating a new key per click');

  assert.doesNotMatch(apiClient, /idempotentKey/, 'customer API helper should not need path or method changes for idempotentKey payload fields');
});

test('customer fund idempotency canonical hashes and replay are wired before mutation', () => {
  const fundService = readText(CUSTOMER_FUND_SERVICE);
  const service = readText(CUSTOMER_SERVICE);
  const hashSupport = readText(IDEMPOTENCY_HASH);
  const recordDeposit = methodBody(fundService, 'public CustomerFundFlow recordCustomerDeposit');
  const depositHash = methodBody(fundService, 'private String customerDepositRequestHash');
  const createSampleRebate = methodBody(service, 'public SampleRebateRecord createSampleRebateRecord');
  const sampleHash = methodBody(service, 'private String sampleRebateRequestHash');

  assert.match(recordDeposit, /idempotencyService\.begin\(/);
  assert.match(recordDeposit, /customerDepositRequestHash\(customerId, entry, operatorId, operatorName\)/);
  assert.match(recordDeposit, /request\.isReplay\(\)[\s\S]*return replayCustomerDeposit\(request\)/);
  assert.match(recordDeposit, /CustomerFundFlow flow = recordFundEntryInternal\(customerId, entry, operatorId, operatorName\)/);
  assert.match(recordDeposit, /idempotencyService\.markSuccess\(request\.getRequestId\(\), RESULT_CUSTOMER_FUND_FLOW, flow\.getFlowId\(\)\)/);
  assert.ok(
    recordDeposit.indexOf('idempotencyService.begin(') < recordDeposit.indexOf('recordFundEntryInternal(customerId, entry, operatorId, operatorName)'),
    'deposit idempotency row must be created before customer fund mutation'
  );

  for (const field of [
    'biz_type=',
    'customer_id=',
    'account_type=',
    'flow_type=',
    'amount=',
    'receipt_no=',
    'sample_order_no=',
    'support_mode=',
    'total_support_rate=',
    'instant_discount_rate=',
    'operator_scope='
  ]) {
    assert.match(depositHash, new RegExp(field));
    assert.match(sampleHash, new RegExp(field));
  }
  assert.match(depositHash, /IdempotencyRequestHash\.money\(entry\.getAmount\(\)\)/);
  assert.match(depositHash, /IdempotencyRequestHash\.text\(entry\.getReceiptNo\(\)\)/);
  assert.match(sampleHash, /IdempotencyRequestHash\.money\(record\.getSampleAmount\(\)\)/);
  assert.match(sampleHash, /IdempotencyRequestHash\.text\(record\.getSampleOrderNo\(\)\)/);
  assert.match(sampleHash, /IdempotencyRequestHash\.rate\(record\.getTotalSupportRate\(\), BigDecimal\.ZERO\)/);
  assert.match(sampleHash, /IdempotencyRequestHash\.rate\(record\.getInstantDiscountRate\(\), BigDecimal\.ONE\)/);
  assert.match(hashSupport, /MessageDigest\.getInstance\("SHA-256"\)/);
  assert.match(hashSupport, /\.setScale\(2, RoundingMode\.HALF_UP\)/);
  assert.match(hashSupport, /\.setScale\(4, RoundingMode\.HALF_UP\)/);

  assert.match(createSampleRebate, /idempotencyService\.begin\(/);
  assert.match(createSampleRebate, /request\.isReplay\(\)[\s\S]*return replaySampleRebate\(request\)/);
  assert.ok(
    createSampleRebate.indexOf('idempotencyService.begin(') < createSampleRebate.indexOf('customerMapper.insertSampleRebateRecord(record)'),
    'sample rebate idempotency row must be created before sample rebate mutation'
  );
  assert.match(service, /selectSampleRebateRecordById\(request\.getResultRefId\(\)\)/);
  assert.match(fundService, /selectFundFlowById\(request\.getResultRefId\(\)\)/);
});

test('customer fund idempotency keeps fund and sales-order boundaries closed', () => {
  const scopedTexts = [
    CUSTOMER_FUND_ENTRY,
    SAMPLE_REBATE_RECORD,
    CUSTOMER_FUND_SERVICE,
    CUSTOMER_SERVICE,
    IDEMPOTENCY_SERVICE,
    IDEMPOTENT_MIGRATION,
    IDEMPOTENCY_REGISTRY
  ].map((file) => readText(file)).join('\n');

  assert.doesNotMatch(scopedTexts, /LONG_TERM_DEPOSIT|ROLLING_ORDER_DEPOSIT/);
  assert.match(readText(CUSTOMER_FUND_SERVICE), /CUSTOMER_DEPOSIT/);
  assert.match(readText(CUSTOMER_FUND_SERVICE), /DEPOSIT_IN/);
  assert.match(readText(CUSTOMER_FUND_SERVICE), /SAMPLE_REBATE_GENERATE/);

  const forbiddenRuntimePaths = [
    'ruoyi-business/src/main/java/com/ruoyi/business/sales-order',
    'ruoyi-business/src/main/java/com/ruoyi/business/salesorder',
    'ruoyi-admin/src/main/java/com/ruoyi/web/controller/business/sales-order',
    'ruoyi-admin/src/main/java/com/ruoyi/web/controller/business/salesorder',
    'ruoyi-ui/src/views/sales-order',
    'ruoyi-ui/src/views/salesorder',
    'ruoyi-ui/src/api/sales-order.js',
    'ruoyi-ui/src/api/salesOrder.js',
    'sql/sales-order.ownership.md',
    'sql/sales_order_init.sql'
  ];
  assert.deepEqual(forbiddenRuntimePaths.filter((file) => fileExists(file)), []);
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
