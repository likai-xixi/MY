import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildFeatureBrief,
  createFeature,
  normalizeFeatureId,
  parseFeatureInput,
  plannedFeatureFiles,
  resolveFeatureIdentity,
  slugify,
  titleFromSlug
} from '../scripts/new-feature.js';

test('feature names become stable ASCII ids', () => {
  assert.equal(slugify('Inventory Reorder Flow'), 'inventory-reorder-flow');
  assert.equal(slugify('  API: Order #42  '), 'api-order-42');
  assert.equal(slugify('订单审批'), '');
  assert.equal(normalizeFeatureId('Customer Management'), 'customer-management');
});

test('feature id and display name stay separated', () => {
  assert.deepEqual(parseFeatureInput('customer:客户管理'), {
    id: 'customer',
    name: '客户管理',
    raw: 'customer:客户管理'
  });
  assert.deepEqual(resolveFeatureIdentity({ name: 'customer 客户管理' }), {
    id: 'customer',
    slug: 'customer',
    name: '客户管理',
    errors: []
  });
  assert.deepEqual(resolveFeatureIdentity({ name: '新增功能: 客户管理' }), {
    id: 'customer',
    slug: 'customer',
    name: '客户管理',
    errors: []
  });
  assert.deepEqual(resolveFeatureIdentity({ name: '销售订单管理' }), {
    id: 'sales-order',
    slug: 'sales-order',
    name: '销售订单管理',
    errors: []
  });
  assert.equal(resolveFeatureIdentity({ name: '未知中文功能' }).errors.length, 2);
});

test('feature slug can produce a readable title', () => {
  assert.equal(titleFromSlug('inventory-reorder-flow'), 'Inventory Reorder Flow');
});

test('feature brief includes Codex governance requirements', () => {
  const brief = buildFeatureBrief({ slug: 'inventory-reorder', title: 'Inventory Reorder' });
  assert.match(brief, /ID: `inventory-reorder`/);
  assert.match(brief, /memory\/PROJECT_STATE\.md/);
  assert.match(brief, /npm run build:graph/);
  assert.match(brief, /npm run check/);
});

test('feature planning creates unified backend and frontend boundaries', () => {
  const { files } = plannedFeatureFiles({ name: 'Inventory Reorder', adapter: 'generic' });
  const paths = files.map((file) => file.relativePath);
  assert.ok(paths.includes('features/inventory-reorder.md'));
  assert.ok(paths.includes('ai/contracts/inventory-reorder.api.md'));
  assert.ok(paths.includes('ai/contracts/inventory-reorder.delete-ownership.md'));
  assert.ok(paths.includes('backend/modules/inventory-reorder/api/README.md'));
  assert.ok(paths.includes('backend/modules/inventory-reorder/service/README.md'));
  assert.ok(paths.includes('backend/modules/inventory-reorder/domain/README.md'));
  assert.ok(paths.includes('backend/modules/inventory-reorder/repository/README.md'));
  assert.ok(paths.includes('frontend/src/modules/inventory-reorder/screen.md'));
});

test('feature planning accepts explicit id with Chinese display name', () => {
  const { slug, title, files, errors } = plannedFeatureFiles({ id: 'customer', name: '客户管理' });
  assert.equal(slug, 'customer');
  assert.equal(title, '客户管理');
  assert.deepEqual(errors, []);
  assert.ok(files.some((file) => file.relativePath === 'features/customer.md'));
  assert.ok(files.every((file) => !file.relativePath.includes('客户')));
});


test('feature planning accepts Chinese-only chat command through dictionary', () => {
  const { slug, title, files, errors } = plannedFeatureFiles({ name: '新增功能：客户管理' });
  assert.equal(slug, 'customer');
  assert.equal(title, '客户管理');
  assert.deepEqual(errors, []);
  assert.ok(files.some((file) => file.relativePath === 'features/customer.md'));
  assert.ok(files.every((file) => !file.relativePath.includes('客户')));
});

test('feature creation preflights conflicts before writing', () => {
  const writes = [];
  const errors = createFeature({
    name: 'Conflict Test',
    exists: (absolute) => absolute.replace(/\\/g, '/').endsWith('features/conflict-test.md'),
    mkdir: () => {},
    writeFile: (absolute) => writes.push(absolute)
  });
  assert.deepEqual(errors, ['features/conflict-test.md already exists.']);
  assert.deepEqual(writes, []);
});
