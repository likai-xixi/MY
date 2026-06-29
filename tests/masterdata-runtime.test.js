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
const PRODUCT_CONFIG_VIEW = 'ruoyi-ui/src/views/masterdata/product-config.vue';
const MATERIAL_CONFIG_VIEW = 'ruoyi-ui/src/views/masterdata/material-config.vue';
const ACCESSORY_CONFIG_VIEW = 'ruoyi-ui/src/views/masterdata/accessory-config.vue';
const SALES_OPTION_CONFIG_VIEW = 'ruoyi-ui/src/views/masterdata/sales-option-config.vue';
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

const RESOURCE_GROUPS = {
  product: {
    wrapper: PRODUCT_CONFIG_VIEW,
    routeName: 'MasterdataProductConfig',
    menuName: '产品配置',
    component: 'masterdata/product-config',
    resources: ['product-category', 'product-series', 'product-model']
  },
  material: {
    wrapper: MATERIAL_CONFIG_VIEW,
    routeName: 'MasterdataMaterialConfig',
    menuName: '物料配置',
    component: 'masterdata/material-config',
    resources: ['material-category', 'material-item']
  },
  accessory: {
    wrapper: ACCESSORY_CONFIG_VIEW,
    routeName: 'MasterdataAccessoryConfig',
    menuName: '配件配置',
    component: 'masterdata/accessory-config',
    resources: ['accessory-category', 'accessory-item']
  },
  'sales-option': {
    wrapper: SALES_OPTION_CONFIG_VIEW,
    routeName: 'MasterdataSalesOptionConfig',
    menuName: '销售选项配置',
    component: 'masterdata/sales-option-config',
    resources: ['sales-option-category', 'sales-option-value']
  }
};

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

const PRODUCTION_RUNTIME_PATHS = [
  'ruoyi-business/src/main/java/com/ruoyi/business/production',
  'ruoyi-admin/src/main/java/com/ruoyi/web/controller/business/production',
  'ruoyi-ui/src/views/production',
  'ruoyi-ui/src/api/production.js',
  'sql/production.ownership.md'
];

const DXF_RUNTIME_PATHS = [
  'ruoyi-business/src/main/java/com/ruoyi/business/dxf',
  'ruoyi-admin/src/main/java/com/ruoyi/web/controller/business/dxf',
  'ruoyi-ui/src/views/dxf',
  'ruoyi-ui/src/api/dxf.js',
  'sql/dxf.ownership.md'
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

test('product category list is configured as a tree table', () => {
  const view = readText(VIEW);

  assert.match(view, /value: 'product-category', label: '产品大类', parentEnabled: true, treeEnabled: true/);
  assert.match(view, /:data="tableRows"/);
  assert.match(view, /row-key="id"/);
  assert.match(view, /:expand-row-keys="expandedTreeRowKeys"/);
  assert.match(view, /:tree-props="treeProps"/);
  assert.match(view, /@expand-change="handleTreeExpandChange"/);
  assert.doesNotMatch(view, /default-expand-all/);
  assert.match(view, /const treeProps = \{ children: 'children' \}/);
  assert.match(view, /const tableRows = computed\(\(\) => isTreeTable\.value \? buildTreeRows\(recordList\.value\) : recordList\.value\)/);
  assert.match(view, /<el-table-column v-if="currentConfig\.parentEnabled && !isTreeTable" label="上级分类"/);
  assert.match(view, /delete params\.pageNum/);
  assert.match(view, /delete params\.pageSize/);
});

test('masterdata grouped menu pages reuse one page implementation', () => {
  const view = readText(VIEW);

  assert.match(view, /const allResourceConfigs = \[/);
  assert.match(view, /const resourceGroups = \{/);
  assert.match(view, /const resourceConfigs = computed\(\(\) => \{/);
  assert.match(view, /allResourceConfigs\.filter\(item => group\.resources\.includes\(item\.value\)\)/);
  assert.match(view, /resourceGroup:/);
  assert.match(view, /useRoute\(\)/);
  assert.match(view, /watch\(activeResourceGroup/);

  for (const [group, config] of Object.entries(RESOURCE_GROUPS)) {
    const wrapper = readText(config.wrapper);
    assert.match(wrapper, /import Masterdata from '\.\/index\.vue'/);
    assert.match(wrapper, new RegExp(`<Masterdata resource-group="${escaped(group)}" \\/>`));
    assert.match(wrapper, new RegExp(`name="Masterdata${config.routeName.replace('Masterdata', '')}"`));
    assert.doesNotMatch(wrapper, /listMasterData|addMasterData|updateMasterData|resourceConfigs/);
    for (const resource of config.resources) {
      assert.match(view, new RegExp(`'${escaped(resource)}'`), `${group} must include ${resource}`);
    }
  }

  assert.match(view, /product:\s*\{[\s\S]*resources: \['product-category', 'product-series', 'product-model'\]/);
  assert.match(view, /value: 'product-model', label: '工艺型号'/);
  assert.doesNotMatch(view, /label: '产品型号'/);
  assert.doesNotMatch(view, /label: '产品分类'/);
  assert.match(view, /material:\s*\{[\s\S]*resources: \['material-category', 'material-item'\]/);
  assert.match(view, /accessory:\s*\{[\s\S]*resources: \['accessory-category', 'accessory-item'\]/);
  assert.match(view, /'sales-option':\s*\{[\s\S]*resources: \['sales-option-category', 'sales-option-value'\]/);
});

test('product category tree expansion is controlled without expanding all rows', () => {
  const view = readText(VIEW);

  assert.match(view, /const expandedTreeRowKeys = ref\(\[\]\)/);
  assert.match(view, /function syncProductCategoryExpandedKeys\(options = \{\}\)/);
  assert.match(view, /options\.resetExpanded/);
  assert.match(view, /options\.expandParentId/);
  assert.match(view, /options\.expandSearchMatches/);
  assert.match(view, /function pruneExpandedTreeRowKeys\(\)/);
  assert.match(view, /function handleTreeExpandChange\(row, expanded\)/);
  assert.match(view, /getList\(\{ resetExpanded: true \}\)/);
  assert.match(view, /getList\(\{ expandSearchMatches: isTreeSearchActive\(\) \}\)/);
  assert.match(view, /getList\(\{ expandParentId: parentIdToExpand \}\)/);
  assert.doesNotMatch(view, /expandedTreeRowKeys\.value\s*=\s*recordList\.value\.map/);
  assert.doesNotMatch(view, /expandedTreeRowKeys\.value\s*=\s*tableRows\.value\.map/);
});

test('product category tree name column has visual hierarchy hints', () => {
  const view = readText(VIEW);

  assert.match(view, /:row-class-name="tableRowClassName"/);
  assert.match(view, /:show-overflow-tooltip="!isTreeTable"/);
  assert.match(view, /productCategoryTreeTooltip\(scope\.row\)/);
  assert.match(view, /product-category-tree-node/);
  assert.match(view, /product-category-branch/);
  assert.match(view, /product-category-level-tag/);
  assert.match(view, /font-size: 10px/);
  assert.match(view, /height: 16px/);
  assert.match(view, /padding: 0 4px/);
  assert.match(view, /min-width: 22px/);
  assert.match(view, /productCategoryLevelLabel\(scope\.row\)/);
  assert.match(view, /productCategoryNodeStyle\(scope\.row\)/);
  assert.match(view, /--category-depth-offset/);
  assert.match(view, /product-category-row-level-/);
  assert.match(view, /productCategoryPath\(row\)/);
});

test('product category maximum depth is three in backend and frontend', () => {
  const service = readText(SERVICE);
  const view = readText(VIEW);

  assert.match(service, /private static final int PRODUCT_CATEGORY_MAX_DEPTH = 3/);
  assert.match(service, /validateProductCategoryHierarchy\(target, record\);/);
  assert.match(service, /parentDepth \+ subtreeHeight > PRODUCT_CATEGORY_MAX_DEPTH/);
  assert.match(service, /产品分类最多只允许3级/);
  assert.match(view, /const PRODUCT_CATEGORY_MAX_DEPTH = 3/);
  assert.match(view, /productCategoryDepth\(item\.id\) \+ ownHeight <= PRODUCT_CATEGORY_MAX_DEPTH/);
  assert.match(view, /产品大类最多只允许3级/);
});

test('backend rejects creating or moving product category to level four', () => {
  const service = readText(SERVICE);

  assert.match(service, /int parentDepth = parentId == null \? 0 : hierarchyDepth\(parentId, byId\)/);
  assert.match(service, /int subtreeHeight = id == null \? 1 : subtreeHeight\(id, childrenByParent, new HashSet<>\(\)\)/);
  assert.match(service, /if \(parentDepth \+ subtreeHeight > PRODUCT_CATEGORY_MAX_DEPTH\)/);
});

test('editing product category cannot select itself as parent', () => {
  const service = readText(SERVICE);
  const view = readText(VIEW);

  assert.match(service, /id != null && id\.equals\(parentId\)/);
  assert.match(service, /产品分类的上级分类不能选择自己/);
  assert.match(view, /item\.id !== form\.value\.id/);
  assert.match(view, /上级分类不能选择自己/);
});

test('editing product category cannot select a descendant as parent', () => {
  const service = readText(SERVICE);
  const view = readText(VIEW);

  assert.match(service, /isDescendant\(parentId, id, childrenByParent\)/);
  assert.match(service, /产品分类的上级分类不能选择自己的子级或后代/);
  assert.match(view, /productCategoryDescendantIds\(form\.value\.id\)/);
  assert.match(view, /!descendants\.has\(item\.id\)/);
  assert.match(view, /上级分类不能选择自己的子级或后代/);
});

test('backend rejects deleting product category when child categories exist', () => {
  const service = readText(SERVICE);

  assert.match(service, /assertNoProductCategoryChildren\(target, ids\)/);
  assert.match(service, /deletedIds\.contains\(parentId\)/);
  assert.match(service, /产品分类存在子分类，不能删除父分类/);
  assert.match(service, /masterDataMapper\.deleteRecordByIds\(target, ids, updateBy\)/);
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

test('masterdata SQL creates four grouped menu pages without changing API permissions', () => {
  const menuSql = readText(MENU_SQL);
  const ownership = readText(OWNERSHIP_SQL);

  assert.match(menuSql, /masterdata_menu\.menu_type = 'M'/);
  assert.match(menuSql, /masterdata_menu\.component = null/);
  assert.match(menuSql, /masterdata_menu\.perms = ''/);
  assert.match(menuSql, /'主数据配置目录'/);

  for (const config of Object.values(RESOURCE_GROUPS)) {
    assert.match(menuSql, new RegExp(`'${config.menuName}'`));
    assert.match(menuSql, new RegExp(`'${escaped(config.component)}'`));
    assert.match(menuSql, new RegExp(`'${config.routeName}'`));
    assert.match(menuSql, new RegExp(`'business:masterdata:list'`));
    assert.match(ownership, new RegExp(`业务管理 / 主数据配置 / ${config.menuName}`));
  }
  assert.match(menuSql, /产品大类、产品系列、工艺型号/);
  assert.doesNotMatch(menuSql, /business:masterdata:product|business:masterdata:material|business:masterdata:accessory|business:masterdata:sales-option/);
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

test('PRODUCTION_RUNTIME_ABSENT_OK', () => {
  assert.deepEqual(PRODUCTION_RUNTIME_PATHS.filter((file) => fileExists(file)), []);
  const runtimeText = [CONTROLLER, SERVICE, API_CLIENT, VIEW, SCHEMA_SQL].map(readText).join('\n');
  assert.doesNotMatch(runtimeText, /production/i);
});

test('DXF_RUNTIME_ABSENT_OK', () => {
  assert.deepEqual(DXF_RUNTIME_PATHS.filter((file) => fileExists(file)), []);
  const runtimeText = [CONTROLLER, SERVICE, API_CLIENT, VIEW, SCHEMA_SQL].map(readText).join('\n');
  assert.doesNotMatch(runtimeText, /dxf/i);
});
