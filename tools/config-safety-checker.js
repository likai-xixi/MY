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

const PROD_CONFIG_FILE = 'ruoyi-admin/src/main/resources/application-prod.yml';
const SECURITY_CONFIG_FILE = 'ruoyi-framework/src/main/java/com/ruoyi/framework/config/SecurityConfig.java';

const REQUIRED_PROD_PLACEHOLDERS = [
  ['prod-db-url-env-missing', '${DB_URL}', 'Production datasource URL must use ${DB_URL}.'],
  ['prod-db-username-env-missing', '${DB_USERNAME}', 'Production datasource username must use ${DB_USERNAME}.'],
  ['prod-db-password-env-missing', '${DB_PASSWORD}', 'Production datasource password must use ${DB_PASSWORD}.'],
  ['prod-token-secret-env-missing', '${TOKEN_SECRET}', 'Production token secret must use ${TOKEN_SECRET}.'],
  ['prod-redis-host-env-missing', '${REDIS_HOST}', 'Production Redis host must use ${REDIS_HOST}.'],
  ['prod-redis-password-env-missing', '${REDIS_PASSWORD}', 'Production Redis password must use ${REDIS_PASSWORD}.']
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
  const addRisk = (code, suggestion) => {
    if (!risks.some(([existing]) => existing === code)) {
      risks.push([code, suggestion]);
    }
  };
  if (/\bsecret\s*[:=]\s*abcdefghijklmnopqrstuvwxyz\b/i.test(trimmed)) {
    addRisk('token-secret-default', 'Use ${TOKEN_SECRET}.');
  }
  if (/\busername\s*[:=]\s*root\b/i.test(trimmed)) {
    addRisk('db-root-user', 'Use ${DB_USERNAME} with a least-privilege production user.');
  }
  if (/\bpassword\s*[:=]\s*password\b/i.test(trimmed)) {
    addRisk('db-default-password', 'Use ${DB_PASSWORD}.');
  }
  if (/\blogin-password\s*[:=]\s*123456\b/i.test(trimmed)) {
    addRisk('druid-default-password', 'Use ${DRUID_LOGIN_PASSWORD}.');
  }
  if (/jdbc:mysql:\/\/localhost/i.test(trimmed)) {
    addRisk('mysql-localhost-production', 'Use ${DB_URL} with a production JDBC URL.');
  }
  if (/localhost:3306/i.test(trimmed)) {
    addRisk('mysql-localhost-production', 'Use ${DB_URL} with a production JDBC URL.');
  }
  if (/jdbc:postgresql:\/\/localhost/i.test(trimmed)) {
    addRisk('postgres-localhost-production', 'Use ${DB_HOST} or a production JDBC URL.');
  }
  const recent = lines.slice(Math.max(0, index - 5), index + 1).join('\n');
  if (/\bredis\b/i.test(recent) && /\bhost\s*[:=]\s*localhost\b/i.test(trimmed)) {
    addRisk('redis-localhost-production', 'Use ${REDIS_HOST} for production.');
  }
  if (!isPlaceholder(trimmed) && /\b(accessKey|secretKey|oss.*secret|minio.*secret)\b\s*[:=]\s*["']?[^"'\s#]+/i.test(trimmed)) {
    addRisk('plaintext-storage-secret', 'Use an environment variable secret placeholder.');
  }
  return risks;
}

function stripInlineComment(value) {
  return String(value || '').replace(/\s+#.*$/, '').trim();
}

function unquote(value) {
  const trimmed = stripInlineComment(value);
  const match = trimmed.match(/^['"](.+)['"]$/);
  return match ? match[1] : trimmed;
}

function yamlScalarValue(text, pathParts) {
  const lines = String(text || '').split(/\r?\n/);
  const stack = [];
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim() || line.trim().startsWith('#')) {
      continue;
    }
    const match = line.match(/^(\s*)([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) {
      continue;
    }
    const indent = match[1].length;
    const key = match[2];
    const rawValue = match[3] || '';
    while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }
    stack.push({ key, indent });
    const currentPath = stack.map((item) => item.key);
    if (currentPath.length === pathParts.length
      && currentPath.every((part, partIndex) => part === pathParts[partIndex])) {
      return { value: unquote(rawValue), line: index + 1 };
    }
  }
  return { value: '', line: 0 };
}

function addFailure(result, { file, line = 0, code, message, detail = '' }) {
  result.failures.push(issue({ file, line, code, message, detail }));
}

function validateProductionConfig(root, result) {
  if (!pathExists(root, PROD_CONFIG_FILE)) {
    addFailure(result, {
      file: PROD_CONFIG_FILE,
      code: 'prod-config-missing',
      message: 'production profile is missing',
      detail: 'Create ruoyi-admin/src/main/resources/application-prod.yml.'
    });
    return;
  }

  const text = readText(root, PROD_CONFIG_FILE);
  const lines = text.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    for (const [code, suggestion] of riskyLine(lines, index)) {
      addFailure(result, {
        file: PROD_CONFIG_FILE,
        line: index + 1,
        code,
        message: 'production configuration uses an unsafe default',
        detail: suggestion
      });
    }
  }

  for (const [code, placeholder, detail] of REQUIRED_PROD_PLACEHOLDERS) {
    if (!text.includes(placeholder)) {
      addFailure(result, {
        file: PROD_CONFIG_FILE,
        code,
        message: 'production configuration must use environment placeholders',
        detail
      });
    }
  }

  const druidEnabled = yamlScalarValue(text, ['spring', 'datasource', 'druid', 'statViewServlet', 'enabled']);
  if (druidEnabled.value.toLowerCase() !== 'false') {
    addFailure(result, {
      file: PROD_CONFIG_FILE,
      line: druidEnabled.line,
      code: 'prod-druid-console-enabled',
      message: 'production Druid console must be disabled by default',
      detail: 'Set spring.datasource.druid.statViewServlet.enabled to false.'
    });
  }

  const swaggerEnabled = yamlScalarValue(text, ['springdoc', 'swagger-ui', 'enabled']);
  if (swaggerEnabled.value.toLowerCase() !== 'false') {
    addFailure(result, {
      file: PROD_CONFIG_FILE,
      line: swaggerEnabled.line,
      code: 'prod-swagger-ui-enabled',
      message: 'production Swagger UI must be disabled by default',
      detail: 'Set springdoc.swagger-ui.enabled to false.'
    });
  }
}

function validateSecurityConfig(root, result) {
  if (!pathExists(root, SECURITY_CONFIG_FILE)) {
    addFailure(result, {
      file: SECURITY_CONFIG_FILE,
      code: 'security-config-missing',
      message: 'SecurityConfig is missing',
      detail: 'Production safety cannot verify Druid anonymous access.'
    });
    return;
  }
  const text = readText(root, SECURITY_CONFIG_FILE);
  const compact = text.replace(/\s+/g, ' ');
  const druidPermitAll = /requestMatchers\s*\([^)]*["']\/druid\/\*\*["'][^)]*\)\s*\.permitAll\s*\(/.test(compact);
  if (druidPermitAll) {
    const line = text.split(/\r?\n/).findIndex((item) => item.includes('/druid/**')) + 1;
    addFailure(result, {
      file: SECURITY_CONFIG_FILE,
      line,
      code: 'druid-permit-all',
      message: 'Druid monitor path must not be permitAll',
      detail: 'Remove /druid/** from anonymous Spring Security matchers.'
    });
  }
}

export function validateProductionSafety({ root = process.cwd() } = {}) {
  const result = emptyResult();
  validateProductionConfig(root, result);
  validateSecurityConfig(root, result);
  return result;
}

export function validateConfigSafety({ root = process.cwd(), prod = false } = {}) {
  if (prod) {
    return validateProductionSafety({ root });
  }
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
  const prod = process.argv.includes('--prod');
  printIssues(prod ? 'check:prod-safety' : 'check:config-safety', validateConfigSafety({ root: parseRootArg(), prod }));
}
