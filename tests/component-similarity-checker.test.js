import test from 'node:test';
import assert from 'node:assert/strict';
import { validateComponentSimilarity } from '../tools/component-similarity-checker.js';

const config = {
  frontendModuleRoots: ['frontend/src/modules']
};

function listFiles(files) {
  return (roots, predicate) => files
    .filter((file) => roots.some((root) => file.startsWith(`${root}/`)))
    .filter(predicate);
}

function readWithRegistry(registry, current = '') {
  return (relativePath, fallback) => {
    if (relativePath === 'ai/registry/components.json') {
      return registry;
    }
    if (relativePath === 'ai/changes/CURRENT_CHANGE.json') {
      return { schemaVersion: 1, current };
    }
    return fallback;
  };
}

test('component similarity uses registry aliases props purpose and category', () => {
  const errors = validateComponentSimilarity({
    config,
    list: listFiles(['frontend/src/modules/inventory/ProductPicker.tsx']),
    read: readWithRegistry({
      schemaVersion: 1,
      components: [
        {
          id: 'shared.entity-select',
          name: 'EntitySelect',
          aliases: ['product picker', 'product chooser'],
          purpose: 'Choose an entity inside a form',
          props: [{ name: 'options' }, { name: 'modelValue' }],
          category: 'picker',
          path: 'frontend/src/components/forms/EntitySelect.tsx',
          owner: 'frontend-agent',
          status: 'stable',
          usedBy: []
        }
      ]
    })
  });
  assert.ok(errors.some((error) => error.includes('EntitySelect')));
});

test('component similarity fails closed when module components exist but ledgers are empty', () => {
  const errors = validateComponentSimilarity({
    config,
    list: listFiles(['frontend/src/modules/inventory/ProductPicker.tsx']),
    read: (relativePath, fallback) => fallback
  });
  assert.deepEqual(errors, [
    'Component similarity cannot be checked because component registry and catalogs are empty while module component files exist.'
  ]);
});

test('component similarity honors explicit component exceptions', () => {
  const file = 'frontend/src/modules/inventory/ProductPicker.tsx';
  const errors = validateComponentSimilarity({
    config,
    list: listFiles([file]),
    read: readWithRegistry({
      schemaVersion: 1,
      components: [
        {
          id: 'shared.entity-select',
          name: 'EntitySelect',
          aliases: ['product picker'],
          purpose: 'Choose an entity inside a form',
          props: ['options'],
          category: 'picker',
          path: 'frontend/src/components/forms/EntitySelect.tsx',
          owner: 'frontend-agent',
          status: 'stable',
          usedBy: []
        }
      ]
    }, 'CR-test'),
    readTextFile: () => `# Component exception\n\n- ${file}\n`
  });
  assert.deepEqual(errors, []);
});
