import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const thisFile = fileURLToPath(import.meta.url);
export const rootDir = path.resolve(path.dirname(thisFile), '..');

export function projectPath(...parts) {
  const resolved = path.resolve(rootDir, ...parts);
  if (resolved !== rootDir && !resolved.startsWith(`${rootDir}${path.sep}`)) {
    throw new Error(`Path escapes project root: ${parts.join('/')}`);
  }
  return resolved;
}

export function toPosix(filePath) {
  return filePath.split(path.sep).join('/');
}

export function readText(relativePath) {
  return fs.readFileSync(projectPath(relativePath), 'utf8');
}

export function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

export function fileExists(relativePath) {
  return fs.existsSync(projectPath(relativePath));
}

export function listFiles(relativeDir, predicate = () => true) {
  const base = projectPath(relativeDir);
  if (!fs.existsSync(base)) {
    return [];
  }
  const out = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else {
        const rel = toPosix(path.relative(rootDir, full));
        if (predicate(rel)) {
          out.push(rel);
        }
      }
    }
  };
  walk(base);
  return out.sort();
}

export function listDirectories(relativeDir) {
  const base = projectPath(relativeDir);
  if (!fs.existsSync(base)) {
    return [];
  }
  return fs.readdirSync(base, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

export function ensure(condition, message, errors) {
  if (!condition) {
    errors.push(message);
  }
}

export function hasHeading(text, heading) {
  return new RegExp(`^${escapeRegExp(heading)}\\s*$`, 'm').test(text);
}

export function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function formatJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function normalizeNewlines(value) {
  return value.replace(/\r\n/g, '\n');
}

export function writeOrCheck(relativePath, content, checkMode, errors) {
  const absolute = projectPath(relativePath);
  const current = fs.existsSync(absolute) ? fs.readFileSync(absolute, 'utf8') : '';
  if (normalizeNewlines(current) === normalizeNewlines(content)) {
    return;
  }
  if (checkMode) {
    errors.push(`${relativePath} is out of date. Run the non-check command to regenerate it.`);
    return;
  }
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, content);
}

export function finish(name, errors) {
  if (errors.length > 0) {
    console.error(`${name}: failed`);
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exitCode = 1;
    return false;
  }
  console.log(`${name}: ok`);
  return true;
}

export function isCli(importMetaUrl) {
  return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(importMetaUrl);
}
