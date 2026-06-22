import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeImpact } from '../tools/impact-analyzer.js';
import { readJson } from '../tools/common.js';

function firstActiveFeature() {
  try {
    const registry = readJson('ai/registry/features.json');
    return (registry.features || []).find((feature) => feature.status !== 'removed') || null;
  } catch {
    return null;
  }
}

test('impact analyzer resolves active features without relying on a fixed sample', () => {
  const feature = firstActiveFeature();
  if (!feature) {
    const impact = analyzeImpact({ name: '新增功能：客户管理', mode: 'add' });
    assert.equal(impact.feature.id, 'customer');
    assert.equal(impact.blockers.length, 0);
    assert.ok(impact.allowedEditRoots.includes('backend/modules/customer'));
    return;
  }
  const impact = analyzeImpact({ name: feature.name || feature.id, mode: 'update' });
  assert.equal(impact.feature.id, feature.id);
  assert.equal(impact.blockers.length, 0);
  for (const modulePath of feature.backendModules || []) {
    assert.ok(impact.allowedEditRoots.includes(modulePath));
  }
});
