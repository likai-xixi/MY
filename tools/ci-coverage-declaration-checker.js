import {
  currentChangeId,
  currentDocTargets,
  emptyResult,
  issue,
  parseRootArg,
  pathExists,
  printIssues,
  readText,
  sectionLineRecords,
  workflowContinueOnErrorSettings,
  workflowFiles,
  workflowRunSteps,
  workflowUses,
  workflowYamlDiagnostics
} from './governance-checker-utils.js';

function hereDocDeclarations(line) {
  const declarations = [];
  const pattern = /<<(-)?[ \t]*(?:'([^'\r\n]+)'|"([^"\r\n]+)"|\\?([A-Za-z_][A-Za-z0-9_]*))/g;
  for (const match of String(line || '').matchAll(pattern)) {
    declarations.push({
      delimiter: match[2] || match[3] || match[4],
      stripTabs: Boolean(match[1])
    });
  }
  return declarations;
}

function stripHereDocBodies(command) {
  const executableLines = [];
  const pending = [];
  for (const line of String(command || '').split(/\r?\n/)) {
    if (pending.length > 0) {
      const current = pending[0];
      const candidate = current.stripTabs ? line.replace(/^\t+/, '') : line;
      if (candidate === current.delimiter) {
        pending.shift();
      }
      continue;
    }
    executableLines.push(line);
    pending.push(...hereDocDeclarations(line));
  }
  return executableLines.join('\n');
}

function commandParts(command) {
  return stripHereDocBodies(command)
    .split(/\r?\n|&&|;/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function normalizeWorkingDirectory(step) {
  return String(step.workingDirectory || '').replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/$/, '');
}

function isRootStep(step) {
  return normalizeWorkingDirectory(step) === '' || normalizeWorkingDirectory(step) === '.';
}

function isMavenLine(line) {
  return /^(?:\.\/)?mvnw(?:\.cmd)?\b|^mvn(?:\.cmd)?\b/i.test(line);
}

function skipsMavenTests(line) {
  return /(?:^|\s)-(?:D)?(?:skipTests|skipITs|maven\.test\.skip)(?:=true)?(?:\s|$)/i.test(line);
}

const MAVEN_UNIT_ARGS = ['test'];
const MAVEN_INTEGRATION_ARGS = ['-pl', 'ruoyi-business', '-am', '-Pintegration-test', 'verify'];
const MAVEN_JVM_OPTION_ENV = new Set(['MAVEN_OPTS', 'JAVA_TOOL_OPTIONS', 'JDK_JAVA_OPTIONS', '_JAVA_OPTIONS']);
const MAVEN_TEST_WEAKENING_PROPERTY = /-D(?:skipTests|skipITs|skipExec|maven\.test\.skip(?:\.exec)?|maven\.test\.failure\.ignore|test|it\.test|groups|excludedGroups|surefire\.[^=\s]*|failsafe\.[^=\s]*|failIfNoTests|failIfNoSpecifiedTests)(?:=|\s|$)/i;

function mavenVerificationArgs(line) {
  if (!isMavenLine(line)) {
    return null;
  }
  const command = String(line || '').replace(/\s+\|\s+tee\s+\S+\s*$/i, '').trim();
  const tokens = command.split(/\s+/);
  let args = tokens.slice(1);
  if (args[0] === '-V') {
    args = args.slice(1);
  }
  return args;
}

function hasExactArgs(actual, expected) {
  return Array.isArray(actual)
    && actual.length === expected.length
    && actual.every((value, index) => value === expected[index]);
}

function hasDynamicSyntax(value) {
  return /(?:\$|`|%[^%]+%|[*?{}[\]])/.test(String(value || ''));
}

function mavenEnvironmentWeakeningReasons(step) {
  const reasons = [];
  for (const [rawKey, rawValue] of Object.entries(step.environment || {})) {
    const key = String(rawKey || '').toUpperCase();
    const value = String(rawValue || '').trim();
    if (!value) {
      continue;
    }
    if (key === 'MAVEN_ARGS') {
      reasons.push(`${key}:command-arguments`);
    } else if (MAVEN_JVM_OPTION_ENV.has(key)
      && (hasDynamicSyntax(value) || MAVEN_TEST_WEAKENING_PROPERTY.test(value))) {
      reasons.push(`${key}:test-selection-or-dynamic`);
    }
  }
  return reasons;
}

function isMavenUnitCommand(step) {
  if (mavenEnvironmentWeakeningReasons(step).length > 0) {
    return false;
  }
  return commandParts(step.command).some((line) => {
    const args = mavenVerificationArgs(line);
    return hasExactArgs(args, MAVEN_UNIT_ARGS)
      || hasExactArgs(args, MAVEN_INTEGRATION_ARGS);
  });
}

function isMavenIntegrationCommand(step) {
  if (mavenEnvironmentWeakeningReasons(step).length > 0) {
    return false;
  }
  return commandParts(step.command).some((line) => (
    hasExactArgs(mavenVerificationArgs(line), MAVEN_INTEGRATION_ARGS)
  ));
}

function isMavenVerificationAttempt(command) {
  return commandParts(command).some((line) => isMavenLine(line)
    && /(?:^|\s)(?:test|verify)(?:\s|$)/i.test(line));
}

function isRootNpmCommand(step, pattern) {
  return isRootStep(step) && commandParts(step.command).some((line) => pattern.test(line));
}

function isRootNpmAttempt(step) {
  return isRootNpmCommand(step, /^npm\s+(?:ci|run\s+check|(?:run\s+)?test)(?:\s|$)/i);
}

function isFrontendNpmCommand(step, localPattern, prefixPattern) {
  const frontendDirectory = normalizeWorkingDirectory(step) === 'ruoyi-ui';
  return commandParts(step.command).some((line) => (
    prefixPattern.test(line)
    || (frontendDirectory && localPattern.test(line))
  ));
}

function isFrontendBuildCommand(step) {
  return isFrontendNpmCommand(
    step,
    /^npm\s+run\s+build:prod$/i,
    /^npm\s+--prefix\s+ruoyi-ui\s+run\s+build:prod$/i
  );
}

function isFrontendBuildAttempt(step) {
  return isFrontendNpmCommand(
    step,
    /^npm\s+run\s+build:prod(?:\s|$)/i,
    /^npm\s+--prefix\s+ruoyi-ui\s+run\s+build:prod(?:\s|$)/i
  );
}

function isFrontendCiCommand(step) {
  return isFrontendNpmCommand(step, /^npm\s+ci$/i, /^npm\s+--prefix\s+ruoyi-ui\s+ci$/i);
}

function isFrontendCiAttempt(step) {
  return isFrontendNpmCommand(step, /^npm\s+ci(?:\s|$)/i, /^npm\s+--prefix\s+ruoyi-ui\s+ci(?:\s|$)/i);
}

function isFrontendTestCommand(step) {
  return isFrontendNpmCommand(
    step,
    /^npm\s+(?:run\s+)?test$/i,
    /^npm\s+--prefix\s+ruoyi-ui\s+(?:run\s+)?test$/i
  );
}

function isFrontendTestAttempt(step) {
  return isFrontendNpmCommand(
    step,
    /^npm\s+(?:run\s+)?test(?:\s|$)/i,
    /^npm\s+--prefix\s+ruoyi-ui\s+(?:run\s+)?test(?:\s|$)/i
  );
}

function frontendAuditLines(step) {
  const frontendDirectory = resolvesToFrontend(step.workingDirectory);
  return commandParts(step.command).filter((line) => (
    /^npm\s+--prefix\s+ruoyi-ui\s+audit(?:\s|$)/i.test(line)
    || (frontendDirectory && /^npm\s+audit(?:\s|$)/i.test(line))
  ));
}

function shellWordTokens(line) {
  return (String(line || '').match(/"[^"]*"|'[^']*'|[^\s]+/g) || []).map((token) => {
    const quoted = token.match(/^(?:"([^"]*)"|'([^']*)')$/);
    return quoted ? (quoted[1] ?? quoted[2] ?? '') : token.replace(/["']/g, '');
  });
}

function normalizeAuditPath(value) {
  let text = String(value || '').trim();
  const quoted = text.match(/^(?:"([^"]*)"|'([^']*)')$/);
  if (quoted) {
    text = quoted[1] ?? quoted[2] ?? '';
  }
  const normalizedParts = [];
  for (const part of text.replace(/\\/g, '/').split('/')) {
    if (!part || part === '.') {
      continue;
    }
    if (part === '..') {
      if (normalizedParts.length > 0 && normalizedParts.at(-1) !== '..') {
        normalizedParts.pop();
      } else {
        normalizedParts.push(part);
      }
      continue;
    }
    normalizedParts.push(part);
  }
  return normalizedParts.join('/');
}

const WORKSPACE_PATH_MARKER = '__github_workspace__';

function auditPathFacts(value, { baseFrontend = false } = {}) {
  let target = String(value || '').trim();
  const quoted = target.match(/^(?:"([^"]*)"|'([^']*)')$/);
  if (quoted) {
    target = quoted[1] ?? quoted[2] ?? '';
  }
  const basePath = `/${WORKSPACE_PATH_MARKER}${baseFrontend ? '/ruoyi-ui' : ''}`;
  target = target
    .replace(/\$\{\{\s*github\.workspace\s*\}\}/gi, `/${WORKSPACE_PATH_MARKER}`)
    .replace(/\$\{GITHUB_WORKSPACE\}|\$GITHUB_WORKSPACE(?![A-Za-z0-9_])|%GITHUB_WORKSPACE%/gi, `/${WORKSPACE_PATH_MARKER}`)
    .replace(/\$\{PWD\}|\$PWD(?![A-Za-z0-9_])|%CD%/gi, basePath);
  if (hasDynamicSyntax(target)) {
    return { couldFrontend: true, resolvedFrontend: false };
  }
  const absolute = /^(?:\/|[A-Za-z]:[\\/])/.test(target);
  const normalized = normalizeAuditPath(absolute ? target : `${basePath}/${target}`).toLowerCase();
  const resolvedFrontend = normalized === 'ruoyi-ui' || normalized.endsWith('/ruoyi-ui');
  return { couldFrontend: resolvedFrontend, resolvedFrontend };
}

function canResolveToFrontend(value, options) {
  return auditPathFacts(value, options).couldFrontend;
}

function resolvesToFrontend(value, options) {
  return auditPathFacts(value, options).resolvedFrontend;
}

function commandWord(token) {
  return String(token || '')
    .replace(/^[('"{}]+/, '')
    .replace(/[)'"{}]+$/, '');
}

function auditPrefixTargets(tokens) {
  const prefixes = [];
  for (let index = 1; index < tokens.length; index += 1) {
    const token = commandWord(tokens[index]);
    if (token.toLowerCase() === '--prefix') {
      prefixes.push(tokens[index + 1] || '');
      index += 1;
    } else if (token.toLowerCase().startsWith('--prefix=')) {
      prefixes.push(token.slice(token.indexOf('=') + 1));
    }
  }
  return prefixes;
}

function npmAuditInvocations(line) {
  const text = String(line || '');
  const starts = [];
  const executable = /(?:^|[\s'"({;|&`])((?:(?:[A-Za-z]:)?[^\s'"();|&`]*[\\/])?npm(?:\.cmd|\.ps1)?)(?=[\s)'"};|&`]|$)/gi;
  for (const match of text.matchAll(executable)) {
    starts.push((match.index || 0) + match[0].lastIndexOf(match[1]));
  }
  const invocations = [];
  for (const start of [...new Set(starts)]) {
    const tokens = shellWordTokens(text.slice(start));
    if (!tokens.slice(1).some((token) => commandWord(token).toLowerCase() === 'audit')) {
      continue;
    }
    invocations.push({ prefixes: auditPrefixTargets(tokens) });
  }
  if (invocations.length === 0 && /\bnpm\b/i.test(text)) {
    const tokens = shellWordTokens(text);
    if (tokens.some((token) => commandWord(token).toLowerCase() === 'audit')) {
      invocations.push({ prefixes: auditPrefixTargets(['npm', ...tokens]) });
    }
  }
  return invocations;
}

function directoryCommandTarget(line) {
  const tokens = shellWordTokens(line);
  for (let index = 0; index < tokens.length - 1; index += 1) {
    if (new Set(['cd', 'pushd']).has(commandWord(tokens[index]).toLowerCase())) {
      let targetIndex = index + 1;
      while (targetIndex < tokens.length) {
        const candidate = commandWord(tokens[targetIndex]);
        if (candidate === '--') {
          targetIndex += 1;
          break;
        }
        if (/^-(?:[LPe@]+)$/.test(candidate)) {
          targetIndex += 1;
          continue;
        }
        break;
      }
      return tokens[targetIndex] ?? null;
    }
  }
  return null;
}

function normalizeEnvironmentReferences(value) {
  return String(value || '')
    .replace(
      /\$\{\{\s*env\s*(?:\.\s*([A-Za-z_][A-Za-z0-9_]*)|\[\s*(['"])([A-Za-z_][A-Za-z0-9_-]*)\2\s*\])\s*\}\}/gi,
      (_match, propertyKey, _quote, bracketKey) => '${' + (propertyKey || bracketKey) + '}'
    )
    .replace(
      /\$\{\s*env:([A-Za-z_][A-Za-z0-9_]*)\s*\}/gi,
      (_match, key) => '${' + key + '}'
    )
    .replace(
      /\$\(\s*printenv\s+([A-Za-z_][A-Za-z0-9_]*)\s*\)/gi,
      (_match, key) => '${' + key + '}'
    )
    .replace(
      /`\s*printenv\s+([A-Za-z_][A-Za-z0-9_]*)\s*`/gi,
      (_match, key) => '${' + key + '}'
    );
}

function environmentExecutableIndex(tokens) {
  const executableBaseName = (token) => commandWord(token)
    .replace(/\\/g, '/')
    .split('/')
    .at(-1)
    .toLowerCase();
  let index = 0;
  while (index < tokens.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(tokens[index])) {
    index += 1;
  }
  if (executableBaseName(tokens[index]) === 'env') {
    index += 1;
    while (index < tokens.length && (/^-/.test(tokens[index]) || /^[A-Za-z_][A-Za-z0-9_]*=/.test(tokens[index]))) {
      index += 1;
    }
  }
  while (index < tokens.length) {
    const wrapper = executableBaseName(tokens[index]);
    if (wrapper === '&') {
      index += 1;
      continue;
    }
    if (new Set(['command', 'exec', 'builtin', 'nohup']).has(wrapper)) {
      index += 1;
      while (index < tokens.length && /^-/.test(tokens[index])) {
        index += 1;
      }
      continue;
    }
    if (wrapper === 'time') {
      index += 1;
      while (index < tokens.length && /^-/.test(tokens[index])) {
        const option = commandWord(tokens[index]).toLowerCase();
        index += 1;
        if (new Set(['-f', '--format', '-o', '--output']).has(option) && index < tokens.length) {
          index += 1;
        }
      }
      continue;
    }
    const processWrapperOptions = new Map([
      ['timeout', new Set(['-k', '--kill-after', '-s', '--signal'])],
      ['nice', new Set(['-n', '--adjustment'])],
      ['stdbuf', new Set(['-i', '--input', '-o', '--output', '-e', '--error'])],
      ['chrt', new Set(['-T', '--sched-runtime', '-P', '--sched-period', '-D', '--sched-deadline'])],
      ['ionice', new Set(['-c', '--class', '-n', '--classdata'])]
    ]);
    if (processWrapperOptions.has(wrapper)) {
      const optionsWithValues = processWrapperOptions.get(wrapper);
      index += 1;
      while (index < tokens.length && /^-/.test(tokens[index])) {
        const option = commandWord(tokens[index]);
        index += 1;
        if (optionsWithValues.has(option) && index < tokens.length) {
          index += 1;
        }
      }
      if (wrapper === 'timeout' && index < tokens.length) {
        index += 1;
      } else if (wrapper === 'chrt' && /^\d+$/.test(commandWord(tokens[index]))) {
        index += 1;
      }
      continue;
    }
    break;
  }
  return index;
}

function environmentExecutableKey(line, environment) {
  const normalizedLine = normalizeEnvironmentReferences(line);
  const tokens = shellWordTokens(normalizedLine);
  const index = environmentExecutableIndex(tokens);
  const executable = String(tokens[index] || '')
    .replace(/^[('\"]+/, '')
    .replace(/[)'\"]+$/, '');
  for (const key of Object.keys(environment || {})) {
    const candidates = [
      `$${key}`,
      `\${${key}}`,
      `%${key}%`,
      `$env:${key}`,
      `\${{ env.${key} }}`
    ];
    if (candidates.some((candidate) => candidate.toLowerCase() === executable.toLowerCase())) {
      return key;
    }
  }
  return '';
}

function expandEnvironmentReference(line, key, value) {
  const escaped = String(key || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const replacement = () => String(value ?? '');
  return normalizeEnvironmentReferences(line)
    .replace(new RegExp(`\\$\\{${escaped}\\}`, 'gi'), replacement)
    .replace(new RegExp(`\\$${escaped}(?![A-Za-z0-9_])`, 'gi'), replacement)
    .replace(new RegExp(`%${escaped}%`, 'gi'), replacement)
    .replace(new RegExp(`\\$env:${escaped}(?![A-Za-z0-9_])`, 'gi'), replacement)
    .replace(new RegExp(`\\$\\{\\{\\s*env\\.${escaped}\\s*\\}\\}`, 'gi'), replacement);
}

function expandKnownEnvironmentReferences(value, environment) {
  let expanded = normalizeEnvironmentReferences(value);
  const entries = Object.entries(environment || {});
  const seen = new Set();
  for (let pass = 0; pass <= entries.length; pass += 1) {
    if (seen.has(expanded)) {
      break;
    }
    seen.add(expanded);
    let next = expanded;
    for (const [key, environmentValue] of entries) {
      next = expandEnvironmentReference(next, key, environmentValue);
    }
    if (next === expanded) {
      break;
    }
    expanded = next;
  }
  return expanded.replace(/\$\{\{\s*github\.workspace\s*\}\}/gi, '$GITHUB_WORKSPACE');
}

function environmentProgramPayloads(line) {
  const tokens = shellWordTokens(normalizeEnvironmentReferences(line));
  const index = environmentExecutableIndex(tokens);
  const executable = commandWord(tokens[index]).toLowerCase();
  if (new Set(['bash', 'sh', 'zsh', 'dash', 'ksh']).has(executable)) {
    const commandIndex = tokens.findIndex((token, tokenIndex) => (
      tokenIndex > index && /^-[A-Za-z]*c[A-Za-z]*$/.test(token)
    ));
    return commandIndex >= 0 && tokens[commandIndex + 1] ? [tokens[commandIndex + 1]] : [];
  }
  if (new Set(['pwsh', 'powershell', 'powershell.exe']).has(executable)) {
    const commandIndex = tokens.findIndex((token, tokenIndex) => (
      tokenIndex > index && /^-(?:c|command)$/i.test(token)
    ));
    return commandIndex >= 0 && tokens[commandIndex + 1] ? [tokens[commandIndex + 1]] : [];
  }
  if (new Set(['cmd', 'cmd.exe']).has(executable)) {
    const commandIndex = tokens.findIndex((token, tokenIndex) => tokenIndex > index && /^\/c$/i.test(token));
    return commandIndex >= 0 && tokens[commandIndex + 1] ? [tokens[commandIndex + 1]] : [];
  }
  if (executable === 'eval') {
    return tokens.length > index + 1 ? [tokens.slice(index + 1).join(' ')] : [];
  }
  return [];
}

function lineCouldAuditFrontend(line, frontendDirectory) {
  const tokens = shellWordTokens(line);
  if (!tokens.some((token) => commandWord(token).toLowerCase() === 'audit')) {
    return false;
  }
  const prefixes = auditPrefixTargets(['npm', ...tokens]);
  return prefixes.length > 0
    ? prefixes.some((target) => canResolveToFrontend(target, { baseFrontend: frontendDirectory }))
    : frontendDirectory;
}

function isNpmExecutableToken(token) {
  const executable = commandWord(token).replace(/\\/g, '/').split('/').at(-1).toLowerCase();
  return new Set(['npm', 'npm.cmd', 'npm.ps1']).has(executable);
}

function npmSubcommandToken(tokens, npmIndex) {
  const optionsWithValues = new Set([
    '--cache', '--prefix', '--registry', '--scope', '--userconfig', '--workspace', '-w'
  ]);
  for (let index = npmIndex + 1; index < tokens.length; index += 1) {
    const token = commandWord(tokens[index]);
    const lower = token.toLowerCase();
    if (lower === '--') {
      return tokens[index + 1] || '';
    }
    if (optionsWithValues.has(lower)) {
      index += 1;
      continue;
    }
    if (lower.startsWith('--prefix=') || /^-/.test(lower)) {
      continue;
    }
    return tokens[index];
  }
  return '';
}

function npmEnvironmentCouldTargetFrontend(environment, frontendDirectory) {
  const prefixEntry = Object.entries(environment || {}).find(([key]) => (
    String(key).toLowerCase() === 'npm_config_prefix'
  ));
  return prefixEntry
    ? canResolveToFrontend(
      expandKnownEnvironmentReferences(prefixEntry[1], environment),
      { baseFrontend: frontendDirectory }
    )
    : false;
}

function unresolvedDynamicNpmAuditAttempt(line, environment, frontendDirectory) {
  const tokens = shellWordTokens(line);
  for (let index = 0; index < tokens.length; index += 1) {
    if (!isNpmExecutableToken(tokens[index])) {
      continue;
    }
    const invocationTokens = tokens.slice(index);
    const prefixes = auditPrefixTargets(invocationTokens);
    const couldTargetFrontend = prefixes.length > 0
      ? prefixes.some((target) => canResolveToFrontend(target, { baseFrontend: frontendDirectory }))
      : frontendDirectory || npmEnvironmentCouldTargetFrontend(environment, frontendDirectory);
    if (couldTargetFrontend && hasDynamicSyntax(npmSubcommandToken(tokens, index))) {
      return true;
    }
  }
  return false;
}

function unresolvedDynamicExecutableMayHideAudit(line) {
  const tokens = shellWordTokens(line);
  if (tokens.some((token) => commandWord(token).toLowerCase() === 'audit')) {
    return false;
  }
  const index = environmentExecutableIndex(tokens);
  return hasDynamicSyntax(tokens[index] || '');
}

function unquoteAssignmentValue(value) {
  const text = String(value || '').trim();
  const quoted = text.match(/^(?:"([\s\S]*)"|'([\s\S]*)')$/);
  return quoted ? (quoted[1] ?? quoted[2] ?? '') : text;
}

function localEnvironmentAssignment(line) {
  const text = String(line || '').trim();
  const shell = text.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*((?:"[^"]*"|'[^']*'|[^\s]+))$/);
  if (shell) {
    return { key: shell[1], value: unquoteAssignmentValue(shell[2]) };
  }
  const powershell = text.match(/^\$(?:env:)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*((?:"[^"]*"|'[^']*'|[^\s]+))$/i);
  if (powershell) {
    return { key: powershell[1], value: unquoteAssignmentValue(powershell[2]) };
  }
  const cmd = text.match(/^set\s+(?:"([A-Za-z_][A-Za-z0-9_]*)=([\s\S]*)"|([A-Za-z_][A-Za-z0-9_]*)=([^\s]+))$/i);
  if (cmd) {
    return { key: cmd[1] || cmd[3], value: cmd[2] ?? cmd[4] ?? '' };
  }
  return null;
}

function environmentReferencePattern(key) {
  const escaped = String(key || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(
    `(?:\\$\\{${escaped}\\}|\\$${escaped}(?![A-Za-z0-9_])|%${escaped}%|\\$env:${escaped}(?![A-Za-z0-9_])|\\$\\{\\{\\s*env\\.${escaped}\\s*\\}\\}|\\bprintenv\\s+${escaped}(?![A-Za-z0-9_]))`,
    'i'
  );
}

function executesEnvironmentProgram(line) {
  return /(?:^|\s)(?:(?:bash|sh|zsh|dash|ksh)\s+-c\b|(?:pwsh|powershell)(?:\.exe)?\s+-(?:c|command)\b|cmd(?:\.exe)?\s+\/c\b|eval(?:\s|$))/i.test(line);
}

function auditAttemptsInProgram(command, environment, initialFrontendDirectory, visitedKeys = new Set()) {
  const attempts = [];
  let frontendDirectory = initialFrontendDirectory;
  const localEnvironment = { ...(environment || {}) };
  for (const line of commandParts(command)) {
    const assignment = localEnvironmentAssignment(line);
    if (assignment) {
      localEnvironment[assignment.key] = expandKnownEnvironmentReferences(assignment.value, localEnvironment);
      continue;
    }
    const expandedLine = expandKnownEnvironmentReferences(line, localEnvironment);
    const directoryTarget = directoryCommandTarget(expandedLine);
    if (directoryTarget !== null) {
      frontendDirectory = canResolveToFrontend(directoryTarget, { baseFrontend: frontendDirectory });
      continue;
    }
    let invocations = npmAuditInvocations(expandedLine);
    const executableKey = environmentExecutableKey(line, localEnvironment);
    let expandedEnvironmentCommand = '';
    if (invocations.length === 0 && executableKey) {
      expandedEnvironmentCommand = expandEnvironmentReference(line, executableKey, localEnvironment[executableKey]);
      invocations = npmAuditInvocations(expandedEnvironmentCommand);
    }
    for (const invocation of invocations) {
      const isFrontend = invocation.prefixes.length > 0
        ? invocation.prefixes.some((target) => canResolveToFrontend(target, { baseFrontend: frontendDirectory }))
        : frontendDirectory || npmEnvironmentCouldTargetFrontend(localEnvironment, frontendDirectory);
      if (isFrontend) {
        attempts.push(line);
      }
    }
    let countedUnresolvedAttempt = false;
    if (invocations.length === 0 && expandedEnvironmentCommand
      && lineCouldAuditFrontend(expandedEnvironmentCommand, frontendDirectory)) {
      attempts.push(`environment:${executableKey}:audit-program`);
      countedUnresolvedAttempt = true;
    }
    if (invocations.length === 0 && !countedUnresolvedAttempt
      && (lineCouldAuditFrontend(expandedLine, frontendDirectory)
        || unresolvedDynamicNpmAuditAttempt(expandedLine, localEnvironment, frontendDirectory)
        || unresolvedDynamicExecutableMayHideAudit(expandedLine))) {
      attempts.push('unresolved-dynamic-frontend-audit-program');
      countedUnresolvedAttempt = true;
    }
    if (invocations.length === 0 && !countedUnresolvedAttempt) {
      for (const payload of environmentProgramPayloads(expandedLine)) {
        attempts.push(...auditAttemptsInProgram(payload, localEnvironment, frontendDirectory, visitedKeys));
      }
    }
    if (!executesEnvironmentProgram(line)) {
      continue;
    }
    for (const [key, value] of Object.entries(localEnvironment)) {
      if (visitedKeys.has(key) || !environmentReferencePattern(key).test(normalizeEnvironmentReferences(line))) {
        continue;
      }
      const nestedVisited = new Set(visitedKeys).add(key);
      const nestedAttempts = auditAttemptsInProgram(value, environment, frontendDirectory, nestedVisited);
      if (nestedAttempts.length > 0) {
        attempts.push(...nestedAttempts);
      } else if (hasDynamicSyntax(value)) {
        attempts.push(`environment:${key}:dynamic-program`);
      }
    }
  }
  return attempts;
}

function auditAttemptLines(step) {
  return auditAttemptsInProgram(
    step.command,
    step.environment,
    canResolveToFrontend(expandKnownEnvironmentReferences(step.workingDirectory, step.environment))
  );
}

function isFrontendAuditAttempt(step) {
  return auditAttemptLines(step).length > 0;
}

function optionOccurrences(line, option) {
  const pattern = new RegExp(`(?:^|\\s)--${option}(?==|\\s|$)`, 'gi');
  return [...String(line || '').matchAll(pattern)];
}

function singleLiteralOptionValue(line, option) {
  if (optionOccurrences(line, option).length !== 1) {
    return '';
  }
  const pattern = new RegExp(`(?:^|\\s)--${option}(?:=([^\\s]+)|\\s+([^\\s]+))`, 'i');
  const match = String(line || '').match(pattern);
  return (match?.[1] || match?.[2] || '').toLowerCase();
}

function includesDevelopmentDependencies(line) {
  const values = [];
  const pattern = /(?:^|\s)--include(?:=([^\s]+)|\s+([^\s]+))/gi;
  for (const match of String(line || '').matchAll(pattern)) {
    values.push(...String(match[1] || match[2] || '').toLowerCase().split(',').filter(Boolean));
  }
  return values.includes('dev');
}

function isAcceptedFrontendAuditCommand(step) {
  const lines = frontendAuditLines(step);
  if (lines.length !== 1) {
    return false;
  }
  const line = lines[0];
  const argumentText = line
    .replace(/^npm\s+--prefix\s+ruoyi-ui\s+audit\b/i, '')
    .replace(/^npm\s+audit\b/i, '')
    .trim();
  const tokens = argumentText ? argumentText.split(/\s+/) : [];
  const allowedTokens = [];
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (/^--(?:audit-level|include)=\S+$/i.test(token)) {
      allowedTokens.push(token);
      continue;
    }
    if (/^--(?:audit-level|include)$/i.test(token) && tokens[index + 1]) {
      allowedTokens.push(token, tokens[index + 1]);
      index += 1;
      continue;
    }
    return false;
  }
  if (allowedTokens.length !== tokens.length || optionOccurrences(line, 'include').length !== 1) {
    return false;
  }
  const level = singleLiteralOptionValue(line, 'audit-level');
  if (!new Set(['info', 'low', 'moderate']).has(level)) {
    return false;
  }
  if (!includesDevelopmentDependencies(line) || singleLiteralOptionValue(line, 'include') !== 'dev') {
    return false;
  }
  if (/\baudit\s+fix(?:\s|$)/i.test(line)) {
    return false;
  }
  return !/(?:^|\s)--omit(?==|\s|$)|(?:^|\s)--production(?==|\s|$)|(?:^|\s)--only(?:=|\s+)(?:prod|production)(?:\s|$)/i.test(line);
}

function isUnconditional(step) {
  return !step.conditionSpecified && !step.jobConditionSpecified;
}

function unsafeControlReasons(step) {
  const reasons = [];
  if (step.shellSpecified) {
    reasons.push(`custom-shell:${step.shell || '(empty)'}`);
  }
  if (step.jobNeedsSpecified) {
    reasons.push('job-needs');
  }
  return reasons;
}

function isRequiredVerificationStep(step) {
  return isRootNpmAttempt(step)
    || isMavenVerificationAttempt(step.command)
    || isFrontendCiAttempt(step)
    || isFrontendTestAttempt(step)
    || isFrontendAuditAttempt(step)
    || isFrontendBuildAttempt(step);
}

function shellSegments(command) {
  return String(command || '')
    .split(/\r?\n|;|&&/)
    .map((segment) => segment.replace(/\s+#.*$/, '').trim())
    .filter(Boolean);
}

function hasSingleShellOperator(command, operator) {
  const text = String(command || '');
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] !== operator) {
      continue;
    }
    const previous = text[index - 1] || '';
    const next = text[index + 1] || '';
    if (operator === '|' && (previous === '|' || next === '|')) {
      continue;
    }
    if (operator === '&' && (
      previous === '&' || next === '&'
      || previous === '>' || previous === '<' || previous === '|'
      || next === '>'
    )) {
      continue;
    }
    return true;
  }
  return false;
}

function isPipefailDirective(segment) {
  const tokens = String(segment || '').trim().split(/\s+/);
  if (tokens.length < 3 || tokens[0].toLowerCase() !== 'set'
    || tokens.at(-1).toLowerCase() !== 'pipefail') {
    return false;
  }
  const flags = tokens.slice(1, -1);
  return flags.every((flag) => /^-[A-Za-z]+$/.test(flag))
    && flags.some((flag) => flag === '-o' || /^-[A-Za-z]*o[A-Za-z]*$/.test(flag));
}

function pipefailEnabled(command) {
  const segments = shellSegments(command);
  if (segments.some((segment) => /^set\s+\+o\s+pipefail(?:\s|$)/i.test(segment))) {
    return false;
  }
  return segments.some((segment) => isPipefailDirective(segment));
}

function verificationProgramLines(command) {
  return stripHereDocBodies(command)
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+#.*$/, '').trim())
    .filter((line) => line && !line.startsWith('#'));
}

function isDedicatedVerificationProgram(command) {
  const lines = verificationProgramLines(command);
  if (lines.length === 1) {
    return commandParts(lines[0]).length === 1;
  }
  if (lines.length !== 2 || !isPipefailDirective(lines[0])) {
    return false;
  }
  return hasSingleShellOperator(lines[1], '|')
    && commandParts(lines[1]).length === 1;
}

function failureMaskReasons(command) {
  const text = stripHereDocBodies(command);
  const segments = shellSegments(text);
  const reasons = [];
  if (/\|\|/.test(text)) {
    reasons.push('or-list');
  }
  if (segments.some((segment) => (
    /^set\s+\+[A-Za-z]*e[A-Za-z]*(?:\s|$)/i.test(segment)
    || /^set\s+\+o\s+errexit(?:\s|$)/i.test(segment)
  ))) {
    reasons.push('errexit-disabled');
  }
  if (hasSingleShellOperator(text, '|') && !pipefailEnabled(text)) {
    reasons.push('pipeline-without-pipefail');
  }
  if (hasSingleShellOperator(text, '&')) {
    reasons.push('background-command');
  }
  const trailing = String(text)
    .split(/\r?\n|;/)
    .map((segment) => segment.replace(/\s+#.*$/, '').trim())
    .filter(Boolean)
    .at(-1) || '';
  if (/^(?:true|:|(?:exit|return)\s+0)$/i.test(trailing)) {
    reasons.push('trailing-success');
  }
  return reasons;
}

function externalUseParts(use) {
  const separator = use.target.lastIndexOf('@');
  if (separator <= 0) {
    return { ...use, action: use.target, ref: '(missing)' };
  }
  return {
    ...use,
    action: use.target.slice(0, separator),
    ref: use.target.slice(separator + 1)
  };
}

function needsFullCheckoutHistory(root) {
  const baselineFile = 'ai/rules/ruoyi-legacy-baseline.json';
  if (!pathExists(root, baselineFile)) {
    return false;
  }
  try {
    const baseline = JSON.parse(readText(root, baselineFile));
    return [
      ...(baseline.componentFiles || []),
      ...(baseline.boundaryFindings || [])
    ].some((entry) => String(entry.sourceCommit || '').trim());
  } catch {
    return true;
  }
}

function workflowFacts(root) {
  const steps = workflowRunSteps(root);
  const stepFacts = steps.map((step) => ({
    ...step,
    failureMaskReasons: failureMaskReasons(step.command),
    unsafeControlReasons: unsafeControlReasons(step)
  }));
  const unconditionalSteps = stepFacts.filter((step) => isUnconditional(step));
  const failurePropagatingSteps = unconditionalSteps.filter((step) => (
    (!step.continueOnErrorSpecified || step.continueOnErrorExplicitFalse)
    && (!step.jobContinueOnErrorSpecified || step.jobContinueOnErrorExplicitFalse)
  ));
  const controlSafeSteps = failurePropagatingSteps.filter((step) => step.unsafeControlReasons.length === 0);
  const dedicatedSteps = controlSafeSteps.filter((step) => isDedicatedVerificationProgram(step.command));
  const coverageSteps = dedicatedSteps.filter((step) => step.failureMaskReasons.length === 0);
  const maskedRequiredSteps = stepFacts.filter((step) => (
    step.failureMaskReasons.length > 0 && isRequiredVerificationStep(step)
  ));
  const unsafeControlRequiredSteps = stepFacts.filter((step) => (
    step.unsafeControlReasons.length > 0 && isRequiredVerificationStep(step)
  ));
  const uses = workflowUses(root);
  const invalidContinueOnError = workflowContinueOnErrorSettings(root)
    .filter((setting) => !setting.explicitFalse);
  const yamlDiagnostics = workflowYamlDiagnostics(root);
  const externalUses = uses
    .filter((use) => !use.target.startsWith('./') && !use.target.startsWith('docker://'))
    .map((use) => externalUseParts(use));
  const unpinnedActions = externalUses.filter(({ ref }) => !/^[0-9a-f]{40}$/i.test(ref));
  const unpinnedDockerImages = uses.filter((use) => use.target.startsWith('docker://')
    && !/^docker:\/\/[^@\s]+@sha256:[0-9a-f]{64}$/i.test(use.target));
  const checkoutUses = uses.filter((use) => use.kind === 'step'
    && externalUseParts(use).action.toLowerCase() === 'actions/checkout');
  const fullHistoryRequired = needsFullCheckoutHistory(root);
  const checkoutWithoutFullHistory = fullHistoryRequired
    ? checkoutUses.filter((use) => use.inputs['fetch-depth'] !== '0')
    : [];
  const persistentEnvironmentMutationSteps = stepFacts.filter((step) => (
    /(?:GITHUB_ENV|GITHUB_PATH|::set-env\b|::add-path\b)/i.test(stripHereDocBodies(step.command))
  ));
  const frontendAuditAttemptCount = stepFacts.reduce((count, step) => count + auditAttemptLines(step).length, 0);
  return {
    steps,
    hasCheck: coverageSteps.some((step) => isRootNpmCommand(step, /^npm\s+run\s+check$/i)),
    hasRootCi: coverageSteps.some((step) => isRootNpmCommand(step, /^npm\s+ci$/i)),
    hasRootTest: coverageSteps.some((step) => isRootNpmCommand(step, /^npm\s+(?:run\s+)?test$/i)),
    hasMavenUnit: coverageSteps.some((step) => isMavenUnitCommand(step)),
    hasMavenIntegration: coverageSteps.some((step) => isMavenIntegrationCommand(step)),
    hasFrontendCi: coverageSteps.some((step) => isFrontendCiCommand(step)),
    hasFrontendTest: coverageSteps.some((step) => isFrontendTestCommand(step)),
    hasFrontendAudit: frontendAuditAttemptCount === 1
      && coverageSteps.some((step) => isAcceptedFrontendAuditCommand(step)),
    hasFrontendBuild: coverageSteps.some((step) => isFrontendBuildCommand(step)),
    skippedMaven: steps.some((step) => commandParts(step.command).some((line) => isMavenLine(line) && skipsMavenTests(line))),
    weakenedMavenEnvironmentSteps: stepFacts.filter((step) => (
      isMavenVerificationAttempt(step.command) && mavenEnvironmentWeakeningReasons(step).length > 0
    )).map((step) => ({ ...step, mavenEnvironmentReasons: mavenEnvironmentWeakeningReasons(step) })),
    persistentEnvironmentMutationSteps,
    npmInstall: steps.some((step) => commandParts(step.command).some((line) => /^npm(?:\s+--prefix\s+ruoyi-ui)?\s+install(?:\s|$)/i.test(line))),
    echo: steps.some((step) => commandParts(step.command).some((line) => /^echo(?:\s|$)/i.test(line))),
    invalidContinueOnError,
    yamlDiagnostics,
    maskedRequiredSteps,
    unsafeControlRequiredSteps,
    unpinnedActions,
    unpinnedDockerImages,
    checkoutUses,
    checkoutWithoutFullHistory,
    fullHistoryRequired
  };
}

function pushMissing(result, condition, code, message) {
  if (!condition) {
    result.failures.push(issue({ file: '.github/workflows', code, message }));
  }
}

function pushMaskedRequiredFailures(result, steps) {
  for (const step of steps) {
    result.failures.push(issue({
      file: step.file,
      line: step.line,
      code: 'ci-required-command-failure-masked',
      message: 'GitHub Actions required verification commands must propagate failures',
      detail: step.failureMaskReasons.join(', ')
    }));
  }
}

function pushUnsafeControlFailures(result, steps) {
  for (const step of steps) {
    result.failures.push(issue({
      file: step.file,
      line: step.line,
      code: 'ci-required-command-unsafe-control',
      message: 'GitHub Actions required verification commands must use the default shell in a dependency-free job',
      detail: step.unsafeControlReasons.join(', ')
    }));
  }
}

function declarationTargets(root) {
  const id = currentChangeId(root);
  const targets = currentDocTargets(root);
  if (id) {
    targets.push(
      { file: `ai/changes/${id}/verification.md`, headings: null },
      { file: `ai/changes/${id}/handover.md`, headings: null }
    );
  }
  return targets;
}

function isCiCoverageClaim(line) {
  if (/\[ci-planned\]/i.test(line)) {
    return false;
  }
  return /\[ci\]|\[runtime-ci\]/i.test(line)
    || /(github actions|\bci\b).*\b(passed|verified|covered|runs?|ran|build|compile)\b/i.test(line);
}

export function validateCiCoverageDeclaration({ root = process.cwd() } = {}) {
  const result = emptyResult();
  const workflows = workflowFiles(root);
  const facts = workflowFacts(root);
  const hasMaven = facts.hasMavenUnit && facts.hasMavenIntegration;
  const hasFrontend = facts.hasFrontendCi && facts.hasFrontendTest && facts.hasFrontendAudit && facts.hasFrontendBuild;

  if (workflows.length === 0 || !facts.hasCheck) {
    result.failures.push(issue({
      file: '.github/workflows',
      code: 'node-governance-ci-missing',
      message: 'GitHub Actions must run npm run check for Node governance CI'
    }));
  }
  pushMissing(result, facts.hasRootCi, 'root-npm-ci-missing', 'GitHub Actions must install root dependencies with npm ci');
  pushMissing(result, facts.hasRootTest, 'root-npm-test-missing', 'GitHub Actions must run the root npm test suite explicitly');
  pushMissing(result, facts.hasMavenUnit, 'maven-unit-ci-missing', 'GitHub Actions must run Maven unit tests without skip flags');
  pushMissing(result, facts.hasMavenIntegration, 'maven-integration-ci-missing', 'GitHub Actions must run the integration-test Maven profile through verify');
  pushMissing(result, facts.hasFrontendCi, 'frontend-npm-ci-missing', 'GitHub Actions must install ruoyi-ui dependencies with npm ci');
  pushMissing(result, facts.hasFrontendTest, 'frontend-npm-test-missing', 'GitHub Actions must run the ruoyi-ui npm test suite explicitly');
  pushMissing(result, facts.hasFrontendAudit, 'frontend-audit-ci-missing', 'GitHub Actions must run one literal ruoyi-ui npm audit at info, low, or moderate with development dependencies included');
  pushMissing(result, facts.hasFrontendBuild, 'frontend-build-ci-missing', 'GitHub Actions must run ruoyi-ui build:prod');

  if (facts.skippedMaven) {
    result.failures.push(issue({
      file: '.github/workflows',
      code: 'maven-tests-skipped',
      message: 'GitHub Actions Maven commands must not use skipTests, skipITs, or maven.test.skip'
    }));
  }
  for (const step of facts.weakenedMavenEnvironmentSteps) {
    result.failures.push(issue({
      file: step.file,
      line: step.line,
      code: 'maven-verification-environment-unsafe',
      message: `Maven verification environment must not add dynamic or test-weakening options: ${step.mavenEnvironmentReasons.join(', ')}`
    }));
  }
  for (const step of facts.persistentEnvironmentMutationSteps) {
    result.failures.push(issue({
      file: step.file,
      line: step.line,
      code: 'ci-persistent-environment-mutation',
      message: 'GitHub Actions run steps must not mutate GITHUB_ENV or GITHUB_PATH before fixed verification commands'
    }));
  }
  if (facts.npmInstall) {
    result.failures.push(issue({
      file: '.github/workflows',
      code: 'npm-install-in-ci',
      message: 'GitHub Actions must use npm ci instead of npm install'
    }));
  }
  if (facts.echo) {
    result.failures.push(issue({
      file: '.github/workflows',
      code: 'ci-echo-command',
      message: 'GitHub Actions verification jobs must not use echo-only commands'
    }));
  }
  for (const diagnostic of facts.yamlDiagnostics) {
    result.failures.push(issue({
      file: diagnostic.file,
      line: diagnostic.line,
      code: 'ci-workflow-yaml-invalid',
      message: 'GitHub Actions workflow YAML must parse without errors',
      detail: diagnostic.message
    }));
  }
  for (const setting of facts.invalidContinueOnError) {
    result.failures.push(issue({
      file: setting.file,
      line: setting.line,
      code: 'ci-continue-on-error',
      message: `GitHub Actions ${setting.kind} continue-on-error must be omitted or the explicit boolean false`
    }));
  }
  pushMaskedRequiredFailures(result, facts.maskedRequiredSteps);
  pushUnsafeControlFailures(result, facts.unsafeControlRequiredSteps);
  for (const { action, ref, file, line } of facts.unpinnedActions) {
    result.failures.push(issue({
      file,
      line,
      code: 'ci-action-ref-unpinned',
      message: `GitHub Action or reusable workflow ${action}@${ref} must be pinned to a full 40-character commit SHA`
    }));
  }
  for (const { target, file, line } of facts.unpinnedDockerImages) {
    result.failures.push(issue({
      file,
      line,
      code: 'ci-docker-image-unpinned',
      message: `GitHub Action Docker image ${target} must be pinned to a sha256 digest`
    }));
  }
  if (facts.fullHistoryRequired && facts.checkoutUses.length === 0) {
    result.failures.push(issue({
      file: '.github/workflows',
      code: 'ci-checkout-full-history-required',
      message: 'GitHub Actions must checkout full history because legacy baselines reference historical source commits'
    }));
  }
  for (const { file, line } of facts.checkoutWithoutFullHistory) {
    result.failures.push(issue({
      file,
      line,
      code: 'ci-checkout-full-history-required',
      message: 'actions/checkout must set with.fetch-depth to 0 because legacy baselines reference historical source commits'
    }));
  }

  for (const target of declarationTargets(root)) {
    if (!pathExists(root, target.file)) {
      continue;
    }
    const text = readText(root, target.file);
    for (const record of sectionLineRecords(text, target.headings)) {
      const line = record.text.trim();
      if (!isCiCoverageClaim(line)) {
        continue;
      }
      if (/\b(mvn|maven|backend compile)\b/i.test(line) && !hasMaven) {
        result.failures.push(issue({
          file: target.file,
          line: record.line,
          code: 'declared-ci-maven-missing',
          message: 'current docs declare Maven/backend CI coverage but workflows do not run Maven compile'
        }));
      }
      if (/(frontend build|build:prod|ruoyi-ui)/i.test(line) && !hasFrontend) {
        result.failures.push(issue({
          file: target.file,
          line: record.line,
          code: 'declared-ci-frontend-missing',
          message: 'current docs declare frontend CI coverage but workflows do not run ruoyi-ui build:prod'
        }));
      }
    }
  }

  return result;
}

if (process.argv[1] && process.argv[1].endsWith('ci-coverage-declaration-checker.js')) {
  printIssues('check:ci-coverage-declaration', validateCiCoverageDeclaration({ root: parseRootArg() }));
}
