import { fileExists, finish, formatJson, isCli, readJson, writeOrCheck } from '../tools/common.js';
import { validateContextOverrideReview } from '../tools/review-checker.js';

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

function activeImpact() {
  const changeId = currentChangeId();
  return readJsonOrDefault(`ai/changes/${changeId}/impact.json`, {});
}

function featureId(impact) {
  return typeof impact?.feature === 'object' ? impact.feature.id || '' : impact?.feature || '';
}

export function contextOverrideApproved({
  impact = activeImpact(),
  requestedFeature = '',
  changedFiles = null,
  readJsonFile = readJson,
  contextOverrideValidation = {},
  validateContextOverrideReviewFn = validateContextOverrideReview
} = {}) {
  const activeFeature = featureId(impact);
  const override = impact?.contextFeatureOverride;
  const candidate = String(requestedFeature || override?.feature || '').trim();
  if (candidate === activeFeature) {
    return true;
  }
  if (!candidate || candidate !== String(override?.feature || '').trim() || !String(override?.reason || '').trim()) {
    return false;
  }
  return validateContextOverrideReviewFn({
    impact,
    requestedFeature: candidate,
    changedFiles,
    readJsonFile,
    ...contextOverrideValidation
  }).length === 0;
}

export function deriveContextFeature({
  feature = '',
  impact = activeImpact(),
  changedFiles = null,
  readJsonFile = readJson,
  contextOverrideValidation = {},
  validateContextOverrideReviewFn = validateContextOverrideReview
} = {}) {
  const activeFeature = featureId(impact);
  const override = impact?.contextFeatureOverride;
  const requestedFeature = String(feature || override?.feature || '').trim();
  return contextOverrideApproved({
    impact,
    requestedFeature,
    changedFiles,
    readJsonFile,
    contextOverrideValidation,
    validateContextOverrideReviewFn
  })
    ? requestedFeature
    : activeFeature;
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

export function buildMustReadFiles({ feature, changeId }) {
  const generatedFeatureContext = `ai/context/features/${feature}.md`;
  const focusedFeatureContext = fileExists(generatedFeatureContext)
    ? generatedFeatureContext
    : `features/${feature}.md`;
  return [
    { path: 'AGENTS.md', reason: 'Top-level workflow and boundary contract.' },
    { path: 'ai/context/current-context.md', reason: 'Compact current handoff for new Codex windows.' },
    { path: 'memory/HANDOVER.md', reason: 'Latest project handoff and verification boundary.' },
    { path: 'ai/project-profile.json', reason: 'Locked adapter and profile-rule state.' },
    { path: 'package.json', reason: 'Available workflow and check scripts.' },
    { path: 'ai/registry/features.json', reason: 'Feature ownership and active feature context.' },
    { path: 'ai/registry/modules.json', reason: 'Module ownership roots.' },
    { path: focusedFeatureContext, reason: `Focused context for ${feature}.` },
    { path: 'ai/roadmap/phase-gates.json', reason: 'beforeSalesOrder gate state.' },
    { path: 'ai/roadmap/refactor-debt.json', reason: 'Known debt affecting sales-order handoff.' },
    { path: 'ai/roadmap/enhancement-backlog.json', reason: 'Governance backlog and required/deferred evidence.' },
    { path: `ai/changes/${changeId}/impact.json`, reason: 'Current change allowed and forbidden edit roots.' },
    { path: `ai/changes/${changeId}/plan.md`, reason: 'Current change execution plan.' },
    { path: `ai/changes/${changeId}/verification.md`, reason: 'Current change verification evidence.' }
  ];
}

export function buildContext(feature = '') {
  const changeId = currentChangeId();
  const impact = readJsonOrDefault(`ai/changes/${changeId}/impact.json`, {});
  const resolvedFeature = deriveContextFeature({ feature, impact });
  const phaseGates = readJsonOrDefault('ai/roadmap/phase-gates.json', {});
  const profile = readJsonOrDefault('ai/project-profile.json', {});

  return {
    schemaVersion: 1,
    generatedBy: 'scripts/context-build.js',
    generatedAt: 'stable',
    currentFeature: resolvedFeature,
    currentChange: changeId,
    repositoryProfile: {
      adapter: profile.adapter || '',
      locked: Boolean(profile.locked),
      stack: 'RuoYi + Vue3 + Codex Auto Dev OS'
    },
    allowedEditRoots: impact.allowedEditRoots || [],
    forbiddenEditRoots: impact.forbiddenEditRoots || [],
    mustReadFiles: buildMustReadFiles({ feature: resolvedFeature, changeId }),
    mustNotBreak: [
      'Do not edit outside the active impact allowedEditRoots.',
      'Do not mix governance/rule-change work with business runtime implementation.',
      'Do not cross the active impact forbiddenEditRoots.',
      'Do not loosen existing governance gates or profile lock.'
    ],
    roadmapBlockers: roadmapBlockers(),
    phaseGates: phaseGates.gates || {},
    refactorDebt: compactDebt(),
    verificationCommands: Array.isArray(impact.requiredCommands) && impact.requiredCommands.length > 0
      ? impact.requiredCommands
      : [
        'npm run resume',
        'npm run scan:all',
        `npm run context:build -- ${resolvedFeature}`,
        'npm run finalize:change -- --summary "Finalize active change evidence"',
        'npm run check',
        'npm test',
        'git diff --check'
      ],
    nextSteps: [
      'Keep edits inside the active impact boundary.',
      'For complex business implementation, bind impact.reviewId to an approved review package.',
      'Complete the active phase gates before entering their protected implementation scope.'
    ]
  };
}

export function buildMarkdown(context) {
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
    '## Planned Verification Commands',
    '',
    ...context.verificationCommands.map((item) => `- \`${item}\``),
    '',
    '## Next Steps',
    '',
    ...context.nextSteps.map((item) => `- ${item}`),
    ''
  ].join('\n');
}

export function buildCurrentContext({ feature = '', checkMode = false } = {}) {
  const errors = [];
  const impact = activeImpact();
  const activeFeature = featureId(impact);
  const requestedFeature = String(feature || '').trim();
  const validOverride = contextOverrideApproved({ impact, requestedFeature });
  if (requestedFeature && requestedFeature !== activeFeature && !validOverride) {
    return [`Requested context feature ${requestedFeature} does not match active impact feature ${activeFeature}; add impact.contextFeatureOverride with a reason to use a focused context.`];
  }
  const context = buildContext(feature);
  writeOrCheck('ai/context/current-context.json', formatJson(context), checkMode, errors);
  writeOrCheck('ai/context/current-context.md', buildMarkdown(context), checkMode, errors);
  return errors;
}

function parseArgs(args) {
  return {
    feature: args.find((arg) => !arg.startsWith('--')) || '',
    checkMode: args.includes('--check')
  };
}

if (isCli(import.meta.url)) {
  finish('context:build', buildCurrentContext(parseArgs(process.argv.slice(2))));
}
