import test from 'node:test';
import assert from 'node:assert/strict';
import { fileExists, readJson, readText } from '../tools/common.js';

const RESOURCE_ENUM = 'ruoyi-business/src/main/java/com/ruoyi/business/masterdata/domain/MasterDataResource.java';
const CONTROLLER = 'ruoyi-admin/src/main/java/com/ruoyi/web/controller/business/masterdata/MasterDataController.java';
const SERVICE = 'ruoyi-business/src/main/java/com/ruoyi/business/masterdata/service/impl/MasterDataServiceImpl.java';
const MAPPER_XML = 'ruoyi-business/src/main/resources/mapper/masterdata/MasterDataMapper.xml';
const API_CLIENT = 'ruoyi-ui/src/api/masterdata.js';
const VIEW = 'ruoyi-ui/src/views/masterdata/index.vue';
const SCHEMA_SQL = 'sql/migrations/V20260628_005_masterdata_r10_schema.sql';
const MENU_SQL = 'sql/migrations/V20260628_006_masterdata_r10_menu_permission.sql';
const VALIDATION_SQL = 'sql/validation/masterdata_runtime_validation.sql';
const OWNERSHIP_SQL = 'sql/masterdata.ownership.md';

const RESOURCE_PATHS = [
  'product-category',
  'product-series',
  'product-model',
  'material-category',
  'material-item',
  'accessory-category',
  'accessory-item',
  'sales-option-category',
  'sales-option-value'
];

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

const BUSINESS_EXAMPLES = [
  '门',
  '门匾',
  '栅栏',
  '护栏',
  '庭院门',
  '入户门',
  '单开',
  '对开',
  '子母',
  '连体子母',
  '颜色',
  '拉手',
  '锁具',
  '铰链',
  '玻璃',
  '表面处理',
  '包装方式',
  '材料体系'
];

function createTableNames(sql) {
  return [...sql.matchAll(/\bcreate table if not exists\s+([a-z0-9_]+)/gi)].map((match) => match[1]);
}

test('masterdata feature and module are registered', () => {
  const features = readJson('ai/registry/features.json');
  const modules = readJson('ai/registry/modules.json');
  const dictionary = readJson('ai/registry/feature-id-dictionary.json');
  const feature = features.features.find((item) => item.id === 'masterdata');
  const module = modules.modules.find((item) => item.id === 'masterdata');
  const alias = dictionary.aliases.find((item) => item.id === 'masterdata');

  assert.ok(feature, 'masterdata feature must be registered');
  assert.equal(feature.name, '主数据配置');
  assert.equal(feature.status, 'active');
  assert.ok(module, 'masterdata module must be registered');
  assert.equal(module.feature, 'masterdata');
  assert.ok(alias.aliases.includes('主数据'));
});

test('R-10B resource enum contains exactly the nine approved resources', () => {
  const source = readText(RESOURCE_ENUM);
  for (const resource of RESOURCE_PATHS) {
    assert.match(source, new RegExp(`"${resource}"`), `${resource} must be in MasterDataResource`);
  }
  const enumEntries = [...source.matchAll(/^\s+([A-Z_]+)\("/gm)].map((match) => match[1]);
  assert.equal(enumEntries.length, RESOURCE_PATHS.length);
});

test('masterdata backend exposes only generic masterdata routes', () => {
  const controller = readText(CONTROLLER);
  assert.match(controller, /@RequestMapping\("\/business\/masterdata"\)/);
  for (const path of ['/{resource}/list', '/{resource}/options', '/{resource}/export', '/{resource}/{id}', '/{resource}', '/{resource}/changeStatus', '/{resource}/{ids}']) {
    assert.match(controller, new RegExp(path.replace(/[{}]/g, '\\$&')));
  }
  for (const permission of PERMISSIONS.filter((item) => item !== 'business:masterdata:publish')) {
    assert.match(controller, new RegExp(permission.replaceAll(':', ':')));
  }
  assert.doesNotMatch(controller, /sales-?order|field-?scheme|formula|decomposition/i);
});

test('masterdata service enforces code, name, status, and logical delete rules', () => {
  const service = readText(SERVICE);
  assert.match(service, /CODE_PATTERN = Pattern\.compile\("\^\[A-Z0-9_\]\+\$"\)/);
  assert.match(service, /toUpperCase\(Locale\.ROOT\)/);
  assert.match(service, /编码不能为空/);
  assert.match(service, /名称不能为空/);
  assert.match(service, /编码只能使用大写英文、数字和下划线/);
  assert.match(service, /主数据编码为稳定引用，创建后不允许修改/);
  assert.match(service, /deleteRecordByIds/);
  assert.match(readText(MAPPER_XML), /set del_flag = '2'/);
});

test('masterdata SQL creates exactly the nine MVP tables and permissions', () => {
  const schemaSql = readText(SCHEMA_SQL);
  const menuSql = readText(MENU_SQL);
  const validationSql = readText(VALIDATION_SQL);
  const ownership = readText(OWNERSHIP_SQL);
  assert.deepEqual(createTableNames(schemaSql).sort(), TABLES.sort());
  for (const table of TABLES) {
    assert.match(schemaSql, new RegExp(table));
    assert.match(validationSql, new RegExp(table));
    assert.match(ownership, new RegExp(table));
  }
  for (const permission of PERMISSIONS) {
    assert.match(menuSql, new RegExp(permission.replaceAll(':', ':')));
    assert.match(ownership, new RegExp(permission.replaceAll(':', ':')));
  }
  assert.doesNotMatch(schemaSql, /\bsales_order\b|\bfield_scheme\b|\bformula\b|\bdecomposition\b/i);
});

test('masterdata frontend uses generic resource API and no hard-coded business examples', () => {
  const api = readText(API_CLIENT);
  const view = readText(VIEW);
  for (const resource of RESOURCE_PATHS) {
    assert.match(view, new RegExp(`'${resource}'`));
  }
  assert.match(api, /function masterDataUrl\(resource, suffix = ''\)/);
  for (const fragment of ["masterDataUrl(resource, '/list')", "masterDataUrl(resource, '/options')", "masterDataUrl(resource, `/${id}`)", "masterDataUrl(resource, '/changeStatus')"]) {
    assert.match(api, new RegExp(fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  for (const example of BUSINESS_EXAMPLES) {
    assert.doesNotMatch(view, new RegExp(example), `${example} must not be hard-coded as a UI branch`);
  }
});

test('R-10B keeps forbidden runtime paths absent', () => {
  assert.deepEqual(FORBIDDEN_RUNTIME_PATHS.filter((file) => fileExists(file)), []);
});
