import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateComponentCatalog,
  validateComponentRegistry,
  validateModuleComponents,
  validateSharedComponentCoverage,
  validateComponents
} from '../tools/component-checker.js';
import {
  canonicalSha256,
  inspectLegacyBaseline,
  inspectCurrentChangeExceptions
} from '../tools/legacy-baseline.js';

const EMPTY_LEGACY_STATE = {
  valid: true,
  errors: [],
  baseline: { componentFiles: [], boundaryFindings: [] }
};

const EMPTY_EXCEPTION_STATE = {
  valid: true,
  errors: [],
  entries: []
};

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
    read: () => ({ schemaVersion: 1, components: [] }),
    legacyState: EMPTY_LEGACY_STATE,
    exceptionState: EMPTY_EXCEPTION_STATE
  });
  assert.ok(errors.some((error) => error.includes('looks like a reusable control')));
});

test('obvious module component files outside components folders are rejected', () => {
  const errors = validateModuleComponents({
    files: () => ['frontend/src/modules/inventory/InventoryTable.tsx'],
    read: () => ({ schemaVersion: 1, components: [] }),
    legacyState: EMPTY_LEGACY_STATE,
    exceptionState: EMPTY_EXCEPTION_STATE
  });
  assert.ok(errors.some((error) => error.includes('looks like a reusable control')));
});

test('explicit component exception allows a module-local component', () => {
  const file = 'frontend/src/modules/inventory/InventoryTable.tsx';
  const exceptionPath = 'ai/changes/CR-test/component-exception.md';
  const read = (relativePath) => {
    if (relativePath === 'ai/changes/CURRENT_CHANGE.json') {
      return { schemaVersion: 1, current: 'CR-test' };
    }
    if (relativePath === 'ai/changes/CR-test/impact.json') {
      return { schemaVersion: 1, baseRevision: 'base-revision' };
    }
    if (relativePath === 'ai/changes/CR-test/changed-files.json') {
      return { schemaVersion: 1, files: [file] };
    }
    return { schemaVersion: 1, components: [] };
  };
  const readTextFile = (relativePath) => {
    if (relativePath === exceptionPath) {
      return `# Component exception\n\n- file: \`${file}\`\n  check: \`component\`\n  reason: Inventory table is feature-specific and intentionally local.\n`;
    }
    throw new Error(`unexpected read: ${relativePath}`);
  };
  const candidate = {
    path: file,
    oldMode: '100644',
    newMode: '100644',
    oldOid: '1'.repeat(40),
    newOid: '2'.repeat(40),
    status: 'M',
    contentChanged: true,
    source: 'candidate'
  };
  const exceptionState = inspectCurrentChangeExceptions('component', {
    read,
    readTextFile,
    validateBaseRevisionFn: () => [],
    collectActualChangedEntries: () => [{ ...candidate, candidate, layers: [candidate] }]
  });
  const errors = validateModuleComponents({
    files: () => [file],
    read,
    readTextFile,
    legacyState: EMPTY_LEGACY_STATE,
    exceptionState
  });
  assert.deepEqual(errors, []);
});

test('component exceptions reject allow-all prose and unchanged files', () => {
  const file = 'frontend/src/modules/inventory/InventoryTable.tsx';
  const read = (relativePath) => {
    if (relativePath === 'ai/changes/CURRENT_CHANGE.json') {
      return { schemaVersion: 1, current: 'CR-test' };
    }
    if (relativePath === 'ai/changes/CR-test/changed-files.json') {
      return { schemaVersion: 1, files: [] };
    }
    return { schemaVersion: 1, components: [] };
  };
  const exceptionState = inspectCurrentChangeExceptions('component', {
    read,
    readTextFile: () => `allow-all: true\n\nMentioned only in prose: \`${file}\`.\n`
  });
  const errors = validateModuleComponents({
    files: () => [file],
    read,
    legacyState: EMPTY_LEGACY_STATE,
    exceptionState
  });
  assert.ok(errors.some((error) => error.includes('allow-all')));
  assert.ok(errors.some((error) => error.includes('looks like a reusable control')));
});

test('hashed project baseline allows only the exact unchanged component file', () => {
  const file = 'ruoyi-ui/src/views/tool/gen/createTable.vue';
  const source = '<template><el-dialog /></template>\n';
  const baseline = {
    schemaVersion: 1,
    adapter: 'ruoyi',
    hashAlgorithm: 'sha256:utf8-no-bom-lf',
    componentFiles: [{
      id: 'tool-create-table',
      file,
      checks: ['component'],
      sha256: 'placeholder',
      reason: 'Reviewed RuoYi page-local component.',
      sourceCommit: '785d1ca725770db503351ced1446d01df750b9fa'
    }],
    boundaryFindings: []
  };
  baseline.componentFiles[0].sha256 = canonicalSha256(source);
  const legacyState = inspectLegacyBaseline({
    read: () => baseline,
    readCurrentFile: () => ({ mode: '100644', oid: '1'.repeat(40), content: source }),
    exists: () => true,
    validateWorktreeMatch: () => {},
    validateBaseRevisionFn: () => [],
    validateSourceCommit: () => {},
    readCommittedFile: () => source,
    readCommittedFileMode: () => '100644'
  });
  const errors = validateModuleComponents({
    files: () => [file, 'ruoyi-ui/src/views/tool/gen/anotherTable.vue'],
    read: () => ({ schemaVersion: 1, components: [] }),
    readTextFile: () => source,
    legacyState,
    exceptionState: EMPTY_EXCEPTION_STATE
  });
  assert.equal(errors.some((error) => error.startsWith(`${file} `)), false);
  assert.ok(errors.some((error) => error.startsWith('ruoyi-ui/src/views/tool/gen/anotherTable.vue ')));
});
