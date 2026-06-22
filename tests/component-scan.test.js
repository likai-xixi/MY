import test from 'node:test';
import assert from 'node:assert/strict';
import { buildComponentScan } from '../tools/scan-components.js';

function listFiles(files) {
  return (roots, predicate) => files
    .filter((file) => roots.some((root) => file.startsWith(`${root}/`)))
    .filter(predicate);
}

test('component scan includes obvious module components outside components folders', () => {
  const scan = buildComponentScan({
    config: {
      adapter: 'generic',
      sharedComponentRoots: ['frontend/src/components'],
      frontendModuleRoots: ['frontend/src/modules'],
      frontendScanRoots: []
    },
    features: [
      {
        id: 'inventory',
        frontendModules: ['frontend/src/modules/inventory']
      }
    ],
    list: listFiles([
      'frontend/src/modules/inventory/InventoryTable.tsx',
      'frontend/src/modules/inventory/index.tsx',
      'frontend/src/modules/inventory/state.ts'
    ]),
    exists: () => false,
    readOrDefault: () => ({ schemaVersion: 1, components: [] })
  });

  assert.deepEqual(scan.moduleComponentFiles, [
    {
      file: 'frontend/src/modules/inventory/InventoryTable.tsx',
      name: 'InventoryTable',
      module: 'inventory'
    }
  ]);
});
