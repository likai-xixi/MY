import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canonicalSha256,
  inspectCurrentChangeExceptions,
  inspectLegacyBaseline,
  isCurrentComponentException,
  isLegacyBoundaryFinding,
  validateLegacySourceCommit,
  validateLegacyBaseline
} from '../tools/legacy-baseline.js';

function fixture(baseline, sources) {
  return {
    read: () => baseline,
    readTextFile: (file) => {
      if (!(file in sources)) throw new Error(`missing source: ${file}`);
      return sources[file];
    },
    exists: (file) => file in sources,
    readCurrentFile: (file) => {
      if (!(file in sources)) throw new Error(`missing index source: ${file}`);
      return {
        mode: '100644',
        oid: '1'.repeat(40),
        content: sources[file]
      };
    },
    readCurrentFileMode: () => '100644',
    validateWorktreeMatch: () => {},
    validateBaseRevisionFn: () => [],
    validateSourceCommit: () => {},
    readCommittedFileMode: () => '100644',
    readCommittedFile: (_commit, file) => {
      if (!(file in sources)) throw new Error(`missing committed source: ${file}`);
      return sources[file];
    }
  };
}

function contentChange(file, overrides = {}) {
  const candidate = {
    path: file,
    oldMode: '100644',
    newMode: '100644',
    oldOid: '1'.repeat(40),
    newOid: '2'.repeat(40),
    status: 'M',
    contentChanged: true,
    ...overrides
  };
  return {
    ...candidate,
    candidate,
    layers: [candidate]
  };
}

test('repo RuoYi legacy baseline is valid and exact', () => {
  const state = inspectLegacyBaseline();
  assert.deepEqual(state.errors, []);
  assert.equal(state.baseline.componentFiles.length, 9);
  assert.equal(state.baseline.boundaryFindings.length, 3);
  assert.equal(state.baseline.boundaryFindings.flatMap((entry) => entry.expectedTargets).length, 4);
});

test('canonical SHA256 removes BOM and normalizes CRLF and CR to LF', () => {
  const expected = canonicalSha256('first\nsecond\n');
  assert.equal(canonicalSha256('\uFEFFfirst\r\nsecond\r'), expected);
});

test('canonical SHA256 rejects invalid UTF-8 bytes instead of hashing replacement characters', () => {
  assert.throws(
    () => canonicalSha256(Buffer.from([0x66, 0x80, 0x6f])),
    /invalid UTF-8/i
  );
  assert.throws(
    () => canonicalSha256(Buffer.from([0x66, 0x81, 0x6f])),
    /invalid UTF-8/i
  );
});

test('legacy baseline reports an invalid JSON root without crashing', () => {
  const state = inspectLegacyBaseline(fixture(null, {}));
  assert.equal(state.valid, false);
  assert.ok(state.errors.some((error) => error.includes('root must be a JSON object')));
});

test('legacy baseline rejects globs duplicates missing reasons and hash drift', () => {
  const file = 'ruoyi-ui/src/views/tool/gen/editTable.vue';
  const source = 'original\n';
  const baseline = {
    schemaVersion: 1,
    adapter: 'ruoyi',
    hashAlgorithm: 'sha256:utf8-no-bom-lf',
    componentFiles: [
      {
        id: 'bad-glob',
        file: 'ruoyi-ui/src/views/tool/**/*.vue',
        checks: ['component'],
        sha256: canonicalSha256(source),
        reason: '',
        sourceCommit: '785d1ca725770db503351ced1446d01df750b9fa'
      },
      {
        id: 'bad-glob',
        file,
        checks: ['component'],
        sha256: canonicalSha256('different\n'),
        reason: 'Duplicate id with stale hash.',
        sourceCommit: '785d1ca725770db503351ced1446d01df750b9fa'
      }
    ],
    boundaryFindings: []
  };
  const errors = validateLegacyBaseline(fixture(baseline, { [file]: source }));
  assert.ok(errors.some((error) => error.includes('exact file path')));
  assert.ok(errors.some((error) => error.includes('reason')));
  assert.ok(errors.some((error) => error.includes('duplicated')));
  assert.ok(errors.some((error) => error.includes('hash mismatch')));
});

test('legacy baseline rejects missing commits and commit-file hash mismatches', () => {
  const file = 'ruoyi-ui/src/views/tool/gen/editTable.vue';
  const source = 'current source\n';
  const baseline = {
    schemaVersion: 1,
    adapter: 'ruoyi',
    hashAlgorithm: 'sha256:utf8-no-bom-lf',
    componentFiles: [{
      id: 'claimed-legacy-source',
      file,
      checks: ['component'],
      sha256: canonicalSha256(source),
      reason: 'Claims a fixed historical source.',
      sourceCommit: '0000000000000000000000000000000000000000'
    }],
    boundaryFindings: []
  };

  const missingCommit = inspectLegacyBaseline({
    ...fixture(baseline, { [file]: source }),
    validateSourceCommit: () => {
      throw new Error('unknown commit');
    }
  });
  assert.equal(missingCommit.valid, false);
  assert.ok(missingCommit.errors.some((error) => error.includes('sourceCommit cannot resolve')));

  const unrelatedCommit = inspectLegacyBaseline({
    ...fixture(baseline, { [file]: source }),
    validateSourceCommit: () => {
      throw new Error('commit is not an ancestor of HEAD');
    }
  });
  assert.equal(unrelatedCommit.valid, false);
  assert.ok(unrelatedCommit.errors.some((error) => error.includes('ancestor of HEAD')));

  const mismatchedHistory = inspectLegacyBaseline({
    ...fixture(baseline, { [file]: source }),
    readCommittedFile: () => 'different historical source\n'
  });
  assert.equal(mismatchedHistory.valid, false);
  assert.ok(mismatchedHistory.errors.some((error) => error.includes('sourceCommit hash mismatch')));
});

test('legacy source commits are bound to impact.baseRevision so post-base HEAD ancestors fail', () => {
  const file = 'ruoyi-ui/src/views/tool/gen/editTable.vue';
  const source = 'post-base violation\n';
  const baseRevision = 'a'.repeat(40);
  const postBaseCommit = 'b'.repeat(40);
  let receivedBaseRevision = '';
  const baseline = {
    schemaVersion: 1,
    adapter: 'ruoyi',
    hashAlgorithm: 'sha256:utf8-no-bom-lf',
    componentFiles: [{
      id: 'post-base-legacy-laundering',
      file,
      checks: ['component'],
      sha256: canonicalSha256(source),
      reason: 'A post-base commit must not become legacy evidence.',
      sourceCommit: postBaseCommit
    }],
    boundaryFindings: []
  };

  const state = inspectLegacyBaseline({
    ...fixture(baseline, { [file]: source }),
    baseRevision,
    validateSourceCommit: (_commit, activeBaseRevision) => {
      receivedBaseRevision = activeBaseRevision;
      if (activeBaseRevision === baseRevision) {
        throw new Error(`commit ${postBaseCommit} is not an ancestor of impact.baseRevision ${baseRevision}`);
      }
    }
  });

  assert.equal(receivedBaseRevision, baseRevision);
  assert.equal(state.valid, false);
  assert.ok(state.errors.some((error) => error.includes('not an ancestor of impact.baseRevision')));
});

test('default legacy ancestry validation checks sourceCommit against impact.baseRevision, never HEAD', () => {
  const baseRevision = 'a'.repeat(40);
  const postBaseCommit = 'b'.repeat(40);
  const calls = [];

  assert.throws(() => validateLegacySourceCommit(postBaseCommit, baseRevision, {
    runGitResultFn: (args) => {
      calls.push(args);
      if (args[0] === 'cat-file') return { status: 0, stdout: 'commit' };
      if (args[0] === 'merge-base' && args.at(-1) === baseRevision) return { status: 1, stdout: '' };
      if (args[0] === 'merge-base' && args.at(-1) === 'HEAD') return { status: 0, stdout: '' };
      return { status: 1, stdout: '' };
    }
  }), /ancestor of impact\.baseRevision/);

  assert.deepEqual(calls.find((args) => args[0] === 'merge-base'), [
    'merge-base',
    '--is-ancestor',
    postBaseCommit,
    baseRevision
  ]);
  assert.equal(calls.some((args) => args.includes('HEAD')), false);
});

test('legacy evidence must already have the same blob at impact.baseRevision', () => {
  const file = 'ruoyi-ui/src/views/tool/gen/editTable.vue';
  const source = 'old violation reintroduced after base\n';
  const baseRevision = 'a'.repeat(40);
  const sourceCommit = '7'.repeat(40);
  const baseline = {
    schemaVersion: 1,
    adapter: 'ruoyi',
    hashAlgorithm: 'sha256:utf8-no-bom-lf',
    componentFiles: [{
      id: 'reintroduced-pre-base-content',
      file,
      checks: ['component'],
      sha256: canonicalSha256(source),
      reason: 'Old content that was absent at the active base is not legacy.',
      sourceCommit
    }],
    boundaryFindings: []
  };
  const state = inspectLegacyBaseline({
    ...fixture(baseline, { [file]: source }),
    baseRevision,
    readCommittedFile: (commit) => commit === baseRevision ? 'clean at base\n' : source
  });

  assert.equal(state.valid, false);
  assert.ok(state.errors.some((error) => error.includes('impact.baseRevision hash mismatch')));
});

test('legacy baseline hashes the staged index blob and independently rejects worktree divergence', () => {
  const file = 'ruoyi-ui/src/views/tool/gen/editTable.vue';
  const baseSource = 'legacy baseline source\n';
  const stagedSource = 'staged policy bypass\n';
  const baseline = {
    schemaVersion: 1,
    adapter: 'ruoyi',
    hashAlgorithm: 'sha256:utf8-no-bom-lf',
    componentFiles: [{
      id: 'index-bound-legacy-source',
      file,
      checks: ['component'],
      sha256: canonicalSha256(baseSource),
      reason: 'The candidate index blob must remain identical to the reviewed legacy source.',
      sourceCommit: '7'.repeat(40)
    }],
    boundaryFindings: []
  };

  const stagedMismatch = inspectLegacyBaseline({
    ...fixture(baseline, { [file]: baseSource }),
    readCurrentFile: () => ({
      mode: '100644',
      oid: '2'.repeat(40),
      content: stagedSource
    })
  });
  assert.equal(stagedMismatch.valid, false);
  assert.ok(stagedMismatch.errors.some((error) => error.includes('sha256 hash mismatch')));

  const divergentWorktree = inspectLegacyBaseline({
    ...fixture(baseline, { [file]: baseSource }),
    validateWorktreeMatch: () => {
      throw new Error('working tree differs from the Git index');
    }
  });
  assert.equal(divergentWorktree.valid, false);
  assert.ok(divergentWorktree.errors.some((error) => error.includes('working tree differs from the Git index')));
});

test('standalone legacy baseline validates impact.baseRevision before accepting evidence', () => {
  const baseRevision = 'a'.repeat(40);
  let receivedRevision = '';
  const state = inspectLegacyBaseline({
    ...fixture({
      schemaVersion: 1,
      adapter: 'ruoyi',
      hashAlgorithm: 'sha256:utf8-no-bom-lf',
      componentFiles: [],
      boundaryFindings: []
    }, {}),
    baseRevision,
    validateBaseRevisionFn: (revision) => {
      receivedRevision = revision;
      return [`impact.baseRevision ${revision} is not an ancestor of HEAD.`];
    }
  });

  assert.equal(receivedRevision, baseRevision);
  assert.equal(state.valid, false);
  assert.ok(state.errors.some((error) => error.includes('not an ancestor of HEAD')));
});

test('legacy baseline rejects current and historical non-blob source modes', () => {
  const file = 'ruoyi-ui/src/views/tool/gen/editTable.vue';
  const source = 'linked source\n';
  const baseline = {
    schemaVersion: 1,
    adapter: 'ruoyi',
    hashAlgorithm: 'sha256:utf8-no-bom-lf',
    componentFiles: [{
      id: 'linked-legacy-source',
      file,
      checks: ['component'],
      sha256: canonicalSha256(source),
      reason: 'Symlinks and gitlinks cannot be legacy source evidence.',
      sourceCommit: '7'.repeat(40)
    }],
    boundaryFindings: []
  };

  const currentSymlink = inspectLegacyBaseline({
    ...fixture(baseline, { [file]: source }),
    readCurrentFile: () => ({
      mode: '120000',
      oid: '1'.repeat(40),
      content: null
    })
  });
  assert.equal(currentSymlink.valid, false);
  assert.ok(currentSymlink.errors.some((error) => error.includes('current Git mode 120000')));

  const historicalGitlink = inspectLegacyBaseline({
    ...fixture(baseline, { [file]: source }),
    readCommittedFileMode: () => '160000'
  });
  assert.equal(historicalGitlink.valid, false);
  assert.ok(historicalGitlink.errors.some((error) => error.includes('historical Git mode 160000')));
});

test('boundary baseline matches an exact file and target only', () => {
  const file = 'ruoyi-ui/src/views/tool/gen/editTable.vue';
  const source = "import x from '@/api/system/menu';\n";
  const baseline = {
    schemaVersion: 1,
    adapter: 'ruoyi',
    hashAlgorithm: 'sha256:utf8-no-bom-lf',
    componentFiles: [],
    boundaryFindings: [{
      id: 'tool-system-edge',
      file,
      expectedTargets: ['system'],
      sha256: canonicalSha256(source),
      reason: 'Reviewed RuoYi generator dependency.',
      sourceCommit: '785d1ca725770db503351ced1446d01df750b9fa'
    }]
  };
  const state = inspectLegacyBaseline(fixture(baseline, { [file]: source }));
  assert.equal(isLegacyBoundaryFinding(state, file, 'system'), true);
  assert.equal(isLegacyBoundaryFinding(state, file, 'customer'), false);
});

test('current component exception requires structured reason and actual changed file', () => {
  const file = 'frontend/src/modules/inventory/InventoryTable.tsx';
  let collectedBaseRevision = '';
  const read = (relativePath) => {
    if (relativePath === 'ai/changes/CURRENT_CHANGE.json') return { current: 'CR-test' };
    if (relativePath === 'ai/changes/CR-test/impact.json') return { baseRevision: 'base-revision' };
    if (relativePath === 'ai/changes/CR-test/changed-files.json') return { files: [file] };
    throw new Error(`unexpected read: ${relativePath}`);
  };
  const state = inspectCurrentChangeExceptions('component', {
    read,
    readTextFile: () => `# Component exception\n\n- file: \`${file}\`\n  check: \`component\`\n  reason: Inventory table is intentionally feature-specific.\n`,
    validateBaseRevisionFn: () => [],
    collectActualChangedEntries: ({ baseRevision }) => {
      collectedBaseRevision = baseRevision;
      return [contentChange(file)];
    }
  });
  assert.deepEqual(state.errors, []);
  assert.equal(collectedBaseRevision, 'base-revision');
  assert.equal(isCurrentComponentException(state, file, 'component'), true);
  assert.equal(isCurrentComponentException(state, file, 'similarity'), false);
});

test('current component and boundary exceptions reject manifest-only files outside the actual Git set', () => {
  const cases = [
    {
      kind: 'component',
      file: 'frontend/src/modules/inventory/InventoryTable.tsx',
      fields: '  check: `component`\n'
    },
    {
      kind: 'boundary',
      file: 'ruoyi-ui/src/views/customer/index.vue',
      fields: '  target: `system`\n'
    }
  ];
  for (const item of cases) {
    const state = inspectCurrentChangeExceptions(item.kind, {
      read: (relativePath) => {
        if (relativePath === 'ai/changes/CURRENT_CHANGE.json') return { current: 'CR-test' };
        if (relativePath === 'ai/changes/CR-test/impact.json') return { baseRevision: 'base-revision' };
        if (relativePath === 'ai/changes/CR-test/changed-files.json') return { files: [item.file] };
        throw new Error(`unexpected read: ${relativePath}`);
      },
      readTextFile: () => `- file: \`${item.file}\`\n${item.fields}  reason: Manifest-only overclaim.\n`,
      validateBaseRevisionFn: () => [],
      collectActualChangedEntries: () => []
    });
    assert.equal(state.valid, false, item.kind);
    assert.ok(state.errors.some((error) => error.includes('actual Git change set')), item.kind);
  }
});

test('current exceptions require a regular blob content change and reject mode-only evidence', () => {
  const file = 'frontend/src/modules/inventory/InventoryTable.tsx';
  const state = inspectCurrentChangeExceptions('component', {
    read: (relativePath) => {
      if (relativePath === 'ai/changes/CURRENT_CHANGE.json') return { current: 'CR-test' };
      if (relativePath === 'ai/changes/CR-test/impact.json') return { baseRevision: 'base-revision' };
      if (relativePath === 'ai/changes/CR-test/changed-files.json') return { files: [file] };
      throw new Error(`unexpected read: ${relativePath}`);
    },
    readTextFile: () => `- file: \`${file}\`\n  check: \`component\`\n  reason: A chmod must not grant a current exception.\n`,
    validateBaseRevisionFn: () => [],
    collectActualChangedEntries: () => [{
      path: file,
      oldMode: '100644',
      newMode: '100755',
      oldOid: '1'.repeat(40),
      newOid: '1'.repeat(40),
      status: 'M',
      contentChanged: false
    }]
  });

  assert.equal(state.valid, false);
  assert.ok(state.errors.some((error) => error.includes('regular blob content change')));
});

test('current exceptions use the staged candidate and cannot borrow an unstaged content change', () => {
  const file = 'frontend/src/modules/inventory/InventoryTable.tsx';
  const candidate = {
    path: file,
    oldMode: '100644',
    newMode: '100755',
    oldOid: '1'.repeat(40),
    newOid: '1'.repeat(40),
    status: 'M',
    contentChanged: false,
    source: 'candidate'
  };
  const worktree = {
    path: file,
    oldMode: '100755',
    newMode: '100755',
    oldOid: '1'.repeat(40),
    newOid: '2'.repeat(40),
    status: 'M',
    contentChanged: true,
    source: 'worktree'
  };
  const state = inspectCurrentChangeExceptions('component', {
    read: (relativePath) => {
      if (relativePath === 'ai/changes/CURRENT_CHANGE.json') return { current: 'CR-test' };
      if (relativePath === 'ai/changes/CR-test/impact.json') return { baseRevision: 'base-revision' };
      if (relativePath === 'ai/changes/CR-test/changed-files.json') return { files: [file] };
      throw new Error(`unexpected read: ${relativePath}`);
    },
    readTextFile: () => `- file: \`${file}\`\n  check: \`component\`\n  reason: Worktree changes cannot upgrade a mode-only candidate.\n`,
    validateBaseRevisionFn: () => [],
    collectActualChangedEntries: () => [{
      ...worktree,
      candidate,
      layers: [candidate, worktree]
    }]
  });

  assert.equal(state.valid, false);
  assert.ok(state.errors.some((error) => error.includes('regular blob content change')));
});

test('current exception Markdown rejects invalid UTF-8 bytes instead of decoding replacement text', () => {
  const file = 'frontend/src/modules/inventory/InventoryTable.tsx';
  const validPrefix = Buffer.from(`- file: \`${file}\`\n  check: \`component\`\n  reason: invalid byte follows `, 'utf8');
  const state = inspectCurrentChangeExceptions('component', {
    read: (relativePath) => {
      if (relativePath === 'ai/changes/CURRENT_CHANGE.json') return { current: 'CR-test' };
      throw new Error(`unexpected read: ${relativePath}`);
    },
    readTextFile: () => Buffer.concat([validPrefix, Buffer.from([0x80]), Buffer.from('\n')])
  });

  assert.equal(state.valid, false);
  assert.ok(state.errors.some((error) => /invalid UTF-8/i.test(error)));
});

test('current exception governance metadata fails closed when strict UTF-8 JSON cannot be read', () => {
  const state = inspectCurrentChangeExceptions('component', {
    read: () => {
      throw new Error('Source contains invalid UTF-8 bytes.');
    }
  });

  assert.equal(state.valid, false);
  assert.ok(state.errors.some((error) => /strict UTF-8 CURRENT_CHANGE\.json/i.test(error)));
});

test('current exceptions reject symlink and gitlink evidence even when the object id changed', () => {
  const file = 'frontend/src/modules/inventory/InventoryTable.tsx';
  for (const newMode of ['120000', '160000']) {
    const state = inspectCurrentChangeExceptions('component', {
      read: (relativePath) => {
        if (relativePath === 'ai/changes/CURRENT_CHANGE.json') return { current: 'CR-test' };
        if (relativePath === 'ai/changes/CR-test/impact.json') return { baseRevision: 'base-revision' };
        if (relativePath === 'ai/changes/CR-test/changed-files.json') return { files: [file] };
        throw new Error(`unexpected read: ${relativePath}`);
      },
      readTextFile: () => `- file: \`${file}\`\n  check: \`component\`\n  reason: Linked objects are not source-file exceptions.\n`,
      validateBaseRevisionFn: () => [],
      collectActualChangedEntries: () => [contentChange(file, { newMode })]
    });

    assert.equal(state.valid, false, newMode);
    assert.ok(state.errors.some((error) => error.includes('regular blob content change')), newMode);
  }
});

test('current exceptions reject unresolved raw Git status as content evidence', () => {
  const file = 'frontend/src/modules/inventory/InventoryTable.tsx';
  const state = inspectCurrentChangeExceptions('component', {
    read: (relativePath) => {
      if (relativePath === 'ai/changes/CURRENT_CHANGE.json') return { current: 'CR-test' };
      if (relativePath === 'ai/changes/CR-test/impact.json') return { baseRevision: 'base-revision' };
      if (relativePath === 'ai/changes/CR-test/changed-files.json') return { files: [file] };
      throw new Error(`unexpected read: ${relativePath}`);
    },
    readTextFile: () => `- file: \`${file}\`\n  check: \`component\`\n  reason: Conflicted Git entries are not verified content.\n`,
    validateBaseRevisionFn: () => [],
    collectActualChangedEntries: () => [contentChange(file, { status: 'U' })]
  });

  assert.equal(state.valid, false);
  assert.ok(state.errors.some((error) => error.includes('regular blob content change')));
});

test('current exception exact paths reject raw non-canonical syntax before matching manifests', () => {
  const file = 'frontend/src/modules/inventory/InventoryTable.tsx';
  const rawFile = './frontend\\src//modules/inventory/InventoryTable.tsx';
  const state = inspectCurrentChangeExceptions('component', {
    read: (relativePath) => {
      if (relativePath === 'ai/changes/CURRENT_CHANGE.json') return { current: 'CR-test' };
      if (relativePath === 'ai/changes/CR-test/impact.json') return { baseRevision: 'base-revision' };
      if (relativePath === 'ai/changes/CR-test/changed-files.json') return { files: [file] };
      throw new Error(`unexpected read: ${relativePath}`);
    },
    readTextFile: () => `- file: \`${rawFile}\`\n  check: \`component\`\n  reason: Non-canonical paths must not be normalized into an exception.\n`,
    validateBaseRevisionFn: () => [],
    collectActualChangedEntries: () => [file]
  });

  assert.equal(state.valid, false);
  assert.ok(state.errors.some((error) => error.includes('exact file path in normalized form')));
});

test('current exception exact paths reject internal dot segments as non-canonical syntax', () => {
  const file = 'frontend/src/modules/inventory/InventoryTable.tsx';
  const rawFile = 'frontend/src/modules/./inventory/InventoryTable.tsx';
  const state = inspectCurrentChangeExceptions('component', {
    read: (relativePath) => {
      if (relativePath === 'ai/changes/CURRENT_CHANGE.json') return { current: 'CR-test' };
      if (relativePath === 'ai/changes/CR-test/impact.json') return { baseRevision: 'base-revision' };
      if (relativePath === 'ai/changes/CR-test/changed-files.json') return { files: [file] };
      throw new Error(`unexpected read: ${relativePath}`);
    },
    readTextFile: () => `- file: \`${rawFile}\`\n  check: \`component\`\n  reason: Internal dot segments must remain visible to validation.\n`,
    validateBaseRevisionFn: () => [],
    collectActualChangedEntries: () => [contentChange(file)]
  });

  assert.equal(state.valid, false);
  assert.ok(state.errors.some((error) => error.includes('exact file path in normalized form')));
});

test('current exceptions reject allow-all old bullets and files outside changed-files', () => {
  const file = 'frontend/src/modules/inventory/InventoryTable.tsx';
  const state = inspectCurrentChangeExceptions('component', {
    read: (relativePath) => {
      if (relativePath === 'ai/changes/CURRENT_CHANGE.json') return { current: 'CR-test' };
      if (relativePath === 'ai/changes/CR-test/impact.json') return { baseRevision: 'base-revision' };
      if (relativePath === 'ai/changes/CR-test/changed-files.json') return { files: [] };
      throw new Error(`unexpected read: ${relativePath}`);
    },
    readTextFile: () => `allow-all: true\n- \`${file}\`\n- file: ${file}\n- file: \`${file}\`\n  check: \`component\`\n  reason: Structured but not actually changed.\n`,
    validateBaseRevisionFn: () => [],
    collectActualChangedEntries: () => []
  });
  assert.ok(state.errors.some((error) => error.includes('allow-all')));
  assert.ok(state.errors.some((error) => error.includes('structured')));
  assert.ok(state.errors.some((error) => error.includes('invalid file field')));
  assert.ok(state.errors.some((error) => error.includes('changed-files.json')));
  assert.equal(isCurrentComponentException(state, file, 'component'), false);
});
