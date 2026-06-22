import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const WINDOWS_SHIM_COMMANDS = new Set(['npm', 'npx', 'pnpm', 'pnpx', 'yarn', 'mvn', 'mvnw']);
const WINDOWS_BATCH_EXTENSIONS = new Set(['.bat', '.cmd']);

function isWindows(platform = process.platform) {
  return platform === 'win32';
}

function pathApiFor(platform) {
  return isWindows(platform) ? path.win32 : path;
}

function envValue(env, names) {
  for (const name of names) {
    if (Object.hasOwn(env, name)) {
      return env[name];
    }
  }
  const lowered = new Set(names.map((name) => name.toLowerCase()));
  const found = Object.keys(env).find((key) => lowered.has(key.toLowerCase()));
  return found ? env[found] : undefined;
}

function pathEntries(env, platform) {
  const value = envValue(env, ['PATH', 'Path', 'path']) || '';
  const delimiter = isWindows(platform) ? ';' : path.delimiter;
  return value.split(delimiter).filter(Boolean);
}

function windowsPathExtensions(env) {
  const value = envValue(env, ['PATHEXT', 'PathExt', 'pathext']) || '.COM;.EXE;.BAT;.CMD';
  return value
    .split(';')
    .map((extension) => extension.trim())
    .filter(Boolean)
    .map((extension) => extension.startsWith('.') ? extension : `.${extension}`);
}

function hasPathSeparator(command, platform) {
  return isWindows(platform) ? /[\\/]/.test(command) : command.includes(path.sep);
}

function commandNames(command, { env = process.env, platform = process.platform } = {}) {
  if (!isWindows(platform) || pathApiFor(platform).extname(command)) {
    return [command];
  }
  return windowsPathExtensions(env).map((extension) => `${command}${extension}`);
}

function knownWindowsShim(command, platform) {
  if (!isWindows(platform) || hasPathSeparator(command, platform) || pathApiFor(platform).extname(command)) {
    return '';
  }
  return WINDOWS_SHIM_COMMANDS.has(command.toLowerCase()) ? `${command}.cmd` : '';
}

export function resolveCommand(command, {
  env = process.env,
  existsSync = fs.existsSync,
  platform = process.platform
} = {}) {
  if (!isWindows(platform)) {
    return command;
  }

  const pathApi = pathApiFor(platform);
  const names = commandNames(command, { env, platform });

  if (hasPathSeparator(command, platform)) {
    const match = names.find((candidate) => existsSync(candidate));
    return match || knownWindowsShim(command, platform) || command;
  }

  for (const directory of pathEntries(env, platform)) {
    for (const name of names) {
      const candidate = pathApi.join(directory, name);
      if (existsSync(candidate)) {
        return candidate;
      }
    }
  }

  return knownWindowsShim(command, platform) || command;
}

function quoteCmdArg(value) {
  const text = String(value);
  if (text.length === 0) {
    return '""';
  }
  return `"${text.replace(/"/g, '\\"')}"`;
}

function shouldUseCmd(command, platform) {
  if (!isWindows(platform)) {
    return false;
  }
  return WINDOWS_BATCH_EXTENSIONS.has(path.win32.extname(command).toLowerCase());
}

function spawnInvocation(command, args, { env, platform }) {
  if (!shouldUseCmd(command, platform)) {
    return { command, args, windowsVerbatimArguments: false };
  }
  return {
    command: envValue(env, ['ComSpec', 'COMSPEC']) || 'cmd.exe',
    args: ['/d', '/s', '/c', `call ${[command, ...args].map(quoteCmdArg).join(' ')}`],
    windowsVerbatimArguments: true
  };
}

export function runProcess(command, args = [], {
  cwd,
  encoding = 'utf8',
  env = process.env,
  existsSync = fs.existsSync,
  platform = process.platform,
  spawnSyncImpl = spawnSync,
  stdio = 'pipe'
} = {}) {
  const resolvedCommand = resolveCommand(command, { env, existsSync, platform });
  const invocation = spawnInvocation(resolvedCommand, args, { env, platform });
  const result = spawnSyncImpl(invocation.command, invocation.args, {
    cwd,
    encoding,
    env,
    stdio,
    windowsVerbatimArguments: invocation.windowsVerbatimArguments,
    windowsHide: true
  });
  result.originalCommand = command;
  result.resolvedCommand = resolvedCommand;
  result.spawnCommand = invocation.command;
  result.spawnArgs = invocation.args;
  return result;
}

export function canRun(command, args = ['--version'], options = {}) {
  const result = runProcess(command, args, { ...options, stdio: 'ignore' });
  return !result.error && result.status === 0;
}

export function createProcessRunner(defaultOptions = {}) {
  return {
    canRun(command, args = ['--version'], options = {}) {
      return canRun(command, args, { ...defaultOptions, ...options });
    },
    resolveCommand(command, options = {}) {
      return resolveCommand(command, { ...defaultOptions, ...options });
    },
    run(command, args = [], options = {}) {
      return runProcess(command, args, { ...defaultOptions, ...options });
    }
  };
}

export const defaultProcessRunner = createProcessRunner();
