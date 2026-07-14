import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkAllowedEditRoots,
  checkEditRootPolicy,
  checkForbiddenEditRoots,
  gitChangedEntries,
  gitChangedFiles,
  isAllowedByRoot,
  validateBaseRevision,
  validateRevisionAncestry
} from '../tools/diff-checker.js';

test('allowed root accepts exact file and children', () => {
  assert.equal(isAllowedByRoot('backend/modules/customer/service/a.java', 'backend/modules/customer'), true);
  assert.equal(isAllowedByRoot('memory/HANDOVER.md', 'memory'), true);
  assert.equal(isAllowedByRoot('package.json', 'package.json'), true);
  assert.equal(isAllowedByRoot('backend/modules/order/service/a.java', 'backend/modules/customer'), false);
});

test('range gate rejects files outside impact roots', () => {
  const errors = checkAllowedEditRoots({
    changedFiles: ['backend/modules/customer/service/a.java', 'frontend/src/modules/order/index.ts'],
    impact: { allowedEditRoots: ['backend/modules/customer'] }
  });
  assert.deepEqual(errors, ['frontend/src/modules/order/index.ts is outside impact.allowedEditRoots.']);
});

test('range gate rejects forbidden roots before allowed roots can mask them', () => {
  const impact = {
    allowedEditRoots: ['ruoyi-ui/src'],
    forbiddenEditRoots: ['ruoyi-ui/src/router']
  };

  assert.deepEqual(checkForbiddenEditRoots({
    changedFiles: ['ruoyi-ui/src/router/index.js'],
    impact
  }), ['ruoyi-ui/src/router/index.js is inside impact.forbiddenEditRoots entry ruoyi-ui/src/router.']);

  assert.deepEqual(checkEditRootPolicy({
    changedFiles: ['ruoyi-ui/src/router/index.js'],
    impact
  }), ['impact.allowedEditRoots entry ruoyi-ui/src overlaps impact.forbiddenEditRoots entry ruoyi-ui/src/router.']);
});

test('range gate rejects overlapping allowed and forbidden roots', () => {
  const errors = checkEditRootPolicy({
    changedFiles: ['tools/diff-checker.js'],
    impact: {
      allowedEditRoots: ['ruoyi-ui/src/router'],
      forbiddenEditRoots: ['ruoyi-ui/src/router/index.js']
    }
  });

  assert.deepEqual(errors, [
    'impact.allowedEditRoots entry ruoyi-ui/src/router overlaps impact.forbiddenEditRoots entry ruoyi-ui/src/router/index.js.'
  ]);
});

test('Git change collection preserves every path reported by Git even when a source package uses a generated-looking segment', () => {
  const hiddenSource = 'ruoyi-business/src/main/java/com/ruoyi/business/customer/build/Hidden.java';
  const files = gitChangedFiles({
    baseRevision: 'a'.repeat(40),
    gitRepository: true,
    runGitCommand: (args) => args[0] === 'ls-files' ? `${hiddenSource}\0` : '',
    readWorktreeMode: () => '100644',
    hashWorktreeFile: () => '1'.repeat(40)
  });

  assert.deepEqual(files, [hiddenSource]);
});

test('Git change collection disables rename collapsing so both old and new paths remain governed', () => {
  const calls = [];
  const files = gitChangedFiles({
    baseRevision: 'a'.repeat(40),
    gitRepository: true,
    runGitCommand: (args) => {
      calls.push(args);
      if (args[0] !== 'diff') {
        return '';
      }
      if (!args.includes('--no-renames')) return '';
      return [
        `:100644 000000 ${'1'.repeat(40)} ${'0'.repeat(40)} D\0ruoyi-business/src/main/java/old/Owned.java\0`,
        `:000000 100644 ${'0'.repeat(40)} ${'2'.repeat(40)} A\0tools/Owned.java\0`
      ].join('');
    }
  });

  assert.deepEqual(files, [
    'ruoyi-business/src/main/java/old/Owned.java',
    'tools/Owned.java'
  ]);
  assert.equal(calls.filter((args) => args[0] === 'diff').every((args) => args.includes('--no-renames')), true);
});

test('Git change collection preserves a staged candidate when the worktree restores the base blob', () => {
  const file = 'tools/staged-policy-bypass.js';
  const baseOid = '1'.repeat(40);
  const stagedOid = '2'.repeat(40);
  const zero = '0'.repeat(40);
  const calls = [];
  const entries = gitChangedEntries({
    baseRevision: 'a'.repeat(40),
    gitRepository: true,
    runGitCommand: (args) => {
      calls.push(args);
      if (args[0] === 'ls-files') return '';
      if (args[0] !== 'diff') throw new Error(`unexpected Git call: ${args.join(' ')}`);
      if (args.includes('--cached')) {
        return `:100644 100644 ${baseOid} ${stagedOid} M\0${file}\0`;
      }
      return `:100644 100644 ${stagedOid} ${zero} M\0${file}\0`;
    },
    hashWorktreeFile: () => baseOid
  });

  assert.equal(entries.length, 1);
  assert.equal(entries[0].path, file);
  assert.equal(entries[0].candidate.oldOid, baseOid);
  assert.equal(entries[0].candidate.newOid, stagedOid);
  assert.equal(entries[0].candidate.contentChanged, true);
  assert.equal(entries[0].layers.length, 2);
  assert.ok(calls.some((args) => args[0] === 'diff' && args.includes('--cached')));
  assert.ok(calls.some((args) => args[0] === 'diff' && !args.includes('--cached') && !args.includes('a'.repeat(40))));
});

test('Git change collection parses raw mode evidence without treating headers as paths', () => {
  const oldOid = '1'.repeat(40);
  const newOid = '2'.repeat(40);
  const file = 'tools/linked-checker.js';
  const raw = `:100644 120000 ${oldOid} ${newOid} T\0${file}\0`;
  const files = gitChangedFiles({
    baseRevision: 'a'.repeat(40),
    gitRepository: true,
    runGitCommand: (args) => {
      if (args[0] === 'diff') return raw;
      if (args[0] === 'ls-files') return '';
      throw new Error(`unexpected Git call: ${args.join(' ')}`);
    }
  });

  assert.deepEqual(files, [file]);
});

test('range gate rejects a symlink inside an allowed root instead of following path text only', () => {
  const file = 'tools/linked-checker.js';
  const errors = checkEditRootPolicy({
    changedFiles: [file],
    changedEntries: [{
      path: file,
      oldMode: '000000',
      newMode: '120000',
      oldOid: '0'.repeat(40),
      newOid: '1'.repeat(40),
      status: 'A',
      contentChanged: true
    }],
    impact: {
      allowedEditRoots: ['tools'],
      forbiddenEditRoots: ['ruoyi-ui/src/views']
    }
  });

  assert.ok(errors.some((error) => error.includes('prohibited Git mode 120000')));
});

test('range gate inspects worktree layers even when the staged candidate is a regular blob', () => {
  const file = 'tools/layered-link.js';
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
  const worktree = {
    path: file,
    oldMode: '100644',
    newMode: '120000',
    oldOid: '2'.repeat(40),
    newOid: '0'.repeat(40),
    status: 'T',
    contentChanged: false,
    source: 'worktree'
  };
  const errors = checkEditRootPolicy({
    changedEntries: [{ ...candidate, candidate, layers: [candidate, worktree] }],
    impact: { allowedEditRoots: ['tools'], forbiddenEditRoots: [] }
  });

  assert.ok(errors.some((error) => error.includes('prohibited Git mode 120000')));
});

test('range gate rejects unresolved or broken raw Git statuses', () => {
  const file = 'tools/conflicted-checker.js';
  for (const status of ['U', 'X', 'B']) {
    const errors = checkEditRootPolicy({
      changedFiles: [file],
      changedEntries: [{
        path: file,
        oldMode: '100644',
        newMode: '100644',
        oldOid: '1'.repeat(40),
        newOid: '2'.repeat(40),
        status,
        contentChanged: true
      }],
      impact: { allowedEditRoots: ['tools'], forbiddenEditRoots: [] }
    });

    assert.ok(errors.some((error) => error.includes('unsupported raw Git status')), status);
  }
});

test('range roots reject empty absolute and non-canonical repository paths', () => {
  const dangerousRoots = [
    '',
    '/',
    './',
    '/tools',
    'C:/repo/tools',
    'C:\\repo\\tools',
    '//server/share/tools',
    '..',
    '../tools',
    'tools/../scripts',
    'tools/./scripts',
    'tools//scripts',
    'tools/',
    'tools\\scripts',
    ' tools'
  ];

  for (const root of dangerousRoots) {
    assert.equal(isAllowedByRoot('tools/diff-checker.js', root), false, `${JSON.stringify(root)} must not allow a file`);

    const allowedErrors = checkEditRootPolicy({
      changedFiles: ['tools/diff-checker.js'],
      impact: { allowedEditRoots: [root], forbiddenEditRoots: [] }
    });
    assert.ok(allowedErrors.some((error) => error.includes('canonical repository-relative path')), `${JSON.stringify(root)} must be rejected as an allowed root`);

    const forbiddenErrors = checkEditRootPolicy({
      changedFiles: ['tools/diff-checker.js'],
      impact: { allowedEditRoots: ['tools'], forbiddenEditRoots: [root] }
    });
    assert.ok(forbiddenErrors.some((error) => error.includes('canonical repository-relative path')), `${JSON.stringify(root)} must be rejected as a forbidden root`);
  }

  assert.equal(isAllowedByRoot('tools/diff-checker.js', 'tools'), true);
  assert.equal(isAllowedByRoot('.github/workflows/ci.yml', '.github/workflows'), true);
  assert.deepEqual(checkEditRootPolicy({
    changedFiles: ['tools/diff-checker.js'],
    impact: { allowedEditRoots: ['tools'], forbiddenEditRoots: ['ruoyi-business/src/main/java'] }
  }), []);
});

test('revision binding rejects moving refs and accepts only fixed full commit OIDs', () => {
  const base = 'a'.repeat(40);
  const descendant = 'b'.repeat(40);
  const validGit = (args) => {
    if (args[0] === 'rev-parse') {
      return { status: 0, stdout: base };
    }
    return { status: 0, stdout: '' };
  };

  assert.deepEqual(validateBaseRevision(base, { runGitResultFn: validGit }), []);
  assert.deepEqual(validateRevisionAncestry(base, descendant, {
    runGitResultFn: () => ({ status: 0, stdout: '' })
  }), []);

  for (const movingRef of ['HEAD', 'main', 'release/v1', 'v1.0.0']) {
    assert.ok(validateBaseRevision(movingRef, { runGitResultFn: validGit })
      .some((error) => error.includes('full fixed 40-character hexadecimal commit OID')));
    assert.ok(validateRevisionAncestry(movingRef, descendant, {
      runGitResultFn: () => ({ status: 0, stdout: '' })
    }).some((error) => error.includes('full fixed 40-character hexadecimal commit OID')));
    assert.ok(validateRevisionAncestry(base, movingRef, {
      runGitResultFn: () => ({ status: 0, stdout: '' })
    }).some((error) => error.includes('full fixed 40-character hexadecimal commit OID')));
  }

  const annotatedTagObject = 'c'.repeat(40);
  assert.ok(validateBaseRevision(annotatedTagObject, {
    runGitResultFn: (args) => args[0] === 'rev-parse'
      ? { status: 0, stdout: base }
      : { status: 0, stdout: '' }
  }).some((error) => error.includes('not a valid Git commit OID')));
});
