import { ensure, fileExists, finish, isCli, listFiles, normalizeNewlines, readText } from './common.js';

const BANNED_SNIPPETS = [
  ['Rules', 'enforced.'].join(' '),
  ['steps:', '      - run: echo'].join('\n'),
  ['console', ".log('rules')"].join(''),
  ['console', '.log("rules")'].join('')
];

export function lintCodexScaffold() {
  const errors = [];

  ensure(fileExists('.github/workflows/ci.yml'), 'CI workflow must live in .github/workflows/ci.yml.', errors);

  const files = [
    'README.md',
    'AGENTS.md',
    ...listFiles('agents', (file) => file.endsWith('.md')),
    ...listFiles('tools', (file) => file.endsWith('.js')),
    ...listFiles('scripts', (file) => file.endsWith('.js')),
    ...listFiles('.github/workflows', (file) => file.endsWith('.yml'))
  ];

  for (const file of files) {
    const text = normalizeNewlines(readText(file));
    for (const snippet of BANNED_SNIPPETS) {
      ensure(!text.includes(normalizeNewlines(snippet)), `${file} contains banned placeholder snippet: ${snippet}`, errors);
    }
  }

  const ci = normalizeNewlines(readText('.github/workflows/ci.yml'));
  ensure(ci.includes('npm run check'), 'CI must run npm run check.', errors);
  ensure(ci.includes('permissions:\n  contents: read'), 'CI must minimize token permissions.', errors);
  ensure(ci.includes('timeout-minutes:'), 'CI job must define a timeout.', errors);
  ensure(/actions\/checkout@[a-f0-9]{40}/.test(ci), 'CI must pin actions/checkout to a commit SHA.', errors);
  ensure(/actions\/setup-node@[a-f0-9]{40}/.test(ci), 'CI must pin actions/setup-node to a commit SHA.', errors);

  return errors;
}

if (isCli(import.meta.url)) {
  finish('lint:codex', lintCodexScaffold());
}
