import test from 'node:test';
import assert from 'node:assert/strict';
import { buildComponentScan, extractVueTemplateComponentTags } from '../tools/scan-components.js';

test('Vue template global component tags are detected', () => {
  const tags = extractVueTemplateComponentTags(`
    <template>
      <div>
        <right-toolbar />
        <pagination />
        <svg-icon icon-class="user" />
        <el-button>Search</el-button>
        <span>Native</span>
      </div>
    </template>
  `);

  assert.deepEqual(tags, ['pagination', 'right-toolbar', 'svg-icon']);
});

test('component scan records template globals and preserves import scan', () => {
  const files = [
    'ruoyi-ui/src/views/customer/index.vue',
    'ruoyi-ui/src/main.js'
  ];
  const content = {
    'ruoyi-ui/src/views/customer/index.vue': `
      <template>
        <right-toolbar />
        <pagination />
        <el-button />
      </template>
    `,
    'ruoyi-ui/src/main.js': 'import RightToolbar from "@/components/RightToolbar";'
  };
  const scan = buildComponentScan({
    config: {
      adapter: 'ruoyi',
      sharedComponentRoots: ['ruoyi-ui/src/components'],
      frontendModuleRoots: ['ruoyi-ui/src/views'],
      frontendScanRoots: ['ruoyi-ui/src']
    },
    features: [
      {
        id: 'customer',
        status: 'active',
        featureBrief: 'features/customer.md',
        frontendModules: ['ruoyi-ui/src/views/customer']
      }
    ],
    list: (roots, predicate) => files.filter((file) => roots.some((root) => file.startsWith(root)) && predicate(file)),
    exists: () => true,
    read: () => ({
      schemaVersion: 1,
      components: [
        {
          id: 'ruoyi-right-toolbar-index',
          name: 'RightToolbar / index',
          path: 'ruoyi-ui/src/components/RightToolbar/index.vue',
          aliases: ['RightToolbar/index']
        },
        {
          id: 'ruoyi-pagination-index',
          name: 'Pagination / index',
          path: 'ruoyi-ui/src/components/Pagination/index.vue',
          aliases: ['Pagination/index']
        }
      ]
    }),
    readOrDefault: () => ({ schemaVersion: 1, components: [] }),
    readTextFile: (file) => content[file] || ''
  });

  assert.ok(scan.globalComponentUsages.some((usage) => usage.tag === 'right-toolbar' && usage.componentId === 'ruoyi-right-toolbar-index'));
  assert.ok(scan.globalComponentUsages.some((usage) => usage.tag === 'pagination' && usage.componentId === 'ruoyi-pagination-index'));
  assert.equal(scan.globalComponentUsages.some((usage) => usage.tag === 'el-button'), false);
  assert.ok(scan.imports.some((item) => item.source === '@/components/RightToolbar'));
});
