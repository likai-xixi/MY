import { finish, formatJson, isCli, readJson, writeOrCheck } from '../tools/common.js';

function currentChangeId() {
  try {
    return readJson('ai/changes/CURRENT_CHANGE.json').current || '';
  } catch {
    return '';
  }
}

function readJsonOrDefault(file, fallback) {
  try {
    return readJson(file);
  } catch {
    return fallback;
  }
}

function compactDebt() {
  const data = readJsonOrDefault('ai/roadmap/refactor-debt.json', { items: [] });
  return (data.items || []).map((item) => ({
    id: item.id,
    title: item.title,
    status: item.status,
    guard: item.guard
  }));
}

function roadmapBlockers() {
  const data = readJsonOrDefault('ai/roadmap/enhancement-backlog.json', { items: [] });
  return (data.items || [])
    .filter((item) => (item.requiredBefore || []).includes('beforeSalesOrder'))
    .filter((item) => !['complete', 'completed', 'done', 'passed', 'verified'].includes(item.status))
    .map((item) => ({
      id: item.id,
      status: item.status,
      reason: item.reason,
      futureAction: item.futureAction
    }));
}

function mustReadFiles({ feature, changeId }) {
  return [
    { path: 'AGENTS.md', reason: 'Top-level workflow and boundary contract.' },
    { path: 'ai/context/current-context.md', reason: 'Compact current handoff for new Codex windows.' },
    { path: 'memory/HANDOVER.md', reason: 'Latest project handoff and verification boundary.' },
    { path: 'ai/project-profile.json', reason: 'Locked adapter and profile-rule state.' },
    { path: 'package.json', reason: 'Available workflow and check scripts.' },
    { path: 'ai/registry/features.json', reason: 'Feature ownership and active customer context.' },
    { path: 'ai/registry/modules.json', reason: 'Module ownership roots.' },
    { path: `ai/context/features/${feature}.md`, reason: `Focused context for ${feature}.` },
    { path: 'ai/roadmap/phase-gates.json', reason: 'beforeSalesOrder gate state.' },
    { path: 'ai/roadmap/refactor-debt.json', reason: 'Known debt affecting sales-order handoff.' },
    { path: 'ai/roadmap/enhancement-backlog.json', reason: 'Governance backlog and required/deferred evidence.' },
    { path: `ai/changes/${changeId}/impact.json`, reason: 'Current change allowed and forbidden edit roots.' },
    { path: `ai/changes/${changeId}/plan.md`, reason: 'Current change execution plan.' },
    { path: `ai/changes/${changeId}/verification.md`, reason: 'Current change verification evidence.' }
  ];
}

function buildContext(feature) {
  const changeId = currentChangeId();
  const impact = readJsonOrDefault(`ai/changes/${changeId}/impact.json`, {});
  const phaseGates = readJsonOrDefault('ai/roadmap/phase-gates.json', {});
  const profile = readJsonOrDefault('ai/project-profile.json', {});

  return {
    schemaVersion: 1,
    generatedBy: 'scripts/context-build.js',
    generatedAt: 'stable',
    currentFeature: feature,
    currentChange: changeId,
    repositoryProfile: {
      adapter: profile.adapter || '',
      locked: Boolean(profile.locked),
      stack: 'RuoYi + Vue3 + Codex Auto Dev OS'
    },
    allowedEditRoots: impact.allowedEditRoots || [],
    forbiddenEditRoots: impact.forbiddenEditRoots || [],
    mustReadFiles: mustReadFiles({ feature, changeId }),
    mustNotBreak: [
      'Do not implement sales-order in this governance change.',
      'Do not modify customer-management business code in governance/rule-change work.',
      'Do not change database business table structure in this governance change.',
      'Do not loosen existing governance gates or profile lock.'
    ],
    roadmapBlockers: roadmapBlockers(),
    phaseGates: phaseGates.gates || {},
    refactorDebt: compactDebt(),
    verificationCommands: [
      'npm run resume',
      'npm run scan:all',
      `npm run context:build -- ${feature}`,
      'npm run finalize:change -- --summary "新增销售订单前治理接手机制"',
      'npm run check',
      'npm test',
      'git diff --check'
    ],
    nextSteps: [
      'Keep this change governance-only.',
      'Before sales-order implementation, run review:feature and require decision.md to explicitly contain Allow Implementation.',
      'Complete snapshot, state-machine, and fund-boundary contracts before creating sales-order code or tables.'
    ]
  };
}

function buildMarkdown(context) {
  const blockers = context.roadmapBlockers.map((item) => `- ${item.id}: ${item.status} - ${item.futureAction}`);
  const debts = context.refactorDebt.map((item) => `- ${item.id}: ${item.status} - ${item.guard}`);
  const mustRead = context.mustReadFiles.map((item) => `- \`${item.path}\` - ${item.reason}`);
  const required = context.phaseGates.beforeSalesOrder?.required || [];
  const deferred = context.phaseGates.beforeSalesOrder?.deferred || [];
  return [
    '# Current Context',
    '',
    `Current feature: \`${context.currentFeature}\``,
    `Current change: \`${context.currentChange}\``,
    `Repository: ${context.repositoryProfile.stack}`,
    `Profile: adapter \`${context.repositoryProfile.adapter}\`, locked \`${context.repositoryProfile.locked}\``,
    '',
    '## Allowed Edit Roots',
    '',
    ...context.allowedEditRoots.map((item) => `- \`${item}\``),
    '',
    '## Forbidden Edit Roots',
    '',
    ...context.forbiddenEditRoots.map((item) => `- \`${item}\``),
    '',
    '## Must Read Files',
    '',
    ...mustRead,
    '',
    '## Must Not Break',
    '',
    ...context.mustNotBreak.map((item) => `- ${item}`),
    '',
    '## Roadmap Blockers',
    '',
    ...(blockers.length ? blockers : ['- none']),
    '',
    '## beforeSalesOrder Gate',
    '',
    `Status: \`${context.phaseGates.beforeSalesOrder?.status || 'unknown'}\``,
    '',
    'Required:',
    ...required.map((item) => `- ${item}`),
    '',
    'Deferred:',
    ...deferred.map((item) => `- ${item.id}: ${item.reason}`),
    '',
    '## Refactor Debt Summary',
    '',
    ...debts,
    '',
    '## Verification Commands',
    '',
    ...context.verificationCommands.map((item) => `- \`${item}\``),
    '',
    '## Next Steps',
    '',
    ...context.nextSteps.map((item) => `- ${item}`),
    ''
  ].join('\n');
}

export function buildCurrentContext({ feature = 'customer', checkMode = false } = {}) {
  const errors = [];
  const context = buildContext(feature);
  writeOrCheck('ai/context/current-context.json', formatJson(context), checkMode, errors);
  writeOrCheck('ai/context/current-context.md', buildMarkdown(context), checkMode, errors);
  return errors;
}

function parseArgs(args) {
  return {
    feature: args.find((arg) => !arg.startsWith('--')) || 'customer',
    checkMode: args.includes('--check')
  };
}

if (isCli(import.meta.url)) {
  finish('context:build', buildCurrentContext(parseArgs(process.argv.slice(2))));
}
