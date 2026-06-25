import {
  emptyResult,
  issue,
  parseRootArg,
  pathExists,
  printIssues,
  readJson,
  readText
} from './governance-checker-utils.js';

const POLICY_FILE = 'ai/rules/pre-release-policy.json';

function requirePolicyValue(result, policy, path, expected) {
  const keys = path.split('.');
  let value = policy;
  for (const key of keys) {
    value = value?.[key];
  }
  if (value !== expected) {
    result.failures.push(issue({
      file: POLICY_FILE,
      code: 'pre-release-policy-value',
      message: `${path} must be ${JSON.stringify(expected)}.`
    }));
  }
}

function requireDocText(result, root, file, patterns) {
  if (!pathExists(root, file)) {
    result.failures.push(issue({
      file,
      code: 'pre-release-policy-doc-missing',
      message: 'pre-release policy documentation file is missing.'
    }));
    return;
  }
  const text = readText(root, file);
  for (const [code, pattern, message] of patterns) {
    if (!pattern.test(text)) {
      result.failures.push(issue({ file, code, message }));
    }
  }
}

export function validatePreReleasePolicy({ root = process.cwd() } = {}) {
  const result = emptyResult();
  if (!pathExists(root, POLICY_FILE)) {
    result.failures.push(issue({
      file: POLICY_FILE,
      code: 'pre-release-policy-missing',
      message: 'pre-release breaking-change policy file is missing.'
    }));
    return result;
  }

  let policy;
  try {
    policy = readJson(root, POLICY_FILE);
  } catch (error) {
    result.failures.push(issue({
      file: POLICY_FILE,
      code: 'pre-release-policy-invalid-json',
      message: 'pre-release policy must be valid JSON.',
      detail: error.message
    }));
    return result;
  }

  requirePolicyValue(result, policy, 'schemaVersion', 1);
  requirePolicyValue(result, policy, 'name', 'pre-release-policy');
  requirePolicyValue(result, policy, 'releaseStage', 'pre-release');
  requirePolicyValue(result, policy, 'defaultCompatibilityMode', 'breaking-change');
  requirePolicyValue(result, policy, 'rules.doNotAddLegacyCompatibilityByDefault', true);
  requirePolicyValue(result, policy, 'rules.requireExplicitUserApprovalForCompatibility', true);
  requirePolicyValue(result, policy, 'rules.preferReplacingOldContracts', true);
  requirePolicyValue(result, policy, 'rules.removeStaleCodeWithinApprovedScope', true);
  requirePolicyValue(result, policy, 'rules.allowDevelopmentDataReset', true);
  requirePolicyValue(result, policy, 'rules.requireProductionMigrationPlanForReleasedData', true);
  requirePolicyValue(result, policy, 'rules.requireCrossModuleImpactExpansion', true);

  requireDocText(result, root, 'AGENTS.md', [
    ['pre-release-agents-heading', /Pre-Release Breaking Change Policy/i, 'AGENTS must document the pre-release breaking-change policy.'],
    ['pre-release-agents-no-compat', /Do not add old-code or old-data compatibility by default/i, 'AGENTS must forbid default legacy compatibility.'],
    ['pre-release-agents-reset', /development data may be reset or rebuilt/i, 'AGENTS must allow documented development data reset.'],
    ['pre-release-agents-approval', /Compatibility layers require explicit user approval/i, 'AGENTS must require explicit approval for compatibility layers.']
  ]);

  requireDocText(result, root, 'docs/chat-driven-codex-workflow.md', [
    ['pre-release-workflow-heading', /Pre-release breaking-change mode/i, 'Workflow doc must describe pre-release breaking-change mode.'],
    ['pre-release-workflow-breaking', /default is breaking/i, 'Workflow doc must state that pre-release default is breaking.'],
    ['pre-release-workflow-rebuild', /rebuild or reset development data/i, 'Workflow doc must describe development data rebuild/reset.']
  ]);

  return result;
}

if (process.argv[1] && process.argv[1].endsWith('pre-release-policy-checker.js')) {
  printIssues('check:pre-release-policy', validatePreReleasePolicy({ root: parseRootArg() }));
}
