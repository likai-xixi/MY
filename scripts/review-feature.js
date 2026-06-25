import fs from 'node:fs';
import path from 'node:path';
import { finish, formatJson, isCli, projectPath, readText } from '../tools/common.js';
import { REQUIRED_REVIEW_FILES } from '../tools/review-checker.js';

function timestamp() {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function slug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'review';
}

function detectMode(request) {
  if (request.startsWith('功能预审：') || request.startsWith('功能预审:')) {
    return 'pre-review';
  }
  if (request.startsWith('功能讨论：') || request.startsWith('功能讨论:')) {
    return 'discussion';
  }
  return 'discussion';
}

function writeFile(file, content) {
  fs.mkdirSync(path.dirname(projectPath(file)), { recursive: true });
  fs.writeFileSync(projectPath(file), content);
}

function currentContextText() {
  try {
    return readText('ai/context/current-context.md');
  } catch {
    return 'Current context has not been generated yet. Run npm run context:build -- customer before implementation planning.';
  }
}

function fileMap({ id, request, mode, feature }) {
  const createdAt = new Date().toISOString();
  const baseReview = (title, body) => [
    `# ${title}`,
    '',
    body,
    '',
    '## Minimum Review',
    '',
    '- Scope stays outside implementation until an explicit approval decision is recorded.',
    '- Risks, dependencies, and required evidence must be filled before coding.',
    ''
  ].join('\n');

  const data = {
    id,
    request,
    mode,
    feature,
    createdAt,
    status: 'pending-decision',
    decision: {
      allowImplementation: false,
      reason: 'Implementation remains blocked until the decision document is intentionally updated by reviewers.'
    },
    requiredFiles: REQUIRED_REVIEW_FILES
  };

  return {
    'request.md': `# Request\n\n${request}\n`,
    'context.md': ['# Context', '', currentContextText(), ''].join('\n'),
    'product-review.md': baseReview('Product Review', 'Clarify user value, MVP boundary, non-goals, and success criteria.'),
    'architecture-review.md': baseReview('Architecture Review', 'Clarify module boundaries, contracts, data ownership, and sequencing.'),
    'backend-review.md': baseReview('Backend Review', 'Clarify API, service, domain, mapper, SQL, permission, and migration risks.'),
    'frontend-review.md': baseReview('Frontend Review', 'Clarify screens, state, components, permissions, and smoke-test needs.'),
    'qa-review.md': baseReview('QA Review', 'Clarify regression risk, required verification, blockers, and release evidence.'),
    'risk-register.md': [
      '# Risk Register',
      '',
      '| Risk | Impact | Mitigation | Owner |',
      '| --- | --- | --- | --- |',
      '| Implementation starts before gate approval | Scope drift | Keep decision blocked until reviewers explicitly approve implementation | Codex |',
      ''
    ].join('\n'),
    'decision.md': [
      '# Decision',
      '',
      'Decision: Implementation blocked.',
      '',
      'Reason: This review record has been created for discussion/pre-review only. A later reviewer must intentionally change this decision before complex add/update work can proceed.',
      '',
      'Required next evidence:',
      '',
      '- Product scope and non-goals.',
      '- Architecture and contract boundary.',
      '- Backend and frontend impact list.',
      '- QA verification plan.',
      ''
    ].join('\n'),
    'review.json': formatJson(data)
  };
}

export function createReview({ request, feature = 'customer' }) {
  const errors = [];
  if (!request || !request.trim()) {
    return { id: '', errors: ['review request is required.'] };
  }
  const mode = detectMode(request.trim());
  const id = `RV-${timestamp()}-${slug(request)}`;
  const dir = `ai/reviews/${id}`;
  const files = fileMap({ id, request: request.trim(), mode, feature });
  for (const [name, content] of Object.entries(files)) {
    writeFile(`${dir}/${name}`, content);
  }
  return { id, errors };
}

function parseArgs(args) {
  const featureIndex = args.indexOf('--feature');
  const feature = featureIndex === -1 ? 'customer' : args[featureIndex + 1] || 'customer';
  const request = args.filter((arg, index) => {
    if (arg === '--feature') {
      return false;
    }
    if (featureIndex !== -1 && index === featureIndex + 1) {
      return false;
    }
    return true;
  }).join(' ');
  return { request, feature };
}

if (isCli(import.meta.url)) {
  const { id, errors } = createReview(parseArgs(process.argv.slice(2)));
  if (id) {
    console.log(`Created ai/reviews/${id}`);
  }
  finish('review:feature', errors);
}
