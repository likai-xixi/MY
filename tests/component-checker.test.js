import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateComponentCatalog,
  validateComponentRegistry,
  validateModuleComponents,
  validateSharedComponentCoverage,
  validateComponents
} from '../tools/component-checker.js';

test('component governance passes when no component files exist yet', () => {
  assert.deepEqual(validateComponents(), []);
});

test('component catalog requires export from shared index', () => {
  const errors = validateComponentCatalog({
    exists: () => true,
    readTextFile: () => '',
    read: () => ({
      schemaVersion: 1,
      components: [
        {
          id: 'shared.button',
          name: 'SharedButton',
          exportedFrom: 'controls/SharedButton.tsx',
          owner: 'frontend-agent',
          purpose: 'Primary action button',
          category: 'control',
          status: 'stable',
          usedBy: []
        }
      ]
    })
  });
  assert.ok(errors.some((error) => error.includes('must be exported')));
});

test('component registry requires searchable governance fields', () => {
  const errors = validateComponentRegistry({
    exists: () => true,
    read: () => ({
      schemaVersion: 1,
      components: [
        {
          id: 'shared.button',
          name: 'SharedButton',
          path: 'frontend/src/components/controls/SharedButton.tsx',
          owner: 'frontend-agent',
          purpose: 'Primary action button',
          status: 'stable',
          usedBy: []
        }
      ]
    })
  });
  assert.ok(errors.some((error) => error.includes('missing category')));
});

test('shared component files must be registered in catalog and registry', () => {
  const errors = validateSharedComponentCoverage({
    files: () => ['frontend/src/components/controls/SharedButton.tsx'],
    read: () => ({ schemaVersion: 1, components: [] })
  });
  assert.ok(errors.some((error) => error.includes('frontend/src/components/catalog.json is empty')));
  assert.ok(errors.some((error) => error.includes('ai/registry/components.json is empty')));
  assert.ok(errors.some((error) => error.includes('must be registered in frontend/src/components/catalog.json')));
  assert.ok(errors.some((error) => error.includes('must be registered in ai/registry/components.json')));
});

test('shared component catalog and registry ids must align', () => {
  const read = (relativePath) => {
    if (relativePath === 'ai/registry/components.json') {
      return {
        schemaVersion: 1,
        components: [
          {
            id: 'shared.primary-action',
            name: 'SharedButton',
            path: 'frontend/src/components/controls/SharedButton.tsx',
            owner: 'frontend-agent',
            purpose: 'Primary action button',
            category: 'control',
            status: 'stable',
            usedBy: []
          }
        ]
      };
    }
    return {
      schemaVersion: 1,
      components: [
        {
          id: 'shared.button',
          name: 'SharedButton',
          exportedFrom: 'controls/SharedButton.tsx',
          owner: 'frontend-agent',
          purpose: 'Primary action button',
          category: 'control',
          status: 'stable',
          usedBy: []
        }
      ]
    };
  };
  const errors = validateSharedComponentCoverage({
    files: () => ['frontend/src/components/controls/SharedButton.tsx'],
    read
  });
  assert.ok(errors.some((error) => error.includes('must use the same component id')));
});

test('module generic component names are rejected', () => {
  const errors = validateModuleComponents({
    files: () => ['frontend/src/modules/inventory/components/Button.tsx'],
    read: () => ({ schemaVersion: 1, components: [] })
  });
  assert.ok(errors.some((error) => error.includes('looks like a reusable control')));
});

test('obvious module component files outside components folders are rejected', () => {
  const errors = validateModuleComponents({
    files: () => ['frontend/src/modules/inventory/InventoryTable.tsx'],
    read: () => ({ schemaVersion: 1, components: [] })
  });
  assert.ok(errors.some((error) => error.includes('looks like a reusable control')));
});

test('explicit component exception allows a module-local component', () => {
  const file = 'frontend/src/modules/inventory/InventoryTable.tsx';
  const errors = validateModuleComponents({
    files: () => [file],
    read: (relativePath) => {
      if (relativePath === 'ai/changes/CURRENT_CHANGE.json') {
        return { schemaVersion: 1, current: 'CR-test' };
      }
      return { schemaVersion: 1, components: [] };
    },
    readTextFile: () => `# Component exception\n\n- ${file}\n`
  });
  assert.deepEqual(errors, []);
});
