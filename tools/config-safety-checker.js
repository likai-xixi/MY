import {
  emptyResult,
  issue,
  listFiles,
  parseRootArg,
  pathExists,
  printIssues,
  readText
} from './governance-checker-utils.js';
import { isAlias, isMap, isScalar, LineCounter, parseDocument } from 'yaml';

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
const DRUID_PROPERTIES_FILE = 'ruoyi-framework/src/main/java/com/ruoyi/framework/config/properties/DruidProperties.java';
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

function yamlScalarValue(text, pathParts) {
  const lineCounter = new LineCounter();
  const document = parseDocument(String(text || ''), {
    lineCounter,
    prettyErrors: false,
    uniqueKeys: true
  });
  if (document.errors.length > 0) {
    return { value: '', line: 0 };
  }
  const located = yamlNodeAtPath(document, pathParts);
  if (located.found && isScalar(located.node)) {
    const line = Array.isArray(located.rawNode?.range) ? lineCounter.linePos(located.rawNode.range[0]).line : 0;
    return { value: String(located.node.value ?? ''), line };
  }
  return { value: '', line: 0 };
}

function addFailure(result, { file, line = 0, code, message, detail = '' }) {
  result.failures.push(issue({ file, line, code, message, detail }));
}

function addFailureOnce(result, failure) {
  if (!result.failures.some((existing) => existing.code === failure.code && existing.file === failure.file)) {
    addFailure(result, failure);
  }
}

function activeValueAnnotationIndexes(source) {
  const text = String(source || '');
  const indexes = [];
  let state = 'code';
  for (let index = 0; index < text.length;) {
    if (state === 'code') {
      if (text.startsWith('//', index)) {
        state = 'line-comment';
        index += 2;
      } else if (text.startsWith('/*', index)) {
        state = 'block-comment';
        index += 2;
      } else if (text.startsWith('"""', index)) {
        state = 'text-block';
        index += 3;
      } else if (text[index] === '"') {
        state = 'string';
        index += 1;
      } else if (text[index] === "'") {
        state = 'char';
        index += 1;
      } else if (text.startsWith('@Value', index) && !/[A-Za-z0-9_$]/.test(text[index + 6] || '')) {
        indexes.push(index);
        index += 6;
      } else {
        index += 1;
      }
      continue;
    }

    if (state === 'line-comment') {
      if (text[index] === '\n' || text[index] === '\r') {
        state = 'code';
      }
      index += 1;
      continue;
    }

    if (state === 'block-comment') {
      if (text.startsWith('*/', index)) {
        state = 'code';
        index += 2;
      } else {
        index += 1;
      }
      continue;
    }

    if (state === 'text-block') {
      if (text[index] === '\\') {
        index += Math.min(2, text.length - index);
      } else if (text.startsWith('"""', index)) {
        state = 'code';
        index += 3;
      } else {
        index += 1;
      }
      continue;
    }

    if ((state === 'string' || state === 'char') && (text[index] === '\n' || text[index] === '\r')) {
      return {
        indexes,
        lexicalError: `${state} literal contains an unescaped line break`
      };
    }
    if (text[index] === '\\') {
      index += Math.min(2, text.length - index);
    } else if ((state === 'string' && text[index] === '"') || (state === 'char' && text[index] === "'")) {
      state = 'code';
      index += 1;
    } else {
      index += 1;
    }
  }
  return {
    indexes,
    lexicalError: state === 'code' || state === 'line-comment' ? '' : `unterminated ${state}`
  };
}

function skipJavaWhitespace(text, start) {
  let index = start;
  while (/\s/.test(text[index] || '')) {
    index += 1;
  }
  return index;
}

function parseJavaStringLiteral(text, start) {
  if (text[start] !== '"' || text.startsWith('"""', start)) {
    return null;
  }
  let value = '';
  for (let index = start + 1; index < text.length;) {
    if (text[index] === '\n' || text[index] === '\r') {
      return null;
    }
    if (text[index] === '\\') {
      if (index + 1 >= text.length) {
        return null;
      }
      value += text.slice(index, index + 2);
      index += 2;
    } else if (text[index] === '"') {
      return { value, next: index + 1 };
    } else {
      value += text[index];
      index += 1;
    }
  }
  return null;
}

function parseValueAnnotation(text, start) {
  let index = skipJavaWhitespace(text, start + 6);
  if (text[index] !== '(') {
    return null;
  }
  index = skipJavaWhitespace(text, index + 1);
  const literal = parseJavaStringLiteral(text, index);
  if (!literal) {
    return null;
  }
  index = skipJavaWhitespace(text, literal.next);
  if (text[index] !== ')') {
    return null;
  }
  const placeholder = literal.value.match(/^\$\{([^}:]+)(?::[^}]*)?\}$/);
  if (!placeholder || !placeholder[1].trim()) {
    return null;
  }
  return {
    key: placeholder[1].trim(),
    line: text.slice(0, start).split(/\r?\n/).length
  };
}

function extractDruidPropertyContract(source) {
  const text = String(source || '');
  const scan = activeValueAnnotationIndexes(text);
  const parsed = scan.indexes.map((index) => parseValueAnnotation(text, index)).filter(Boolean);
  const bindings = [...new Map(parsed.map((binding) => [binding.key, binding])).values()];
  return {
    annotationCount: scan.indexes.length,
    parsedCount: parsed.length,
    bindings,
    lexicalError: scan.lexicalError
  };
}

function resolveYamlAlias(document, node) {
  let current = node;
  const seen = new Set();
  while (isAlias(current)) {
    if (seen.has(current)) {
      return null;
    }
    seen.add(current);
    current = current.resolve(document);
  }
  return current;
}

function yamlNodeAtPath(document, pathParts) {
  let current = document.contents;
  let rawNode = current;
  for (const part of pathParts) {
    const resolved = resolveYamlAlias(document, current);
    if (resolved === null) {
      return { found: true, node: null, rawNode };
    }
    if (!isMap(resolved)) {
      return { found: false, node: undefined, rawNode };
    }
    rawNode = resolved.get(part, true);
    if (rawNode === undefined) {
      return { found: false, node: undefined, rawNode };
    }
    current = rawNode;
  }
  return { found: true, node: resolveYamlAlias(document, current), rawNode };
}

function validateProductionDruidCompleteness(root, result) {
  if (!pathExists(root, DRUID_PROPERTIES_FILE)) {
    addFailureOnce(result, {
      file: DRUID_PROPERTIES_FILE,
      code: 'druid-properties-source-missing',
      message: 'Druid property source is missing',
      detail: 'Cannot derive the production Druid configuration contract without DruidProperties.java.'
    });
    return;
  }

  const contract = extractDruidPropertyContract(readText(root, DRUID_PROPERTIES_FILE));
  if (contract.lexicalError) {
    addFailureOnce(result, {
      file: DRUID_PROPERTIES_FILE,
      code: 'druid-properties-source-invalid',
      message: 'Druid property source has an invalid lexical structure',
      detail: `${contract.lexicalError}. Fix Java source before deriving the production contract.`
    });
    return;
  }
  if (contract.annotationCount === 0) {
    addFailureOnce(result, {
      file: DRUID_PROPERTIES_FILE,
      code: 'druid-required-properties-empty',
      message: 'No required Druid properties were extracted',
      detail: 'Keep @Value property declarations machine-readable so production completeness fails closed.'
    });
    return;
  }
  if (contract.parsedCount !== contract.annotationCount || contract.bindings.length === 0) {
    addFailureOnce(result, {
      file: DRUID_PROPERTIES_FILE,
      code: 'druid-properties-source-invalid',
      message: 'Druid property source contains an unsupported @Value binding',
      detail: `Parsed ${contract.parsedCount} of ${contract.annotationCount} @Value declarations. Use a literal Spring placeholder so the production contract remains machine-readable.`
    });
    return;
  }

  if (!pathExists(root, PROD_CONFIG_FILE)) {
    addFailureOnce(result, {
      file: PROD_CONFIG_FILE,
      code: 'prod-config-missing',
      message: 'production profile is missing',
      detail: 'Create ruoyi-admin/src/main/resources/application-prod.yml.'
    });
    return;
  }

  const lineCounter = new LineCounter();
  const document = parseDocument(readText(root, PROD_CONFIG_FILE), {
    lineCounter,
    prettyErrors: false,
    uniqueKeys: true
  });
  if (document.errors.length > 0) {
    const [error] = document.errors;
    addFailureOnce(result, {
      file: PROD_CONFIG_FILE,
      code: 'prod-config-invalid-yaml',
      message: 'production profile YAML is invalid',
      detail: String(error?.message || error).split(/\r?\n/, 1)[0]
    });
    return;
  }

  for (const binding of contract.bindings) {
    const located = yamlNodeAtPath(document, binding.key.split('.'));
    if (!located.found) {
      addFailure(result, {
        file: PROD_CONFIG_FILE,
        code: 'prod-druid-property-missing',
        message: 'production profile is missing a Java-required Druid property',
        detail: `Required by DruidProperties.java:${binding.line}: ${binding.key}`
      });
      continue;
    }
    const { node, rawNode } = located;
    const value = isScalar(node) ? node.value : undefined;
    if (!isScalar(node) || value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
      const line = Array.isArray(rawNode?.range) ? lineCounter.linePos(rawNode.range[0]).line : 0;
      addFailure(result, {
        file: PROD_CONFIG_FILE,
        line,
        code: 'prod-druid-property-invalid',
        message: 'production Druid property must be a non-empty scalar',
        detail: `Required by DruidProperties.java:${binding.line}: ${binding.key}`
      });
    }
  }
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
  validateProductionDruidCompleteness(root, result);
  validateSecurityConfig(root, result);
  return result;
}

export function validateConfigSafety({ root = process.cwd(), prod = false } = {}) {
  if (prod) {
    return validateProductionSafety({ root });
  }
  const result = emptyResult();
  validateProductionDruidCompleteness(root, result);
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
