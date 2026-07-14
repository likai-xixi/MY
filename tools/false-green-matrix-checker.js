import {
  fileExists,
  finish,
  isCli,
  readJson,
  readText
} from './common.js';

export const MATRIX_PATH = 'ai/governance/false-green-regression-matrix.json';

const LEGACY_VERIFICATION_CHANGE = 'CR-20260627T154818Z-r-09a-4-anti-false-green-minimum-closure';
const CURRENT_VERIFICATION_CHANGE = 'CR-20260714T034246Z-repository-wide-governance-gate-evidence-hardeni';

function coverageContract(
  gate,
  tests,
  checkerFiles,
  verifiedBy = LEGACY_VERIFICATION_CHANGE,
  sourceFiles = checkerFiles,
  checkerArguments = {}
) {
  const checkerCommands = checkerFiles.map((file) => [
    'node',
    file,
    ...arrayValue(checkerArguments[file])
  ].join(' '));
  return Object.freeze({ gate, tests, checkerFiles, checkerCommands, sourceFiles, verifiedBy });
}

export const REQUIRED_FALSE_GREEN_CONTRACTS = Object.freeze({
  'package-script-anti-theater': coverageContract(
    'test',
    ['tests/package-scripts.test.js'],
    [],
    LEGACY_VERIFICATION_CHANGE,
    ['package.json']
  ),
  'false-green-matrix-covered-requires-test': coverageContract(
    'check:false-green-matrix',
    ['tests/false-green-matrix-checker.test.js'],
    ['tools/false-green-matrix-checker.js'],
    CURRENT_VERIFICATION_CHANGE
  ),
  'ci-green-not-release-green': coverageContract(
    'check:ci-coverage-declaration',
    ['tests/production-safety.test.js'],
    ['tools/ci-coverage-declaration-checker.js']
  ),
  'runtime-acceptance-not-local-green': coverageContract(
    'check:verification-provenance',
    ['tests/governance-gates.test.js'],
    ['tools/verification-provenance-checker.js']
  ),
  'before-sales-order-runtime-bypass': coverageContract(
    'check:phase-gate',
    ['tests/governance-sales-order-handoff-gate.test.js'],
    ['tools/phase-gate-checker.js']
  ),
  'high-risk-permission-source-closure': coverageContract(
    'check:high-risk-governance',
    ['tests/high-risk-governance.test.js'],
    ['tools/high-risk-governance-checker.js']
  ),
  'validation-sql-real-table-dependency': coverageContract(
    'scan:db:check',
    ['tests/high-risk-governance.test.js'],
    ['tools/scan-db-schema.js'],
    LEGACY_VERIFICATION_CHANGE,
    ['tools/scan-db-schema.js'],
    { 'tools/scan-db-schema.js': ['--check'] }
  ),
  'ui-graph-real-source-only': coverageContract(
    'check:graph',
    ['tests/graph.test.js'],
    ['tools/dependency-checker.js']
  ),
  'api-graph-permission-source': coverageContract(
    'check:graph',
    ['tests/graph.test.js'],
    ['tools/dependency-checker.js']
  ),
  'forbidden-edit-roots-override-allowed': coverageContract(
    'check:boundaries',
    ['tests/boundary-lint.test.js'],
    ['tools/boundary-lint.js']
  ),
  'ruoyi-business-permission-feature-mapping': coverageContract(
    'scan:permissions:check',
    ['tests/high-risk-governance.test.js'],
    ['tools/scan-permissions.js'],
    LEGACY_VERIFICATION_CHANGE,
    ['tools/scan-permissions.js'],
    { 'tools/scan-permissions.js': ['--check'] }
  ),
  'rule-object-explicit-preflight-id': coverageContract(
    'check:rule-objects',
    ['tests/rule-object-governance.test.js'],
    ['tools/rule-object-checker.js']
  ),
  'ruoyi-legacy-baseline-exact-hash': coverageContract(
    'check:legacy-baseline',
    ['tests/legacy-baseline.test.js'],
    ['tools/legacy-baseline.js'],
    CURRENT_VERIFICATION_CHANGE
  ),
  'current-change-exception-exact-scope': coverageContract(
    'check',
    ['tests/legacy-baseline.test.js'],
    ['tools/legacy-baseline.js'],
    CURRENT_VERIFICATION_CHANGE
  ),
  'canonical-edit-root-scope': coverageContract(
    'check:diff',
    ['tests/diff-checker.test.js'],
    ['tools/diff-checker.js'],
    CURRENT_VERIFICATION_CHANGE
  ),
  'review-exact-binding': coverageContract(
    'check:review',
    ['tests/governance-sales-order-handoff-gate.test.js'],
    ['tools/review-checker.js'],
    CURRENT_VERIFICATION_CHANGE,
    ['tools/review-checker.js'],
    { 'tools/review-checker.js': ['--require-allow'] }
  ),
  'changed-files-exact-git-coverage': coverageContract(
    'check:change',
    ['tests/diff-checker.test.js', 'tests/change-handoff-integrity-checker.test.js'],
    ['tools/change-handoff-integrity-checker.js'],
    CURRENT_VERIFICATION_CHANGE
  ),
  'handover-exact-file-coverage': coverageContract(
    'check:handover-integrity',
    ['tests/change-handoff-integrity-checker.test.js'],
    ['tools/change-handoff-integrity-checker.js'],
    CURRENT_VERIFICATION_CHANGE
  ),
  'java-test-feature-ownership': coverageContract(
    'check:feature-test-ownership',
    ['tests/governance-gates.test.js'],
    ['tools/feature-test-ownership-checker.js'],
    CURRENT_VERIFICATION_CHANGE
  ),
  'deterministic-current-context-binding': coverageContract(
    'check:context-pack',
    ['tests/governance-sales-order-handoff-gate.test.js'],
    ['tools/context-pack-checker.js'],
    CURRENT_VERIFICATION_CHANGE
  ),
  'ci-locked-install-test-audit-build': coverageContract(
    'check:ci-coverage-declaration',
    ['tests/ci-coverage-hardening.test.js'],
    ['tools/ci-coverage-declaration-checker.js'],
    CURRENT_VERIFICATION_CHANGE
  ),
  'phase-gate-executable-file-scope': coverageContract(
    'check:phase-gate',
    ['tests/governance-sales-order-handoff-gate.test.js'],
    ['tools/phase-gate-checker.js'],
    CURRENT_VERIFICATION_CHANGE
  ),
  'single-maven-reactor-execution': coverageContract(
    'check:runtime',
    ['tests/runtime-checker.test.js'],
    ['tools/runtime-checker.js'],
    CURRENT_VERIFICATION_CHANGE
  )
});

export const REQUIRED_FALSE_GREEN_IDS = Object.freeze(Object.keys(REQUIRED_FALSE_GREEN_CONTRACTS));

const REQUIRED_FIELDS = [
  'id',
  'title',
  'gate',
  'risk',
  'mustFailWhen',
  'coveredByTests',
  'sourceFiles',
  'status',
  'owner',
  'lastVerifiedByChange'
];

const ALLOWED_STATUSES = new Set(['covered', 'blocked', 'deferred']);
const VAGUE_REASON = /\b(todo|later|tbd)\b|以后再说|待定|回头/i;

function hasOwn(object, field) {
  return Object.prototype.hasOwnProperty.call(object || {}, field);
}

function isBlank(value) {
  if (value === undefined || value === null) {
    return true;
  }
  if (typeof value === 'string') {
    return value.trim().length === 0;
  }
  if (Array.isArray(value)) {
    return value.length === 0 || value.every((item) => isBlank(item));
  }
  if (typeof value === 'object') {
    return Object.keys(value).length === 0;
  }
  return false;
}

function arrayValue(value) {
  return Array.isArray(value) ? value : [];
}

function loadJson(readJsonFile, file, errors) {
  try {
    return readJsonFile(file);
  } catch (error) {
    errors.push(`${file} is missing or invalid JSON: ${error.message}`);
    return null;
  }
}

function validateRequiredFields(item, label, errors) {
  for (const field of REQUIRED_FIELDS) {
    if (!hasOwn(item, field)) {
      errors.push(`${label} missing required field ${field}.`);
      continue;
    }
    if (field === 'coveredByTests' && item.status !== 'covered') {
      continue;
    }
    if (isBlank(item[field])) {
      errors.push(`${label}.${field} must not be empty.`);
    }
  }
}

function validateGate({ item, label, scripts, exists, errors }) {
  const gate = String(item.gate || '').trim();
  if (!gate) {
    return;
  }
  if (scripts[gate]) {
    return;
  }
  if (/^(tools|scripts)\//.test(gate) && exists(gate)) {
    return;
  }
  if (arrayValue(item.sourceFiles).includes(gate) && exists(gate)) {
    return;
  }
  errors.push(`${label}.gate ${gate} must match a package.json script or an existing checker source file.`);
}

const SAFE_PACKAGE_SCRIPT = /^[A-Za-z0-9:_-]+$/;
const SAFE_NODE_TOKEN = /^[A-Za-z0-9_./:@*?=+-]+$/;
const CHECKER_FILE = /^(?:tools|scripts)\/[A-Za-z0-9._/-]+\.js$/;

function invalidGateResolution() {
  return { valid: false, commands: new Set() };
}

function resolveGateCommands(gate, scripts, state = { stack: new Set(), cache: new Map() }) {
  if (!gate || !hasOwn(scripts, gate)) {
    return invalidGateResolution();
  }
  if (state.cache.has(gate)) {
    return state.cache.get(gate);
  }
  if (state.stack.has(gate)) {
    return invalidGateResolution();
  }

  state.stack.add(gate);
  const command = String(scripts[gate] || '').trim();
  const commandWithoutFailFastChains = command.replace(/&&/g, '');
  if (
    !command
    || /[&|;<>`$"'(){}[\]#!\\\r\n]/.test(commandWithoutFailFastChains)
  ) {
    state.stack.delete(gate);
    const result = invalidGateResolution();
    state.cache.set(gate, result);
    return result;
  }

  const commands = new Set();
  const segments = command.split(/\s*&&\s*/);
  for (const segment of segments) {
    const tokens = segment.trim().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) {
      state.stack.delete(gate);
      const result = invalidGateResolution();
      state.cache.set(gate, result);
      return result;
    }

    if (tokens[0] === 'npm') {
      const childGate = tokens.length === 2 && tokens[1] === 'test'
        ? 'test'
        : tokens.length === 3 && tokens[1] === 'run' && SAFE_PACKAGE_SCRIPT.test(tokens[2])
          ? tokens[2]
          : '';
      const child = resolveGateCommands(childGate, scripts, state);
      if (!child.valid) {
        state.stack.delete(gate);
        const result = invalidGateResolution();
        state.cache.set(gate, result);
        return result;
      }
      for (const childCommand of child.commands) {
        commands.add(childCommand);
      }
      continue;
    }

    if (tokens[0] !== 'node' || tokens.length < 2 || tokens.some((token) => !SAFE_NODE_TOKEN.test(token))) {
      state.stack.delete(gate);
      const result = invalidGateResolution();
      state.cache.set(gate, result);
      return result;
    }
    if (tokens[1] === '--test') {
      continue;
    }
    if (!CHECKER_FILE.test(tokens[1])) {
      state.stack.delete(gate);
      const result = invalidGateResolution();
      state.cache.set(gate, result);
      return result;
    }
    commands.add(tokens.join(' '));
  }

  state.stack.delete(gate);
  const result = { valid: true, commands };
  state.cache.set(gate, result);
  return result;
}

function canStartRegularExpression(characters, index) {
  let cursor = index - 1;
  while (cursor >= 0 && /\s/.test(characters[cursor])) {
    cursor -= 1;
  }
  if (cursor < 0 || /[({[=,:;!?&|+\-*%^~<>]/.test(characters[cursor])) {
    return true;
  }
  if (!/[A-Za-z0-9_$]/.test(characters[cursor])) {
    return false;
  }
  const end = cursor + 1;
  while (cursor >= 0 && /[A-Za-z0-9_$]/.test(characters[cursor])) {
    cursor -= 1;
  }
  return new Set([
    'await', 'case', 'delete', 'in', 'instanceof', 'new', 'of', 'return',
    'throw', 'typeof', 'void', 'yield'
  ]).has(characters.slice(cursor + 1, end).join(''));
}

function lexJavaScript(text) {
  const source = String(text || '');
  const characters = source.split('');
  const executable = source.split('');
  const codePositions = Array(source.length).fill(true);
  let state = 'code';
  let escaped = false;
  let regularExpressionClass = false;

  const mask = (index) => {
    codePositions[index] = false;
    if (!/[\r\n]/.test(executable[index])) {
      executable[index] = ' ';
    }
  };

  for (let index = 0; index < characters.length; index += 1) {
    const character = characters[index];
    const next = characters[index + 1];
    if (state === 'line-comment') {
      mask(index);
      if (character === '\n') {
        state = 'code';
      }
      continue;
    }
    if (state === 'block-comment') {
      mask(index);
      if (character === '*' && next === '/') {
        mask(index + 1);
        index += 1;
        state = 'code';
      }
      continue;
    }
    if (state === 'single-quote' || state === 'double-quote' || state === 'template') {
      mask(index);
      if (escaped) {
        escaped = false;
      } else if (character === '\\') {
        escaped = true;
      } else if (
        (state === 'single-quote' && character === "'")
        || (state === 'double-quote' && character === '"')
        || (state === 'template' && character === '`')
      ) {
        executable[index] = 'v';
        state = 'code';
      }
      continue;
    }
    if (state === 'regular-expression') {
      mask(index);
      if (escaped) {
        escaped = false;
      } else if (character === '\\') {
        escaped = true;
      } else if (character === '[') {
        regularExpressionClass = true;
      } else if (character === ']') {
        regularExpressionClass = false;
      } else if (character === '/' && !regularExpressionClass) {
        executable[index] = 'v';
        while (/[A-Za-z]/.test(characters[index + 1] || '')) {
          mask(index + 1);
          index += 1;
        }
        state = 'code';
      }
      continue;
    }

    if (character === '/' && next === '/') {
      mask(index);
      state = 'line-comment';
      continue;
    }
    if (character === '/' && next === '*') {
      mask(index);
      state = 'block-comment';
      continue;
    }
    if (character === "'") {
      mask(index);
      state = 'single-quote';
      continue;
    }
    if (character === '"') {
      mask(index);
      state = 'double-quote';
      continue;
    }
    if (character === '`') {
      mask(index);
      state = 'template';
      continue;
    }
    if (character === '/' && canStartRegularExpression(executable, index)) {
      mask(index);
      regularExpressionClass = false;
      state = 'regular-expression';
    }
  }

  return { source, executable: executable.join(''), codePositions };
}

function identifier(value) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(String(value || '').trim());
}

function addNamedBindings(clause, separator, bindings) {
  for (const entry of String(clause || '').split(',')) {
    const parts = entry.trim().split(separator).map((part) => part.trim()).filter(Boolean);
    if (parts.length < 1 || parts.length > 2 || !['test', 'it'].includes(parts[0])) {
      continue;
    }
    const binding = parts[1] || parts[0];
    if (identifier(binding)) {
      bindings.add(binding);
    }
  }
}

function nodeTestBindings({ source, codePositions }) {
  const direct = new Set();
  const namespaces = new Set();
  const importPattern = /\bimport\s+([^;\r\n]+?)\s+from\s*(['"])node:test\2/g;
  for (const match of source.matchAll(importPattern)) {
    if (!codePositions[match.index]) {
      continue;
    }
    const clause = match[1].trim();
    const namespace = clause.match(/^\*\s+as\s+([A-Za-z_$][A-Za-z0-9_$]*)$/);
    if (namespace) {
      namespaces.add(namespace[1]);
      continue;
    }
    const namedStart = clause.indexOf('{');
    const namedEnd = clause.lastIndexOf('}');
    const defaultBinding = (namedStart === -1 ? clause : clause.slice(0, namedStart))
      .replace(/,$/, '')
      .trim();
    if (identifier(defaultBinding)) {
      direct.add(defaultBinding);
    }
    if (namedStart !== -1 && namedEnd > namedStart) {
      addNamedBindings(clause.slice(namedStart + 1, namedEnd), /\s+as\s+/, direct);
    }
  }

  const requirePattern = /\b(?:const|let|var)\s+([^=;\r\n]+?)\s*=\s*require\s*\(\s*(['"])node:test\2\s*\)/g;
  for (const match of source.matchAll(requirePattern)) {
    if (!codePositions[match.index]) {
      continue;
    }
    const clause = match[1].trim();
    if (identifier(clause)) {
      direct.add(clause);
      namespaces.add(clause);
      continue;
    }
    if (clause.startsWith('{') && clause.endsWith('}')) {
      addNamedBindings(clause.slice(1, -1), /\s*:\s*/, direct);
    }
  }
  return { direct, namespaces };
}

function callHasExpressionShape(code, openParenthesis) {
  let depth = 0;
  for (let index = openParenthesis; index < code.length; index += 1) {
    if (code[index] === '(') {
      depth += 1;
    } else if (code[index] === ')') {
      depth -= 1;
      if (depth === 0) {
        let cursor = index + 1;
        while (/\s/.test(code[cursor] || '')) {
          cursor += 1;
        }
        return code[cursor] !== '{';
      }
    }
  }
  return false;
}

function hasDirectCall(code, binding) {
  const escapedBinding = binding.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`${escapedBinding}\\s*\\(`, 'g');
  for (const match of code.matchAll(pattern)) {
    const start = match.index;
    const before = code[start - 1] || '';
    const afterName = code[start + binding.length] || '';
    if (/[A-Za-z0-9_$.]/.test(before) || /[A-Za-z0-9_$]/.test(afterName)) {
      continue;
    }
    const precedingWord = code.slice(0, start).match(/([A-Za-z_$][A-Za-z0-9_$]*)\s*$/)?.[1];
    if (precedingWord === 'function' || precedingWord === 'new') {
      continue;
    }
    if (callHasExpressionShape(code, start + match[0].lastIndexOf('('))) {
      return true;
    }
  }
  return false;
}

function hasNamespaceCall(code, namespace) {
  const escapedNamespace = namespace.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`${escapedNamespace}\\s*\\.\\s*(?:test|it)\\s*\\(`, 'g');
  for (const match of code.matchAll(pattern)) {
    const start = match.index;
    if (/[A-Za-z0-9_$.]/.test(code[start - 1] || '')) {
      continue;
    }
    if (callHasExpressionShape(code, start + match[0].lastIndexOf('('))) {
      return true;
    }
  }
  return false;
}

function hasRealTestDeclaration(text) {
  const lexical = lexJavaScript(text);
  const bindings = nodeTestBindings(lexical);
  return [...bindings.direct].some((binding) => hasDirectCall(lexical.executable, binding))
    || [...bindings.namespaces].some((namespace) => hasNamespaceCall(lexical.executable, namespace));
}

function validateCoverageContract({ item, label, contract, scripts, exists, readTextFile, errors }) {
  if (!contract || item.status !== 'covered') {
    return;
  }
  if (item.owner !== 'governance') {
    errors.push(`${label}.owner must be governance for a covered required contract.`);
  }
  if (item.lastVerifiedByChange !== contract.verifiedBy) {
    errors.push(`${label}.lastVerifiedByChange must equal ${contract.verifiedBy}.`);
  }
  if (!exists(`ai/changes/${contract.verifiedBy}/impact.json`)) {
    errors.push(`${label}.lastVerifiedByChange must resolve to ai/changes/${contract.verifiedBy}/impact.json.`);
  }
  if (item.gate !== contract.gate) {
    errors.push(`${label}.gate must equal ${contract.gate}.`);
  }

  const tests = new Set(arrayValue(item.coveredByTests));
  for (const file of contract.tests) {
    if (!tests.has(file)) {
      errors.push(`${label}.coveredByTests must include ${file}.`);
      continue;
    }
    if (!exists(file)) {
      continue;
    }
    try {
      if (!hasRealTestDeclaration(readTextFile(file))) {
        errors.push(`${label}.coveredByTests entry ${file} must contain a real test declaration; it must contain a real node:test test() or it() call.`);
      }
    } catch (error) {
      errors.push(`${label}.coveredByTests entry ${file} could not be read: ${error.message}`);
    }
  }

  const sources = new Set(arrayValue(item.sourceFiles));
  for (const file of contract.sourceFiles) {
    if (!sources.has(file)) {
      errors.push(`${label}.sourceFiles must include ${file}.`);
    }
  }
  const gateResolution = resolveGateCommands(contract.gate, scripts);
  if (!gateResolution.valid) {
    errors.push(`${label}.gate ${contract.gate} must use dedicated fail-fast commands.`);
  }
  for (const [index, checker] of contract.checkerFiles.entries()) {
    const checkerCommand = contract.checkerCommands[index];
    if (!gateResolution.commands.has(checkerCommand)) {
      errors.push(`${label}.gate ${contract.gate} must execute ${checker} as dedicated fail-fast command ${checkerCommand}.`);
    }
  }
}

function validateFiles({ files, label, field, exists, errors, testFiles = false }) {
  if (!Array.isArray(files)) {
    errors.push(`${label}.${field} must be an array.`);
    return;
  }
  for (const file of files) {
    if (typeof file !== 'string' || !file.trim()) {
      errors.push(`${label}.${field} contains an empty file path.`);
      continue;
    }
    if (testFiles && !/^tests\/.+\.test\.js$/.test(file)) {
      errors.push(`${label}.${field} entry ${file} must be a tests/*.test.js file.`);
    }
    if (!exists(file)) {
      errors.push(`${label}.${field} references missing file ${file}.`);
    }
  }
}

function validateBlockedOrDeferred(item, label, errors) {
  if (!['blocked', 'deferred'].includes(item.status)) {
    return;
  }
  for (const field of ['owner', 'trigger', 'expiresAtPhase', 'reason']) {
    if (isBlank(item[field])) {
      errors.push(`${label}.${field} must not be empty when status is ${item.status}.`);
    }
  }
  if (!isBlank(item.reason) && VAGUE_REASON.test(String(item.reason))) {
    errors.push(`${label}.reason must not use vague placeholders such as todo, later, TBD, or以后再说.`);
  }
}

export function validateFalseGreenMatrix({
  matrix,
  packageScripts,
  readJsonFile = readJson,
  readTextFile = readText,
  exists = fileExists,
  coverageContracts = REQUIRED_FALSE_GREEN_CONTRACTS
} = {}) {
  const errors = [];
  const data = matrix || loadJson(readJsonFile, MATRIX_PATH, errors);
  const pkg = packageScripts ? { scripts: packageScripts } : loadJson(readJsonFile, 'package.json', errors);
  const scripts = pkg?.scripts || {};

  if (!scripts['check:false-green-matrix']) {
    errors.push('package.json scripts.check:false-green-matrix must exist.');
  }
  if (!String(scripts.check || '').includes('check:false-green-matrix')) {
    errors.push('package.json scripts.check must include npm run check:false-green-matrix.');
  }

  if (!data) {
    return [...new Set(errors)];
  }
  if (data.schemaVersion !== 1) {
    errors.push(`${MATRIX_PATH} schemaVersion must be 1.`);
  }
  if (!Array.isArray(data.items)) {
    errors.push(`${MATRIX_PATH} items must be an array.`);
    return [...new Set(errors)];
  }

  const ids = new Set();
  for (const [index, item] of data.items.entries()) {
    const label = `${MATRIX_PATH} items[${index}]`;
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      errors.push(`${label} must be an object.`);
      continue;
    }
    validateRequiredFields(item, label, errors);
    if (item.id) {
      if (ids.has(item.id)) {
        errors.push(`${MATRIX_PATH} has duplicate id ${item.id}.`);
      }
      ids.add(item.id);
    }
    if (!ALLOWED_STATUSES.has(item.status)) {
      errors.push(`${label}.status must be covered, blocked, or deferred.`);
    }
    if (item.status === 'covered' && isBlank(item.coveredByTests)) {
      errors.push(`${label}.coveredByTests must not be empty when status is covered.`);
    }
    validateFiles({
      files: arrayValue(item.coveredByTests),
      label,
      field: 'coveredByTests',
      exists,
      errors,
      testFiles: true
    });
    validateFiles({
      files: arrayValue(item.sourceFiles),
      label,
      field: 'sourceFiles',
      exists,
      errors
    });
    validateGate({ item, label, scripts, exists, errors });
    validateCoverageContract({
      item,
      label,
      contract: coverageContracts[item.id],
      scripts,
      exists,
      readTextFile,
      errors
    });
    validateBlockedOrDeferred(item, label, errors);
  }

  for (const id of REQUIRED_FALSE_GREEN_IDS) {
    if (!ids.has(id)) {
      errors.push(`${MATRIX_PATH} must include required id ${id}.`);
    }
  }

  return [...new Set(errors)];
}

if (isCli(import.meta.url)) {
  finish('check:false-green-matrix', validateFalseGreenMatrix());
}
