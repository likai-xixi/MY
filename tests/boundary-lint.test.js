import test from 'node:test';
import assert from 'node:assert/strict';
import { validateBackendBoundaries, validateFrontendBoundaries, validateBoundaries } from '../tools/boundary-lint.js';
import { canonicalSha256, inspectCurrentChangeExceptions, inspectLegacyBaseline } from '../tools/legacy-baseline.js';

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

test('boundary lint passes for scaffold', () => {
  assert.deepEqual(validateBoundaries(), []);
});

test('backend root layer directories are rejected', () => {
  const errors = validateBackendBoundaries({
    exists: (relativePath) => relativePath === 'backend/api',
    files: () => [],
    read: () => ''
  });
  assert.ok(errors.some((error) => error.includes('backend/api is not allowed')));
});

test('backend root code is rejected unless explicitly whitelisted', () => {
  const errors = validateBackendBoundaries({
    exists: () => false,
    files: () => ['backend/order-service.ts'],
    read: () => '',
    directories: () => [],
    policy: { backend: { rootCodeWhitelist: [] } }
  });
  assert.ok(errors.some((error) => error.includes('backend root code')));
});

test('backend module subdirectories are limited to layers or whitelist entries', () => {
  const errors = validateBackendBoundaries({
    exists: () => false,
    files: () => [],
    read: () => '',
    directories: (relativePath) => {
      if (relativePath === 'backend/modules') return ['inventory'];
      if (relativePath === 'backend/modules/inventory') return ['api', 'jobs'];
      return [];
    },
    policy: {
      backend: {
        allowedModuleSubdirectories: ['api', 'service', 'domain', 'repository'],
        moduleSubdirectoryWhitelist: []
      }
    }
  });
  assert.ok(errors.some((error) => error.includes('backend/modules/inventory/jobs')));
});

test('backend module subdirectory whitelist permits registered exceptions', () => {
  const errors = validateBackendBoundaries({
    exists: () => false,
    files: () => [],
    read: () => '',
    directories: (relativePath) => {
      if (relativePath === 'backend/modules') return ['inventory'];
      if (relativePath === 'backend/modules/inventory') return ['api', 'jobs'];
      return [];
    },
    policy: {
      backend: {
        allowedModuleSubdirectories: ['api', 'service', 'domain', 'repository'],
        moduleSubdirectoryWhitelist: ['jobs']
      }
    }
  });
  assert.deepEqual(errors, []);
});

test('backend common cannot depend on feature modules', () => {
  const errors = validateBackendBoundaries({
    exists: () => false,
    files: () => ['backend/common/shared.ts'],
    read: () => "import x from 'backend/modules/inventory/domain/model';"
  });
  assert.ok(errors.some((error) => error.includes('must not import from backend/modules')));
});

test('domain layer cannot depend on repository', () => {
  const errors = validateBackendBoundaries({
    exists: () => false,
    files: () => ['backend/modules/inventory/domain/item.ts'],
    read: () => "import repo from 'backend/modules/inventory/repository/item-repository';"
  });
  assert.ok(errors.some((error) => error.includes('domain layer must not depend on repository')));
});

test('frontend shared components cannot depend on modules', () => {
  const errors = validateFrontendBoundaries({
    files: () => ['frontend/src/components/SharedTable.tsx'],
    read: () => "import state from 'frontend/src/modules/inventory/state';"
  });
  assert.ok(errors.some((error) => error.includes('Shared components cannot depend on business modules')));
});

test('frontend modules cannot import another module internals', () => {
  const errors = validateFrontendBoundaries({
    files: () => ['frontend/src/modules/inventory/view.tsx'],
    read: () => "import x from 'frontend/src/modules/orders/components/OrderTable';"
  });
  assert.ok(errors.some((error) => error.includes('orders')));
});

test('RuoYi boundary baseline consumes only exact expected targets', () => {
  const file = 'ruoyi-ui/src/views/tool/gen/editTable.vue';
  const source = "import x from '@/api/system/menu';\nimport y from '@/api/customer';\n";
  const baseline = {
    schemaVersion: 1,
    adapter: 'ruoyi',
    hashAlgorithm: 'sha256:utf8-no-bom-lf',
    componentFiles: [],
    boundaryFindings: [{
      id: 'tool-edit-table-system',
      file,
      expectedTargets: ['system'],
      sha256: '',
      reason: 'Reviewed RuoYi generator dependency.',
      sourceCommit: '785d1ca725770db503351ced1446d01df750b9fa'
    }]
  };
  baseline.boundaryFindings[0].sha256 = canonicalSha256(source);
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
  const features = [
    { id: 'tool', status: 'active', frontendModules: ['ruoyi-ui/src/views/tool'] },
    { id: 'system', status: 'active', frontendModules: ['ruoyi-ui/src/views/system'] },
    { id: 'customer', status: 'active', frontendModules: ['ruoyi-ui/src/views/customer'] }
  ];
  const errors = validateFrontendBoundaries({
    files: () => [],
    read: () => '',
    ruoyiRead: () => source,
    ruoyiFiles: (roots, predicate) => [file].filter(predicate),
    ruoyiFeatures: features,
    legacyState,
    exceptionState: EMPTY_EXCEPTION_STATE
  });
  assert.equal(errors.some((error) => error.includes('(system)')), false);
  assert.ok(errors.some((error) => error.includes('(customer)')));
});

test('RuoYi boundary baseline rejects a stale expected target', () => {
  const file = 'ruoyi-ui/src/views/tool/gen/editTable.vue';
  const source = "import y from '@/api/customer';\n";
  const baseline = {
    schemaVersion: 1,
    adapter: 'ruoyi',
    hashAlgorithm: 'sha256:utf8-no-bom-lf',
    componentFiles: [],
    boundaryFindings: [{
      id: 'tool-edit-table-system',
      file,
      expectedTargets: ['system'],
      sha256: canonicalSha256(source),
      reason: 'Reviewed RuoYi generator dependency.',
      sourceCommit: '785d1ca725770db503351ced1446d01df750b9fa'
    }]
  };
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
  const features = [
    { id: 'tool', status: 'active', frontendModules: ['ruoyi-ui/src/views/tool'] },
    { id: 'system', status: 'active', frontendModules: ['ruoyi-ui/src/views/system'] },
    { id: 'customer', status: 'active', frontendModules: ['ruoyi-ui/src/views/customer'] }
  ];
  const errors = validateFrontendBoundaries({
    files: () => [],
    read: () => '',
    ruoyiRead: () => source,
    ruoyiFiles: (roots, predicate) => [file].filter(predicate),
    ruoyiFeatures: features,
    legacyState,
    exceptionState: EMPTY_EXCEPTION_STATE
  });
  assert.ok(errors.some((error) => error.includes('stale') && error.includes('(system)')));
  assert.ok(errors.some((error) => error.includes('(customer)')));
});

test('RuoYi current-change boundary exception is target-specific', () => {
  const file = 'ruoyi-ui/src/views/tool/gen/editTable.vue';
  const source = "import x from '@/api/system/menu';\nimport y from '@/api/customer';\n";
  const features = [
    { id: 'tool', status: 'active', frontendModules: ['ruoyi-ui/src/views/tool'] },
    { id: 'system', status: 'active', frontendModules: ['ruoyi-ui/src/views/system'] },
    { id: 'customer', status: 'active', frontendModules: ['ruoyi-ui/src/views/customer'] }
  ];
  const currentChangeRead = (relativePath) => {
    if (relativePath === 'ai/changes/CURRENT_CHANGE.json') return { current: 'CR-test' };
    if (relativePath === 'ai/changes/CR-test/impact.json') return { baseRevision: 'base-revision' };
    if (relativePath === 'ai/changes/CR-test/changed-files.json') return { files: [file] };
    throw new Error(`unexpected read: ${relativePath}`);
  };
  const currentChangeReadText = () => `# Boundary exception\n\n- file: \`${file}\`\n  target: \`system\`\n  reason: Reviewed generator dependency for this changed file.\n`;
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
  const exceptionState = inspectCurrentChangeExceptions('boundary', {
    read: currentChangeRead,
    readTextFile: currentChangeReadText,
    validateBaseRevisionFn: () => [],
    collectActualChangedEntries: () => [{ ...candidate, candidate, layers: [candidate] }]
  });
  const errors = validateFrontendBoundaries({
    files: () => [],
    read: () => '',
    ruoyiRead: () => source,
    ruoyiFiles: (roots, predicate) => [file].filter(predicate),
    ruoyiFeatures: features,
    legacyState: EMPTY_LEGACY_STATE,
    currentChangeRead,
    currentChangeReadText,
    exceptionState
  });
  assert.equal(errors.some((error) => error.includes('(system)')), false);
  assert.ok(errors.some((error) => error.includes('(customer)')));
});
