import { ensure, fileExists, finish, hasHeading, isCli, readText, writeOrCheck } from '../tools/common.js';

export const REQUIRED_HANDOVER_HEADINGS = [
  '## Summary',
  '## Impact',
  '## Changed Files',
  '## Commands',
  '## Verification',
  '## Risks',
  '## Next Actions'
];

export function validateHandover({ exists = fileExists, read = readText } = {}) {
  const errors = [];
  if (!exists('memory/HANDOVER.md')) {
    return ['memory/HANDOVER.md is missing. Run npm run handover to create a template.'];
  }
  const text = read('memory/HANDOVER.md');
  for (const heading of REQUIRED_HANDOVER_HEADINGS) {
    ensure(hasHeading(text, heading), `memory/HANDOVER.md must include ${heading}.`, errors);
  }
  ensure(text.includes('npm run check'), 'memory/HANDOVER.md must mention the main verification command.', errors);
  return errors;
}

export function handoverTemplate() {
  return [
    '# Handover',
    '',
    '## Summary',
    '',
    'Describe what changed.',
    '',
    '## Impact',
    '',
    'Describe the affected code, data, registry, graph, memory, and runtime surfaces.',
    '',
    '## Changed Files',
    '',
    '- Update this list.',
    '',
    '## Commands',
    '',
    '- `npm run check`',
    '',
    '## Verification',
    '',
    'Describe passing and failing verification.',
    '',
    '## Risks',
    '',
    'List residual risks.',
    '',
    '## Next Actions',
    '',
    'List the next concrete actions.',
    ''
  ].join('\n');
}

export function runGenerateHandover({ checkMode = false } = {}) {
  const errors = validateHandover();
  if (!checkMode && errors.length > 0) {
    errors.length = 0;
    writeOrCheck('memory/HANDOVER.md', handoverTemplate(), false, errors);
  }
  return checkMode ? errors : [];
}

if (isCli(import.meta.url)) {
  finish('handover', runGenerateHandover({ checkMode: process.argv.includes('--check') }));
}
