import {
  currentChangeId,
  emptyResult,
  issue,
  parseRootArg,
  pathExists,
  printIssues,
  readText,
  sectionLineRecords,
  workflowRunSteps
} from './governance-checker-utils.js';

const PROVENANCE_TAG = /\[(local|ci|ci-planned|runtime-local|runtime-ci|not-run|inconclusive)\]/i;
const CI_TAG = /\[ci\]|\[runtime-ci\]/i;
const NON_SUCCESS_PROVENANCE_TAG = /\[(ci-planned|not-run|inconclusive)\]/i;
const PROVENANCE_NAMES = 'local|ci|ci-planned|runtime-local|runtime-ci|not-run|inconclusive';
const COMMAND_OR_SCOPE = /(npm run check|npm test|node --test|mvn\b|maven|frontend build|build:prod|npm --prefix ruoyi-ui run build:prod|runtime api|runtime db|github actions|ci-planned|git diff --check)/i;
const RESULT_SEMANTICS = /\b(passed|verified|succeeded|success(?:ful(?:ly)?)?|failed|completed|done|ok)\b|通过|完成|成功|已验证|失败/i;

function atxHeading(line) {
  const match = String(line || '').match(/^ {0,3}(#{1,6})(?:[ \t]+(.*?))?[ \t]*$/);
  if (!match) {
    return null;
  }
  const text = String(match[2] || '')
    .replace(/[ \t]+#+[ \t]*$/, '')
    .trim();
  return { level: match[1].length, text };
}

function fenceOpening(line) {
  const match = String(line || '').match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
  if (!match || (match[1][0] === '`' && match[2].includes('`'))) {
    return null;
  }
  return { character: match[1][0], length: match[1].length };
}

function fenceClosing(line, fence) {
  const match = String(line || '').match(/^ {0,3}(`+|~+)[ \t]*$/);
  return Boolean(match)
    && match[1][0] === fence.character
    && match[1].length >= fence.length;
}

export function markdownStructureRecords(text = '') {
  const lines = String(text || '').replace(/\r\n?/g, '\n').split('\n');
  const records = [];
  let fence = null;
  lines.forEach((line, index) => {
    if (fence) {
      const closesFence = fenceClosing(line, fence);
      records.push({ index, line: index + 1, text: line, inFence: true, heading: null });
      if (closesFence) {
        fence = null;
      }
      return;
    }
    const opening = fenceOpening(line);
    if (opening) {
      fence = opening;
      records.push({ index, line: index + 1, text: line, inFence: true, heading: null });
      return;
    }
    records.push({ index, line: index + 1, text: line, inFence: false, heading: atxHeading(line) });
  });
  return records;
}

export function parseTopLevelStatus(text = '') {
  const fields = [];
  let topLevel = true;
  const statusPattern = new RegExp(`^ {0,3}Status:[ \\t]*([A-Za-z][A-Za-z0-9_-]*)(?:[ \\t]+\\[(${PROVENANCE_NAMES})\\])?[ \\t]*$`, 'i');
  for (const record of markdownStructureRecords(text)) {
    if (record.heading) {
      topLevel = record.heading.level === 1;
      continue;
    }
    if (!topLevel || record.inFence) {
      continue;
    }
    const match = record.text.match(statusPattern);
    if (match) {
      fields.push({
        status: match[1].toLowerCase(),
        provenance: (match[2] || '').toLowerCase(),
        line: record.line
      });
    }
  }
  const unique = fields.length === 1;
  return {
    fields,
    unique,
    status: unique ? fields[0].status : '',
    provenance: unique ? fields[0].provenance : '',
    line: unique ? fields[0].line : 0
  };
}

function isNegatedSuccessAssertion(text, assertionIndex) {
  const prefix = text.slice(0, assertionIndex);
  let boundary = Math.max(
    prefix.lastIndexOf('.'),
    prefix.lastIndexOf('!'),
    prefix.lastIndexOf('?'),
    prefix.lastIndexOf(';'),
    prefix.lastIndexOf('。'),
    prefix.lastIndexOf('！'),
    prefix.lastIndexOf('？'),
    prefix.lastIndexOf('；')
  );
  for (const match of prefix.matchAll(/\b(?:but|however|nevertheless)\b/gi)) {
    boundary = Math.max(boundary, (match.index || 0) + match[0].length - 1);
  }
  const clausePrefix = prefix.slice(boundary + 1);
  return /\b(?:not|never|no)(?:\s+(?:yet|currently|fully|formally|actually|independently))?\s*$/i.test(clausePrefix)
    || /\b(?:do|does|did|must|should)\s+not\s+(?:claim|report|describe|mark|label|treat)\b[^.!?;。！？；]*$/i.test(clausePrefix)
    || /\b(?:cannot|can't)\s+(?:claim|report|describe|mark|label|treat)\b[^.!?;。！？；]*$/i.test(clausePrefix)
    || /\bwithout\s+(?:claiming|reporting|describing|marking|labeling|labelling|treating)\b[^.!?;。！？；]*$/i.test(clausePrefix)
    || /\bnot\s+(?:be\s+)?(?:claimed|reported|described|marked|labeled|labelled|treated)(?:\s+as)?\s*$/i.test(clausePrefix);
}

export function nonSuccessProvenanceSuccessClaim(text = '') {
  const record = String(text || '');
  const tagMatch = record.match(NON_SUCCESS_PROVENANCE_TAG);
  if (!tagMatch) {
    return null;
  }
  const assertionText = record.replace(/\[(?:ci-planned|not-run|inconclusive)\]/gi, '');
  for (const match of assertionText.matchAll(/\b(passed|verified|succeeded|success(?:ful(?:ly)?)?|completed|done|ok)\b/gi)) {
    if (!isNegatedSuccessAssertion(assertionText, match.index || 0)) {
      return { tag: tagMatch[1].toLowerCase(), assertion: match[0] };
    }
  }
  return null;
}

function logicalProvenanceRecords(records) {
  const logicalRecords = [];
  let current = null;
  const flush = () => {
    if (current) {
      logicalRecords.push(current);
      current = null;
    }
  };
  for (const record of records) {
    const text = String(record.text || '');
    const trimmed = text.trim();
    if (record.inFence || !trimmed || /^#{1,6}\s+/.test(trimmed)) {
      flush();
      continue;
    }
    const startsListRecord = /^\s*(?:[-*+]\s+|\d+[.)]\s+)/.test(text);
    if (startsListRecord) {
      flush();
      current = { ...record, text };
      continue;
    }
    if (!current) {
      current = { ...record, text };
      continue;
    }
    current.text = `${current.text}\n${text}`;
  }
  flush();
  return logicalRecords;
}

export function nonSuccessProvenanceSuccessClaims(text = '') {
  return logicalProvenanceRecords(markdownStructureRecords(text))
    .map((record) => {
      const claim = nonSuccessProvenanceSuccessClaim(record.text);
      return claim ? { ...claim, line: record.line, record: record.text } : null;
    })
    .filter(Boolean);
}

function commandParts(command) {
  return String(command || '')
    .split(/\r?\n|&&|;/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function isMavenLine(line) {
  return /^(?:\.\/)?mvnw(?:\.cmd)?\b|^mvn(?:\.cmd)?\b/i.test(line);
}

function skipsMavenTests(line) {
  return /(?:^|\s)-(?:D)?(?:skipTests|skipITs|maven\.test\.skip)(?:=true)?(?:\s|$)/i.test(line);
}

function isMavenUnitCommand(command) {
  return commandParts(command).some((line) => isMavenLine(line)
    && !skipsMavenTests(line)
    && /(?:^|\s)(?:test|verify)(?:\s|$)/i.test(line));
}

function isMavenIntegrationCommand(command) {
  return commandParts(command).some((line) => isMavenLine(line)
    && !skipsMavenTests(line)
    && /(?:^|\s)-P(?:\s*)integration-test(?:\s|$)/i.test(line)
    && /(?:^|\s)verify(?:\s|$)/i.test(line));
}

function isFrontendBuildCommand(step) {
  return commandParts(step.command).some((line) => /^npm\s+--prefix\s+ruoyi-ui\s+run\s+build:prod(?:\s|$)/i.test(line)
    || (/^npm\s+run\s+build:prod(?:\s|$)/i.test(line)
      && step.workingDirectory.replace(/\\/g, '/') === 'ruoyi-ui'));
}

function workflowHasMaven(root) {
  const steps = workflowRunSteps(root);
  return steps.some((step) => isMavenUnitCommand(step.command))
    && steps.some((step) => isMavenIntegrationCommand(step.command));
}

function workflowHasFrontend(root) {
  return workflowRunSteps(root).some((step) => isFrontendBuildCommand(step));
}

function workflowHasCheck(root) {
  return workflowRunSteps(root).some((step) => commandParts(step.command).some((line) => /^npm\s+run\s+check(?:\s|$)/i.test(line)));
}

function provenanceTargets(root) {
  const id = currentChangeId(root);
  const targets = [
    { file: 'memory/HANDOVER.md', headings: ['Summary', 'Commands', 'Verification'] },
    { file: 'ai/context/current-context.md', headings: ['Verification Commands', 'Planned Verification Commands'] }
  ];
  if (id) {
    targets.push(
      { file: `ai/changes/${id}/verification.md`, headings: null },
      { file: `ai/changes/${id}/handover.md`, headings: ['Summary', 'Commands', 'Verification'] }
    );
  }
  return targets;
}

function isPlanned(record) {
  return /planned/i.test(record.heading || '');
}

function requiresProvenance(record) {
  const line = record.text.trim();
  if (!line || line.startsWith('#')) {
    return false;
  }
  const hasCommandOrScope = COMMAND_OR_SCOPE.test(line);
  const hasResult = RESULT_SEMANTICS.test(line);
  if (hasResult) {
    return true;
  }
  return hasCommandOrScope && !isPlanned(record);
}

export function validateVerificationProvenance({ root = process.cwd() } = {}) {
  const result = emptyResult();
  const hasMaven = workflowHasMaven(root);
  const hasFrontend = workflowHasFrontend(root);
  const hasCheck = workflowHasCheck(root);

  for (const target of provenanceTargets(root)) {
    if (!pathExists(root, target.file)) {
      continue;
    }
    const text = readText(root, target.file);
    const structureByLine = new Map(markdownStructureRecords(text).map((record) => [record.line, record]));
    const records = logicalProvenanceRecords(sectionLineRecords(text, target.headings).map((record) => ({
      ...record,
      inFence: structureByLine.get(record.line)?.inFence || false
    })));
    for (const record of records) {
      const line = record.text.trim();
      if (!requiresProvenance(record)) {
        continue;
      }
      if (!PROVENANCE_TAG.test(line)) {
        result.failures.push(issue({
          file: target.file,
          line: record.line,
          code: 'missing-provenance',
          message: 'verification result or command declaration must include [local], [ci], [runtime-local], [runtime-ci], [not-run], or [inconclusive]'
        }));
        continue;
      }
      if (/\[ci-planned\]/i.test(line) && RESULT_SEMANTICS.test(line)) {
        result.failures.push(issue({
          file: target.file,
          line: record.line,
          code: 'planned-evidence-claims-result',
          message: '[ci-planned] may describe future coverage but must not claim a passed or completed result'
        }));
        continue;
      }
      const contradiction = nonSuccessProvenanceSuccessClaim(line);
      if (contradiction) {
        result.failures.push(issue({
          file: target.file,
          line: record.line,
          code: 'non-success-evidence-claims-success',
          message: `[${contradiction.tag}] is non-success provenance and must not claim a successful result in the same record`
        }));
        continue;
      }
      if (!CI_TAG.test(line)) {
        continue;
      }
      if (/\b(mvn|maven|backend compile)\b/i.test(line) && !hasMaven) {
        result.failures.push(issue({
          file: target.file,
          line: record.line,
          code: 'ci-maven-not-covered',
          message: 'CI Maven claim has no matching unit and integration test commands in GitHub Actions'
        }));
      }
      if (/(frontend build|build:prod|ruoyi-ui)/i.test(line) && !hasFrontend) {
        result.failures.push(issue({
          file: target.file,
          line: record.line,
          code: 'ci-frontend-not-covered',
          message: 'CI frontend build claim has no matching ruoyi-ui build command in GitHub Actions'
        }));
      }
      if (/(github actions|\bci\b|npm run check)/i.test(line) && !hasCheck) {
        result.failures.push(issue({
          file: target.file,
          line: record.line,
          code: 'ci-check-not-covered',
          message: 'CI check claim has no npm run check command in GitHub Actions'
        }));
      }
    }
  }

  return result;
}

if (process.argv[1] && process.argv[1].endsWith('verification-provenance-checker.js')) {
  printIssues('check:verification-provenance', validateVerificationProvenance({ root: parseRootArg() }));
}
