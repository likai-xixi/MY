import {
  emptyResult,
  issue,
  listFiles,
  parseRootArg,
  pathExists,
  printIssues,
  readText
} from './governance-checker-utils.js';

const CONFIG_PATTERNS = [
  /^ruoyi-admin\/src\/main\/resources\/application.*\.(ya?ml|properties)$/i,
  /(^|\/)(deploy|deployment|prod|production|env)(\/|$)/i,
  /(^|\/)\.env(\.|$)?/i
];

const DOC_PATTERNS = [
  /^README\.md$/i,
  /^docs\/.*\.md$/i
];

function isRelevantFile(file) {
  return CONFIG_PATTERNS.some((pattern) => pattern.test(file))
    || DOC_PATTERNS.some((pattern) => pattern.test(file));
}

function isProdFile(file, text) {
  return /(^|\/|-)prod(uction)?(\.|-|\/|$)/i.test(file)
    || /spring\.profiles\.active\s*=\s*prod\b/i.test(text)
    || /profiles:\s*\n\s*active:\s*prod\b/i.test(text)
    || /(^|\n)\s*active:\s*prod\b/i.test(text);
}

function isProdDocLine(file, line) {
  if (!DOC_PATTERNS.some((pattern) => pattern.test(file))) {
    return false;
  }
  return /(prod|production|生产|部署)/i.test(line);
}

function isPlaceholder(line) {
  return /\$\{[A-Z0-9_]+(?::[^}]*)?}/.test(line);
}

function riskyLine(lines, index) {
  const line = lines[index];
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('<!--')) {
    return [];
  }
  const risks = [];
  if (/\bsecret\s*[:=]\s*abcdefghijklmnopqrstuvwxyz\b/i.test(trimmed)) {
    risks.push(['token-secret-default', 'Use ${TOKEN_SECRET}.']);
  }
  if (/\busername\s*[:=]\s*root\b/i.test(trimmed)) {
    risks.push(['db-root-user', 'Use ${DB_USERNAME} with a least-privilege production user.']);
  }
  if (/\bpassword\s*[:=]\s*password\b/i.test(trimmed)) {
    risks.push(['db-default-password', 'Use ${DB_PASSWORD}.']);
  }
  if (/\blogin-password\s*[:=]\s*123456\b/i.test(trimmed)) {
    risks.push(['druid-default-password', 'Use ${DRUID_LOGIN_PASSWORD}.']);
  }
  if (/jdbc:mysql:\/\/localhost/i.test(trimmed)) {
    risks.push(['mysql-localhost-production', 'Use ${DB_HOST} or a production JDBC URL.']);
  }
  if (/jdbc:postgresql:\/\/localhost/i.test(trimmed)) {
    risks.push(['postgres-localhost-production', 'Use ${DB_HOST} or a production JDBC URL.']);
  }
  const recent = lines.slice(Math.max(0, index - 5), index + 1).join('\n');
  if (/\bredis\b/i.test(recent) && /\bhost\s*[:=]\s*localhost\b/i.test(trimmed)) {
    risks.push(['redis-localhost-production', 'Use ${REDIS_HOST} for production.']);
  }
  if (!isPlaceholder(trimmed) && /\b(accessKey|secretKey|oss.*secret|minio.*secret)\b\s*[:=]\s*["']?[^"'\s#]+/i.test(trimmed)) {
    risks.push(['plaintext-storage-secret', 'Use an environment variable secret placeholder.']);
  }
  return risks;
}

export function validateConfigSafety({ root = process.cwd() } = {}) {
  const result = emptyResult();
  const files = listFiles(root, '.', (file) => isRelevantFile(file));
  for (const file of files) {
    if (!pathExists(root, file)) {
      continue;
    }
    const text = readText(root, file);
    const prodFile = isProdFile(file, text);
    const lines = text.split(/\r?\n/);
    for (let index = 0; index < lines.length; index += 1) {
      for (const [code, suggestion] of riskyLine(lines, index)) {
        const prod = prodFile || isProdDocLine(file, lines[index]);
        const target = prod ? result.failures : result.warnings;
        target.push(issue({
          file,
          line: index + 1,
          code,
          message: prod ? 'production configuration uses an unsafe default' : 'development/default configuration contains a production-unsafe value',
          detail: suggestion
        }));
      }
    }
  }
  return result;
}

if (process.argv[1] && process.argv[1].endsWith('config-safety-checker.js')) {
  printIssues('check:config-safety', validateConfigSafety({ root: parseRootArg() }));
}
