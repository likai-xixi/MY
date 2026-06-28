import test from 'node:test';
import assert from 'node:assert/strict';
import { fileExists, readJson, readText } from '../tools/common.js';

const RESOURCE_ENUM = 'ruoyi-business/src/main/java/com/ruoyi/business/masterdata/domain/MasterDataResource.java';
const RECORD = 'ruoyi-business/src/main/java/com/ruoyi/business/masterdata/domain/MasterDataRecord.java';
const CONTROLLER = 'ruoyi-admin/src/main/java/com/ruoyi/web/controller/business/masterdata/MasterDataController.java';
const SERVICE = 'ruoyi-business/src/main/java/com/ruoyi/business/masterdata/service/impl/MasterDataServiceImpl.java';
const MAPPER = 'ruoyi-business/src/main/java/com/ruoyi/business/masterdata/mapper/MasterDataMapper.java';
const MAPPER_XML = 'ruoyi-business/src/main/resources/mapper/masterdata/MasterDataMapper.xml';
const CODE_GENERATOR = 'ruoyi-business/src/main/java/com/ruoyi/business/common/code/BusinessMonthlyCodeGenerator.java';
const API_CLIENT = 'ruoyi-ui/src/api/masterdata.js';
const VIEW = 'ruoyi-ui/src/views/masterdata/index.vue';
const SCHEMA_SQL = 'sql/migrations/V20260628_005_masterdata_r10_schema.sql';
const MENU_SQL = 'sql/migrations/V20260628_006_masterdata_r10_menu_permission.sql';
const VALIDATION_SQL = 'sql/validation/masterdata_runtime_validation.sql';
const OWNERSHIP_SQL = 'sql/masterdata.ownership.md';

const RESOURCE_PREFIXES = {
  'product-category': 'PC',
  'product-series': 'PS',
  'product-model': 'PM',
  'material-category': 'MC',
  'material-item': 'MI',
  'accessory-category': 'AC',
  'accessory-item': 'AI',
  'sales-option-category': 'SOC',
  'sales-option-value': 'SOV'
};

const RESOURCE_PATHS = Object.keys(RESOURCE_PREFIXES);

const TABLES = [
  'masterdata_product_category',
  'masterdata_product_series',
  'masterdata_product_model',
  'masterdata_material_category',
  'masterdata_material_item',
  'masterdata_accessory_category',
  'masterdata_accessory_item',
  'masterdata_sales_option_category',
  'masterdata_sales_option_value'
];

const CODE_COLUMNS = [
  'category_code',
  'series_code',
  'model_code',
  'material_code',
  'accessory_code',
  'option_code'
];

const PERMISSIONS = [
  'business:masterdata:list',
  'business:masterdata:query',
  'business:masterdata:add',
  'business:masterdata:edit',
  'business:masterdata:remove',
  'business:masterdata:export',
  'business:masterdata:status',
  'business:masterdata:publish'
];

const FORBIDDEN_RUNTIME_PATHS = [
  'ruoyi-business/src/main/java/com/ruoyi/business/salesorder',
  'ruoyi-business/src/main/java/com/ruoyi/business/sales-order',
  'ruoyi-admin/src/main/java/com/ruoyi/web/controller/business/salesorder',
  'ruoyi-admin/src/main/java/com/ruoyi/web/controller/business/sales-order',
  'ruoyi-ui/src/views/sales-order',
  'ruoyi-ui/src/views/salesorder',
  'ruoyi-ui/src/api/sales-order.js',
  'ruoyi-ui/src/api/salesorder.js',
  'sql/sales-order.ownership.md',
  'sql/sales_order_init.sql'
];

const FIELD_SCHEME_RUNTIME_PATHS = [
  'ruoyi-business/src/main/java/com/ruoyi/business/fieldscheme',
  'ruoyi-business/src/main/java/com/ruoyi/business/field-scheme',
  'ruoyi-admin/src/main/java/com/ruoyi/web/controller/business/fieldscheme',
  'ruoyi-admin/src/main/java/com/ruoyi/web/controller/business/field-scheme',
  'ruoyi-ui/src/views/field-scheme',
  'ruoyi-ui/src/api/field-scheme.js',
  'sql/field-scheme.ownership.md'
];

const FORMULA_RUNTIME_PATHS = [
  'ruoyi-business/src/main/java/com/ruoyi/business/formula',
  'ruoyi-admin/src/main/java/com/ruoyi/web/controller/business/formula',
  'ruoyi-ui/src/views/formula',
  'ruoyi-ui/src/api/formula.js',
  'sql/formula.ownership.md'
];

const TECH_DECOMPOSITION_RUNTIME_PATHS = [
  'ruoyi-business/src/main/java/com/ruoyi/business/techdecomposition',
  'ruoyi-business/src/main/java/com/ruoyi/business/technical-decomposition',
  'ruoyi-admin/src/main/java/com/ruoyi/web/controller/business/techdecomposition',
  'ruoyi-admin/src/main/java/com/ruoyi/web/controller/business/technical-decomposition',
  'ruoyi-ui/src/views/technical-decomposition',
  'ruoyi-ui/src/api/technical-decomposition.js',
  'sql/technical-decomposition.ownership.md'
];

function createTableNames(sql) {
  return [...sql.matchAll(/\bcreate table if not exists\s+([a-z0-9_]+)/gi)].map((match) => match[1]);
}

function escaped(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test('masterdata feature and module are registered', () => {
  const features = readJson('ai/registry/features.json');
  const modules = readJson('ai/registry/modules.json');
  const dictionary = readJson('ai/registry/feature-id-dictionary.json');
  const feature = features.features.find((item) => item.id === 'masterdata');
  const module = modules.modules.find((item) => item.id === 'masterdata');
  const alias = dictionary.aliases.find((item) => item.id === 'masterdata');

  assert.ok(feature, 'masterdata feature must be registered');
  assert.equal(feature.status, 'active');
  assert.ok(feature.tests.includes('tests/masterdata-runtime.test.js'));
  assert.ok(module, 'masterdata module must be registered');
  assert.equal(module.feature, 'masterdata');
  assert.ok(alias.aliases.length > 0);
});

test('R-10D resource prefix map covers exactly the nine approved resources', () => {
  const enumSource = readText(RESOURCE_ENUM);
  const service = readText(SERVICE);

  for (const [resource, prefix] of Object.entries(RESOURCE_PREFIXES)) {
    assert.match(enumSource, new RegExp(`"${resource}"`), `${resource} must be in MasterDataResource`);
    assert.match(service, new RegExp(`case [A-Z_]+ -> "${prefix}"`), `${resource} must map to ${prefix}`);
  }
  const enumEntries = [...enumSource.matchAll(/^\s+([A-Z_]+)\("/gm)].map((match) => match[1]);
  assert.equal(enumEntries.length, RESOURCE_PATHS.length);
});

test('nine masterdata resources can be added without caller supplied code', () => {
  const record = readText(RECORD);
  const controller = readText(CONTROLLER);
  const service = readText(SERVICE);

  assert.doesNotMatch(record, /@NotBlank\(message = "编码不能为空"\)\s+public String getItemCode/);
  assert.match(controller, /@PostMapping\("\/{resource}"\)/);
  assert.match(service, /record\.setItemCode\(create \? null : upperCode\(record\.getItemCode\(\)\)\)/);
  assert.match(service, /return insertRecordWithGeneratedCode\(target, record\)/);
  assert.doesNotMatch(service, /assertRequired\(record\.getItemCode\(\), "编码不能为空"\);\s+assertRequired\(record\.getItemName/);
});

test('backend generates prefix plus yyyyMM plus six digit sequence codes', () => {
  const generator = readText(CODE_GENERATOR);
  const mapperXml = readText(MAPPER_XML);
  const service = readText(SERVICE);

  assert.match(generator, /DateTimeFormatter\.ofPattern\("yyyyMM"\)/);
  assert.match(generator, /private static final int SEQUENCE_WIDTH = 6/);
  assert.match(generator, /"0"\.repeat\(SEQUENCE_WIDTH - sequence\.length\(\)\)/);
  assert.match(mapperXml, /\[0-9\]\{6\}/);
  assert.match(service, /selectMaxCodeByMonth\(resource, monthPrefix\)/);

  const yyyyMM = new Date().toISOString().slice(0, 7).replace('-', '');
  for (const prefix of Object.values(RESOURCE_PREFIXES)) {
    assert.match(`${prefix}${yyyyMM}000001`, new RegExp(`^${prefix}\\d{6}\\d{6}$`));
  }
});

test('direct API add ignores user supplied code and does not generate from item name', () => {
  const service = readText(SERVICE);
  const generator = readText(CODE_GENERATOR);

  assert.match(service, /record\.setItemCode\(create \? null : upperCode/);
  assert.match(service, /record\.setItemCode\(nextRecordCode\(resource\)\)/);
  assert.doesNotMatch(service.match(/private String nextRecordCode[\s\S]*?^    \}/m)?.[0] || '', /getItemName\(/);
  assert.doesNotMatch(generator, /itemName|nameColumn|getItemName/);
});

test('edit keeps existing code and ignores payload code changes', () => {
  const service = readText(SERVICE);
  const mapperXml = readText(MAPPER_XML);
  const view = readText(VIEW);

  assert.match(service, /MasterDataRecord existing = requiredRecord\(target, record\.getId\(\)\)/);
  assert.match(service, /record\.setItemCode\(existing\.getItemCode\(\)\)/);
  assert.doesNotMatch(mapperXml.match(/<update id="updateRecord">[\s\S]*?<\/update>/)?.[0] || '', /\$\{resource\.codeColumn\}/);
  assert.match(view, /<el-form-item v-if="form\.id" label="编码" prop="itemCode">/);
  assert.match(view, /<el-input v-model="form\.itemCode" maxlength="64" disabled \/>/);
});

test('code uniqueness is still enforced by schema and duplicate-key retry', () => {
  const schemaSql = readText(SCHEMA_SQL);
  const service = readText(SERVICE);

  for (const table of TABLES) {
    assert.match(schemaSql, new RegExp(`unique key uk_${table}_code`));
  }
  assert.match(service, /import org\.springframework\.dao\.DuplicateKeyException/);
  assert.match(service, /catch \(DuplicateKeyException e\)/);
});

test('bounded retry for generated code collisions is present', () => {
  const service = readText(SERVICE);

  assert.match(service, /private static final int CODE_RETRY_LIMIT = 8/);
  assert.match(service, /for \(int attempt = 0; attempt < CODE_RETRY_LIMIT; attempt\+\+\)/);
  assert.match(service, /if \(attempt == CODE_RETRY_LIMIT - 1\)/);
});

test('frontend add dialog does not require or show code input', () => {
  const view = readText(VIEW);
  const rulesBlock = view.match(/const rules = computed\(\(\) => \(\{[\s\S]*?\}\)\)/)?.[0] || '';

  assert.doesNotMatch(rulesBlock, /itemCode\s*:/);
  assert.match(view, /form\.value\.itemCode = form\.value\.id \? \(form\.value\.itemCode \|\| ''\)\.trim\(\)\.toUpperCase\(\) : undefined/);
  assert.match(view, /<el-form-item v-if="form\.id" label="编码" prop="itemCode">/);
});

test('masterdata SQL creates exactly the nine MVP tables and permissions', () => {
  const schemaSql = readText(SCHEMA_SQL);
  const menuSql = readText(MENU_SQL);
  const validationSql = readText(VALIDATION_SQL);
  const ownership = readText(OWNERSHIP_SQL);
  assert.deepEqual(createTableNames(schemaSql).sort(), TABLES.toSorted());
  for (const table of TABLES) {
    assert.match(schemaSql, new RegExp(table));
    assert.match(validationSql, new RegExp(table));
    assert.match(ownership, new RegExp(table));
  }
  for (const column of CODE_COLUMNS) {
    assert.match(schemaSql, new RegExp(column));
  }
  for (const permission of PERMISSIONS) {
    assert.match(menuSql, new RegExp(escaped(permission)));
    assert.match(ownership, new RegExp(escaped(permission)));
  }
});

test('masterdata frontend uses generic resource API', () => {
  const api = readText(API_CLIENT);
  const view = readText(VIEW);
  for (const resource of RESOURCE_PATHS) {
    assert.match(view, new RegExp(`'${resource}'`));
  }
  assert.match(api, /function masterDataUrl\(resource, suffix = ''\)/);
  for (const fragment of ["masterDataUrl(resource, '/list')", "masterDataUrl(resource, '/options')", "masterDataUrl(resource, `/${id}`)", "masterDataUrl(resource, '/changeStatus')"]) {
    assert.match(api, new RegExp(escaped(fragment)));
  }
});

test('SALES_ORDER_RUNTIME_ABSENT_OK', () => {
  assert.deepEqual(FORBIDDEN_RUNTIME_PATHS.filter((file) => fileExists(file)), []);
  const runtimeText = [CONTROLLER, SERVICE, API_CLIENT, VIEW, SCHEMA_SQL].map(readText).join('\n');
  assert.doesNotMatch(runtimeText, /sales-?order|sales_order/i);
});

test('FIELD_SCHEME_RUNTIME_ABSENT_OK', () => {
  assert.deepEqual(FIELD_SCHEME_RUNTIME_PATHS.filter((file) => fileExists(file)), []);
  const runtimeText = [CONTROLLER, SERVICE, API_CLIENT, VIEW, SCHEMA_SQL].map(readText).join('\n');
  assert.doesNotMatch(runtimeText, /field-?scheme|field_scheme/i);
});

test('FORMULA_RUNTIME_ABSENT_OK', () => {
  assert.deepEqual(FORMULA_RUNTIME_PATHS.filter((file) => fileExists(file)), []);
  const runtimeText = [CONTROLLER, SERVICE, API_CLIENT, VIEW, SCHEMA_SQL].map(readText).join('\n');
  assert.doesNotMatch(runtimeText, /formula/i);
});

test('TECH_DECOMPOSITION_RUNTIME_ABSENT_OK', () => {
  assert.deepEqual(TECH_DECOMPOSITION_RUNTIME_PATHS.filter((file) => fileExists(file)), []);
  const runtimeText = [CONTROLLER, SERVICE, API_CLIENT, VIEW, SCHEMA_SQL].map(readText).join('\n');
  assert.doesNotMatch(runtimeText, /technical-?decomposition|tech-?decomposition|decomposition/i);
});
