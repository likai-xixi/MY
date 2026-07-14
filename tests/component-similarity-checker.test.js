import test from 'node:test';
import assert from 'node:assert/strict';
import { validateComponentSimilarity } from '../tools/component-similarity-checker.js';
import { inspectCurrentChangeExceptions } from '../tools/legacy-baseline.js';

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
    }),
    legacyState: EMPTY_LEGACY_STATE,
    exceptionState: EMPTY_EXCEPTION_STATE
  });
  assert.ok(errors.some((error) => error.includes('EntitySelect')));
});

test('component similarity fails closed when module components exist but ledgers are empty', () => {
  const errors = validateComponentSimilarity({
    config,
    list: listFiles(['frontend/src/modules/inventory/ProductPicker.tsx']),
    read: (relativePath, fallback) => fallback,
    legacyState: EMPTY_LEGACY_STATE,
    exceptionState: EMPTY_EXCEPTION_STATE
  });
  assert.deepEqual(errors, [
    'Component similarity cannot be checked because component registry and catalogs are empty while module component files exist.'
  ]);
});

test('component similarity honors explicit component exceptions', () => {
  const file = 'frontend/src/modules/inventory/ProductPicker.tsx';
  const exceptionPath = 'ai/changes/CR-test/component-exception.md';
  const read = readWithRegistry({
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
  }, 'CR-test');
  const readWithImpact = (relativePath, fallback) => {
    if (relativePath === 'ai/changes/CR-test/impact.json') {
      return { schemaVersion: 1, baseRevision: 'base-revision' };
    }
    return read(relativePath, fallback);
  };
  const readTextFile = (relativePath) => {
    if (relativePath === exceptionPath) {
      return `# Component exception\n\n- file: \`${file}\`\n  check: \`similarity\`\n  reason: Product picker is intentionally feature-specific.\n`;
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
    read: readWithImpact,
    readTextFile,
    readChangedFiles: () => ({ schemaVersion: 1, files: [file] }),
    validateBaseRevisionFn: () => [],
    collectActualChangedEntries: () => [{ ...candidate, candidate, layers: [candidate] }]
  });
  const errors = validateComponentSimilarity({
    config,
    list: listFiles([file]),
    read: readWithImpact,
    readTextFile,
    readChangedFiles: () => ({ schemaVersion: 1, files: [file] }),
    legacyState: EMPTY_LEGACY_STATE,
    exceptionState
  });
  assert.deepEqual(errors, []);
});

test('ruoyi-reference aliases are not treated as reusable shared implementations', () => {
  const file = 'frontend/src/modules/inventory/ProductPicker.tsx';
  const errors = validateComponentSimilarity({
    config,
    list: listFiles([file]),
    read: readWithRegistry({
      schemaVersion: 1,
      components: [
        {
          id: file,
          name: file,
          aliases: [file],
          purpose: 'Ownership alias for a RuoYi scanned component reference.',
          category: 'ruoyi-reference',
          path: 'frontend/src/components/ParentView.tsx',
          owner: 'ruoyi-platform',
          status: 'active',
          usedBy: []
        },
        {
          id: 'shared.status-badge',
          name: 'StatusBadge',
          purpose: 'Render a status badge',
          category: 'display',
          path: 'frontend/src/components/StatusBadge.tsx',
          owner: 'frontend-agent',
          status: 'stable',
          usedBy: []
        }
      ]
    }),
    legacyState: EMPTY_LEGACY_STATE,
    exceptionState: EMPTY_EXCEPTION_STATE
  });
  assert.deepEqual(errors, []);
});
