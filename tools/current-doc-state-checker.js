import {
  currentDocTargets,
  emptyResult,
  issue,
  parseRootArg,
  pathExists,
  printIssues,
  readText,
  sectionLineRecords
} from './governance-checker-utils.js';

const VOLATILE_PHRASES = [
  'no commit or push has been made',
  'awaiting commit',
  'ready to push',
  'previous pushed commit',
  '未推送',
  '准备推送',
  '等待推送',
  '尚未提交',
  '尚未推送'
];

const IGNORE_WITH_REASON = /<!--\s*current-doc-state-ignore-line:\s*[^>]+-->/i;
const IGNORE_WITHOUT_REASON = /<!--\s*current-doc-state-ignore-line\s*-->/i;

function matchedPhrase(line) {
  const lower = line.toLowerCase();
  return VOLATILE_PHRASES.find((phrase) => {
    if (/^[\x00-\x7F]+$/.test(phrase)) {
      return lower.includes(phrase.toLowerCase());
    }
    return line.includes(phrase);
  }) || '';
}

export function validateCurrentDocState({ root = process.cwd() } = {}) {
  const result = emptyResult();
  for (const target of currentDocTargets(root)) {
    if (!pathExists(root, target.file)) {
      continue;
    }
    const text = readText(root, target.file);
    for (const record of sectionLineRecords(text, target.headings)) {
      if (IGNORE_WITHOUT_REASON.test(record.text)) {
        result.failures.push(issue({
          file: target.file,
          line: record.line,
          code: 'ignore-reason-required',
          message: 'current-doc-state ignore comments must include a reason'
        }));
      }
      const phrase = matchedPhrase(record.text);
      if (!phrase || IGNORE_WITH_REASON.test(record.text)) {
        continue;
      }
      result.failures.push(issue({
        file: target.file,
        line: record.line,
        code: 'volatile-current-state',
        message: `volatile Git/push state phrase found: ${phrase}`,
        detail: 'write stable handoff text and rely on git/CI for current state'
      }));
    }
  }
  return result;
}

if (process.argv[1] && process.argv[1].endsWith('current-doc-state-checker.js')) {
  printIssues('check:current-doc-state', validateCurrentDocState({ root: parseRootArg() }));
}
