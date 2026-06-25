import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { readJson } from '../tools/common.js';
import { validateConfigSafety } from '../tools/config-safety-checker.js';

function withRoot(fn) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-production-safety-'));
  try {
    return fn(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function write(root, file, content) {
  const absolute = path.join(root, file);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, content);
}

function safeProdConfig() {
  return [
    'spring:',
    '  datasource:',
    '    druid:',
    '      master:',
    '        url: ${DB_URL}',
    '        username: ${DB_USERNAME}',
    '        password: ${DB_PASSWORD}',
    '      statViewServlet:',
    '        enabled: false',
    '        login-username: ${DRUID_LOGIN_USERNAME}',
    '        login-password: ${DRUID_LOGIN_PASSWORD}',
    '  data:',
    '    redis:',
    '      host: ${REDIS_HOST}',
    '      port: ${REDIS_PORT:6379}',
    '      database: ${REDIS_DATABASE:0}',
    '      password: ${REDIS_PASSWORD}',
    'token:',
    '  secret: ${TOKEN_SECRET}',
    'springdoc:',
    '  swagger-ui:',
    '    enabled: false',
    ''
  ].join('\n');
}

function safeSecurityConfig() {
  return [
    'class SecurityConfig {',
    '  void configure() {',
    '    requests.requestMatchers("/swagger-ui.html", "/v3/api-docs/**", "/swagger-ui/**").permitAll();',
    '  }',
    '}',
    ''
  ].join('\n');
}

test('production checker fails when application-prod.yml is missing', () => withRoot((root) => {
  write(root, 'ruoyi-framework/src/main/java/com/ruoyi/framework/config/SecurityConfig.java', safeSecurityConfig());

  const result = validateConfigSafety({ root, prod: true });
  assert.ok(result.failures.some((failure) => failure.code === 'prod-config-missing'));
}));

test('production checker blocks default secrets and local database values', () => withRoot((root) => {
  write(root, 'ruoyi-admin/src/main/resources/application-prod.yml', [
    'spring:',
    '  datasource:',
    '    druid:',
    '      master:',
    '        url: jdbc:mysql://localhost:3306/ry-vue',
    '        username: root',
    '        password: password',
    '      statViewServlet:',
    '        enabled: true',
    '        login-password: 123456',
    'token:',
    '  secret: abcdefghijklmnopqrstuvwxyz',
    'springdoc:',
    '  swagger-ui:',
    '    enabled: true',
    ''
  ].join('\n'));
  write(root, 'ruoyi-framework/src/main/java/com/ruoyi/framework/config/SecurityConfig.java', safeSecurityConfig());

  const result = validateConfigSafety({ root, prod: true });
  for (const code of [
    'token-secret-default',
    'db-root-user',
    'db-default-password',
    'druid-default-password',
    'mysql-localhost-production',
    'prod-db-url-env-missing',
    'prod-db-username-env-missing',
    'prod-db-password-env-missing',
    'prod-token-secret-env-missing',
    'prod-druid-console-enabled',
    'prod-swagger-ui-enabled'
  ]) {
    assert.ok(result.failures.some((failure) => failure.code === code), `expected ${code}`);
  }
}));

test('production checker blocks druid permitAll in SecurityConfig', () => withRoot((root) => {
  write(root, 'ruoyi-admin/src/main/resources/application-prod.yml', safeProdConfig());
  write(root, 'ruoyi-framework/src/main/java/com/ruoyi/framework/config/SecurityConfig.java', [
    'class SecurityConfig {',
    '  void configure() {',
    '    requests.requestMatchers("/swagger-ui.html", "/v3/api-docs/**", "/swagger-ui/**", "/druid/**").permitAll();',
    '  }',
    '}',
    ''
  ].join('\n'));

  const result = validateConfigSafety({ root, prod: true });
  assert.ok(result.failures.some((failure) => failure.code === 'druid-permit-all'));
}));

test('production checker accepts environment placeholders and disabled consoles', () => withRoot((root) => {
  write(root, 'ruoyi-admin/src/main/resources/application-prod.yml', safeProdConfig());
  write(root, 'ruoyi-framework/src/main/java/com/ruoyi/framework/config/SecurityConfig.java', safeSecurityConfig());

  const result = validateConfigSafety({ root, prod: true });
  assert.deepEqual(result.failures, []);
}));

test('default config safety keeps development risky values as warnings', () => withRoot((root) => {
  write(root, 'ruoyi-admin/src/main/resources/application-druid.yml', [
    'spring:',
    '  datasource:',
    '    druid:',
    '      master:',
    '        url: jdbc:mysql://localhost:3306/ry-vue',
    '        username: root',
    '        password: password',
    '      statViewServlet:',
    '        login-password: 123456',
    ''
  ].join('\n'));

  const result = validateConfigSafety({ root });
  assert.deepEqual(result.failures, []);
  assert.ok(result.warnings.some((warning) => warning.code === 'db-root-user'));
  assert.ok(result.warnings.some((warning) => warning.code === 'db-default-password'));
  assert.ok(result.warnings.some((warning) => warning.code === 'druid-default-password'));
}));

test('package scripts expose production safety and release verification', () => {
  const pkg = readJson('package.json');
  assert.equal(pkg.scripts['check:prod-safety'], 'node tools/config-safety-checker.js --prod');
  assert.equal(
    pkg.scripts['verify:release'],
    'npm run check && npm run check:prod-safety && mvn -pl ruoyi-admin -am -DskipTests compile && npm --prefix ruoyi-ui run build:prod'
  );
});

test('verify:release is explicit and not only check:runtime execution', () => {
  const script = readJson('package.json').scripts['verify:release'];
  assert.ok(script.includes('npm run check'));
  assert.ok(script.includes('npm run check:prod-safety'));
  assert.ok(script.includes('mvn -pl ruoyi-admin -am -DskipTests compile'));
  assert.ok(script.includes('npm --prefix ruoyi-ui run build:prod'));
  assert.equal(/check:runtime\s+--execute/.test(script), false);
});
