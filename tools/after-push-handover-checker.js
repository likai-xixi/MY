import {
  currentDocTargets,
  issue,
  parseRootArg,
  pathExists,
  readText,
  runGit,
  sectionLineRecords,
  sortIssues
} from './governance-checker-utils.js';
import { validateCurrentDocState } from './current-doc-state-checker.js';

function structuredPushedCommitIssues(root, head) {
  const failures = [];
  for (const target of currentDocTargets(root)) {
    if (!pathExists(root, target.file)) {
      continue;
    }
    const text = readText(root, target.file);
    for (const record of sectionLineRecords(text, target.headings)) {
      const match = record.text.match(/\bpushedCommit\s*[:=]\s*`?([a-f0-9]{7,40})`?/i);
      if (!match) {
        continue;
      }
      const declared = match[1].toLowerCase();
      const normalizedHead = head.toLowerCase();
      if (declared !== normalizedHead && !normalizedHead.startsWith(declared) && !declared.includes(normalizedHead)) {
        failures.push(issue({
          file: target.file,
          line: record.line,
          code: 'pushed-commit-mismatch',
          message: `structured pushedCommit ${declared} does not match HEAD ${head}`
        }));
      }
    }
  }
  return failures;
}

export function validateAfterPushHandover({ root = process.cwd() } = {}) {
  const failures = [];
  const inconclusive = [];
  const docState = validateCurrentDocState({ root });
  failures.push(...docState.failures);

  const status = runGit(root, ['status', '--short']);
  if (status.status !== 0) {
    inconclusive.push(issue({ file: '.', code: 'git-status-unavailable', message: status.stderr || 'git status failed' }));
  } else if (status.stdout.trim()) {
    inconclusive.push(issue({ file: '.', code: 'worktree-not-clean', message: 'working tree is not clean; after-push check is inconclusive in development state' }));
  }

  const head = runGit(root, ['rev-parse', 'HEAD']);
  if (head.status !== 0 || !head.stdout) {
    inconclusive.push(issue({ file: '.', code: 'head-unavailable', message: head.stderr || 'could not read HEAD' }));
  }

  const upstream = runGit(root, ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']);
  if (upstream.status !== 0 || !upstream.stdout) {
    inconclusive.push(issue({ file: '.', code: 'upstream-missing', message: 'current branch has no upstream' }));
  } else if (head.stdout) {
    const contained = runGit(root, ['merge-base', '--is-ancestor', 'HEAD', upstream.stdout]);
    if (contained.status !== 0) {
      failures.push(issue({
        file: '.',
        code: 'head-not-contained-by-upstream',
        message: `HEAD is not contained by upstream ${upstream.stdout}`
      }));
    }
  }

  if (head.stdout) {
    failures.push(...structuredPushedCommitIssues(root, head.stdout));
  }

  if (failures.length > 0) {
    return { state: 'fail', failures, inconclusive };
  }
  if (inconclusive.length > 0) {
    return { state: 'inconclusive', failures, inconclusive };
  }
  return { state: 'pass', failures, inconclusive };
}

function printAfterPush(result) {
  const inconclusive = sortIssues(result.inconclusive || []);
  const failures = sortIssues(result.failures || []);
  console.log(`check:after-push: ${result.state}`);
  for (const item of failures) {
    const location = item.line ? `${item.file}:${item.line}` : item.file;
    console.error(`- ${location} [${item.code}] ${item.message}`);
  }
  for (const item of inconclusive) {
    const location = item.line ? `${item.file}:${item.line}` : item.file;
    console.log(`- ${location} [${item.code}] ${item.message}`);
  }
  if (result.state === 'fail') {
    process.exitCode = 1;
  } else if (result.state === 'inconclusive') {
    process.exitCode = 2;
  }
}

if (process.argv[1] && process.argv[1].endsWith('after-push-handover-checker.js')) {
  printAfterPush(validateAfterPushHandover({ root: parseRootArg() }));
}
