import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { readJson } from '../tools/common.js';
import { validateConfigSafety } from '../tools/config-safety-checker.js';
import { MAVEN_INTEGRATION_ARGS, RELEASE_NPM_STEPS } from '../tools/release-verifier.js';

const DRUID_PROPERTY_VALUES = Object.freeze({
  initialSize: '5',
  minIdle: '10',
  maxActive: '20',
  maxWait: '60000',
  connectTimeout: '30000',
  socketTimeout: '60000',
  timeBetweenEvictionRunsMillis: '60000',
  minEvictableIdleTimeMillis: '300000',
  maxEvictableIdleTimeMillis: '900000',
  validationQuery: 'SELECT 1',
  testWhileIdle: 'true',
  testOnBorrow: 'false',
  testOnReturn: 'false'
});

const DRUID_PROPERTY_KEYS = Object.keys(DRUID_PROPERTY_VALUES);

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

function safeProdConfig({ omitDruidKey = '', extraDruidProperties = {} } = {}) {
  const poolProperties = Object.entries({ ...DRUID_PROPERTY_VALUES, ...extraDruidProperties })
    .filter(([key]) => key !== omitDruidKey)
    .map(([key, value]) => `      ${key}: ${value}`);
  return [
    'spring:',
    '  datasource:',
    '    druid:',
    '      master:',
    '        url: ${DB_URL}',
    '        username: ${DB_USERNAME}',
    '        password: ${DB_PASSWORD}',
    ...poolProperties,
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

function druidPropertiesSource(extraKeys = []) {
  const keys = [...DRUID_PROPERTY_KEYS, ...extraKeys];
  return [
    'class DruidProperties {',
    ...keys.flatMap((key, index) => [
      `  @Value("\${spring.datasource.druid.${key}}")`,
      `  private String property${index};`
    ]),
    '}',
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

function writeDruidProperties(root, extraKeys = []) {
  write(
    root,
    'ruoyi-framework/src/main/java/com/ruoyi/framework/config/properties/DruidProperties.java',
    druidPropertiesSource(extraKeys)
  );
}

function assertSingleFailure(result, { code, file, detail }) {
  assert.equal(result.failures.length, 1, JSON.stringify(result.failures, null, 2));
  assert.equal(result.failures[0].code, code);
  assert.equal(result.failures[0].file, file);
  if (detail) {
    assert.match(result.failures[0].detail, detail);
  }
}

test('production checker fails when application-prod.yml is missing', () => withRoot((root) => {
  writeDruidProperties(root);
  write(root, 'ruoyi-framework/src/main/java/com/ruoyi/framework/config/SecurityConfig.java', safeSecurityConfig());

  const result = validateConfigSafety({ root, prod: true });
  assert.ok(result.failures.some((failure) => failure.code === 'prod-config-missing'));
}));

test('production checker blocks default secrets and local database values', () => withRoot((root) => {
  writeDruidProperties(root);
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
  writeDruidProperties(root);
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
  writeDruidProperties(root);
  write(root, 'ruoyi-framework/src/main/java/com/ruoyi/framework/config/SecurityConfig.java', safeSecurityConfig());

  const result = validateConfigSafety({ root, prod: true });
  const normalResult = validateConfigSafety({ root });
  assert.deepEqual(result.failures, []);
  assert.deepEqual(normalResult.failures, []);
}));

test('default config safety keeps development risky values as warnings', () => withRoot((root) => {
  write(root, 'ruoyi-admin/src/main/resources/application-prod.yml', safeProdConfig());
  writeDruidProperties(root);
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

test('configuration safety fails closed when DruidProperties source is missing', () => withRoot((root) => {
  write(root, 'ruoyi-admin/src/main/resources/application-prod.yml', safeProdConfig());

  const result = validateConfigSafety({ root });

  assertSingleFailure(result, {
    code: 'druid-properties-source-missing',
    file: 'ruoyi-framework/src/main/java/com/ruoyi/framework/config/properties/DruidProperties.java'
  });
}));

test('configuration safety fails closed when DruidProperties yields no required keys', () => withRoot((root) => {
  write(root, 'ruoyi-admin/src/main/resources/application-prod.yml', safeProdConfig());
  write(root, 'ruoyi-framework/src/main/java/com/ruoyi/framework/config/properties/DruidProperties.java', 'class DruidProperties {}\n');

  const result = validateConfigSafety({ root });

  assertSingleFailure(result, {
    code: 'druid-required-properties-empty',
    file: 'ruoyi-framework/src/main/java/com/ruoyi/framework/config/properties/DruidProperties.java'
  });
}));

const DECEPTIVE_VALUE_SOURCES = Object.freeze({
  'line comment': [
    'class DruidProperties {',
    '  // @Value("${spring.datasource.druid.maxActive}")',
    '}',
    ''
  ].join('\n'),
  'block comment': [
    'class DruidProperties {',
    '  /* @Value("${spring.datasource.druid.maxActive}") */',
    '}',
    ''
  ].join('\n'),
  'ordinary string': [
    'class DruidProperties {',
    '  String example = "@Value(\\"${spring.datasource.druid.maxActive}\\")";',
    '}',
    ''
  ].join('\n'),
  'text block': [
    'class DruidProperties {',
    '  String example = """',
    '    @Value("${spring.datasource.druid.maxActive}")',
    '    """;',
    '}',
    ''
  ].join('\n')
});

for (const [sourceKind, source] of Object.entries(DECEPTIVE_VALUE_SOURCES)) {
  test(`configuration safety ignores deceptive @Value text in a ${sourceKind}`, () => withRoot((root) => {
    write(root, 'ruoyi-admin/src/main/resources/application-prod.yml', safeProdConfig({
      extraDruidProperties: { deceptiveOnly: '1' }
    }));
    write(root, 'ruoyi-framework/src/main/java/com/ruoyi/framework/config/properties/DruidProperties.java', source);

    assertSingleFailure(validateConfigSafety({ root }), {
      code: 'druid-required-properties-empty',
      file: 'ruoyi-framework/src/main/java/com/ruoyi/framework/config/properties/DruidProperties.java'
    });
  }));
}

test('configuration safety rejects Java-invalid single-quoted @Value literals', () => withRoot((root) => {
  write(root, 'ruoyi-admin/src/main/resources/application-prod.yml', safeProdConfig());
  write(
    root,
    'ruoyi-framework/src/main/java/com/ruoyi/framework/config/properties/DruidProperties.java',
    [
      'class DruidProperties {',
      "  @Value('${spring.datasource.druid.maxActive}')",
      '  private String invalid;',
      '}',
      ''
    ].join('\n')
  );

  assertSingleFailure(validateConfigSafety({ root }), {
    code: 'druid-properties-source-invalid',
    file: 'ruoyi-framework/src/main/java/com/ruoyi/framework/config/properties/DruidProperties.java'
  });
}));

const INVALID_JAVA_SUFFIXES = Object.freeze({
  'unterminated block comment': '  /* unterminated',
  'unterminated ordinary string': '  String invalid = "unterminated;',
  'unterminated character literal': "  char invalid = 'x;",
  'unterminated text block': '  String invalid = """\n    unterminated',
  'raw newline in an ordinary string': '  String invalid = "line one\nline two";'
});

for (const [sourceKind, suffix] of Object.entries(INVALID_JAVA_SUFFIXES)) {
  test(`configuration safety rejects ${sourceKind} after valid bindings`, () => withRoot((root) => {
    const source = druidPropertiesSource().replace(/}\n$/, `${suffix}\n}\n`);
    write(root, 'ruoyi-admin/src/main/resources/application-prod.yml', safeProdConfig());
    write(root, 'ruoyi-framework/src/main/java/com/ruoyi/framework/config/properties/DruidProperties.java', source);

    assertSingleFailure(validateConfigSafety({ root }), {
      code: 'druid-properties-source-invalid',
      file: 'ruoyi-framework/src/main/java/com/ruoyi/framework/config/properties/DruidProperties.java'
    });
  }));
}

test('configuration safety permits a trailing line comment at end of Java source', () => withRoot((root) => {
  write(root, 'ruoyi-admin/src/main/resources/application-prod.yml', safeProdConfig());
  write(
    root,
    'ruoyi-framework/src/main/java/com/ruoyi/framework/config/properties/DruidProperties.java',
    `${druidPropertiesSource()}// trailing comment without newline`
  );

  assert.deepEqual(validateConfigSafety({ root }).failures, []);
}));

test('configuration safety fails closed when production YAML cannot be parsed', () => withRoot((root) => {
  write(root, 'ruoyi-admin/src/main/resources/application-prod.yml', 'spring:\n  datasource: [unterminated\n');
  writeDruidProperties(root);

  const result = validateConfigSafety({ root });

  assertSingleFailure(result, {
    code: 'prod-config-invalid-yaml',
    file: 'ruoyi-admin/src/main/resources/application-prod.yml'
  });
}));

test('configuration safety rejects duplicate production YAML keys', () => withRoot((root) => {
  const duplicate = safeProdConfig().replace('      maxActive: 20', '      maxActive: 20\n      maxActive: 21');
  write(root, 'ruoyi-admin/src/main/resources/application-prod.yml', duplicate);
  writeDruidProperties(root);

  assertSingleFailure(validateConfigSafety({ root }), {
    code: 'prod-config-invalid-yaml',
    file: 'ruoyi-admin/src/main/resources/application-prod.yml'
  });
}));

test('configuration completeness accepts false and zero scalar values', () => withRoot((root) => {
  const falsyScalars = safeProdConfig().replace('      initialSize: 5', '      initialSize: 0');
  write(root, 'ruoyi-admin/src/main/resources/application-prod.yml', falsyScalars);
  writeDruidProperties(root);
  write(root, 'ruoyi-framework/src/main/java/com/ruoyi/framework/config/SecurityConfig.java', safeSecurityConfig());

  assert.deepEqual(validateConfigSafety({ root }).failures, []);
  assert.deepEqual(validateConfigSafety({ root, prod: true }).failures, []);
}));

for (const key of DRUID_PROPERTY_KEYS) {
  test(`production checker rejects a profile missing Java-required Druid key ${key}`, () => withRoot((root) => {
    write(root, 'ruoyi-admin/src/main/resources/application-prod.yml', safeProdConfig({ omitDruidKey: key }));
    writeDruidProperties(root);
    write(root, 'ruoyi-framework/src/main/java/com/ruoyi/framework/config/SecurityConfig.java', safeSecurityConfig());

    const result = validateConfigSafety({ root, prod: true });

    assertSingleFailure(result, {
      code: 'prod-druid-property-missing',
      file: 'ruoyi-admin/src/main/resources/application-prod.yml',
      detail: new RegExp(`spring\\.datasource\\.druid\\.${key}`)
    });
  }));
}

test('normal configuration gate enforces production Druid completeness', () => withRoot((root) => {
  write(root, 'ruoyi-admin/src/main/resources/application-prod.yml', safeProdConfig({ omitDruidKey: 'maxActive' }));
  writeDruidProperties(root);

  const result = validateConfigSafety({ root });

  assertSingleFailure(result, {
    code: 'prod-druid-property-missing',
    file: 'ruoyi-admin/src/main/resources/application-prod.yml',
    detail: /spring\.datasource\.druid\.maxActive/
  });
}));

test('future Druid @Value additions fail without a copied checker key list', () => withRoot((root) => {
  write(root, 'ruoyi-admin/src/main/resources/application-prod.yml', safeProdConfig());
  writeDruidProperties(root, ['futureRequiredProperty']);
  write(root, 'ruoyi-framework/src/main/java/com/ruoyi/framework/config/SecurityConfig.java', safeSecurityConfig());

  const result = validateConfigSafety({ root, prod: true });
  assertSingleFailure(result, {
    code: 'prod-druid-property-missing',
    file: 'ruoyi-admin/src/main/resources/application-prod.yml',
    detail: /spring\.datasource\.druid\.futureRequiredProperty/
  });

  write(root, 'ruoyi-admin/src/main/resources/application-prod.yml', safeProdConfig({
    extraDruidProperties: { futureRequiredProperty: '7' }
  }));
  assert.deepEqual(validateConfigSafety({ root, prod: true }).failures, []);
}));

test('configuration completeness requires the exact nested Druid path', () => withRoot((root) => {
  const misplaced = safeProdConfig({ omitDruidKey: 'maxActive' })
    .replace('        password: ${DB_PASSWORD}', '        password: ${DB_PASSWORD}\n        maxActive: 20');
  write(root, 'ruoyi-admin/src/main/resources/application-prod.yml', misplaced);
  writeDruidProperties(root);

  assertSingleFailure(validateConfigSafety({ root }), {
    code: 'prod-druid-property-missing',
    file: 'ruoyi-admin/src/main/resources/application-prod.yml',
    detail: /spring\.datasource\.druid\.maxActive/
  });
}));

const INVALID_DRUID_VALUES = Object.freeze({
  container: '      maxActive:\n        nested: 20',
  null: '      maxActive:',
  'empty string': '      maxActive: ""',
  'whitespace string': '      maxActive: "   "'
});

for (const [valueKind, replacement] of Object.entries(INVALID_DRUID_VALUES)) {
  test(`configuration completeness rejects a ${valueKind} property value`, () => withRoot((root) => {
    const invalid = safeProdConfig().replace('      maxActive: 20', replacement);
    write(root, 'ruoyi-admin/src/main/resources/application-prod.yml', invalid);
    writeDruidProperties(root);

    assertSingleFailure(validateConfigSafety({ root }), {
      code: 'prod-druid-property-invalid',
      file: 'ruoyi-admin/src/main/resources/application-prod.yml',
      detail: /spring\.datasource\.druid\.maxActive/
    });
  }));
}

test('configuration completeness accepts a YAML alias that resolves to a scalar', () => withRoot((root) => {
  const aliased = safeProdConfig()
    .replace('      maxActive: 20', '      maxActive: &poolLimit 20')
    .replace('      maxWait: 60000', '      maxWait: *poolLimit');
  write(root, 'ruoyi-admin/src/main/resources/application-prod.yml', aliased);
  writeDruidProperties(root);
  write(root, 'ruoyi-framework/src/main/java/com/ruoyi/framework/config/SecurityConfig.java', safeSecurityConfig());

  assert.deepEqual(validateConfigSafety({ root }).failures, []);
  assert.deepEqual(validateConfigSafety({ root, prod: true }).failures, []);
}));

test('configuration completeness traverses an intermediate YAML map alias', () => withRoot((root) => {
  const lines = safeProdConfig().split('\n');
  const druidStart = lines.indexOf('    druid:');
  const dataStart = lines.indexOf('  data:');
  const druidBody = lines.slice(druidStart + 1, dataStart).map((line) => line.slice(4));
  const aliased = [
    'druidPool: &druidPool',
    ...druidBody,
    'spring:',
    '  datasource:',
    '    druid: *druidPool',
    ...lines.slice(dataStart)
  ].join('\n');
  write(root, 'ruoyi-admin/src/main/resources/application-prod.yml', aliased);
  writeDruidProperties(root);
  write(root, 'ruoyi-framework/src/main/java/com/ruoyi/framework/config/SecurityConfig.java', safeSecurityConfig());

  assert.deepEqual(validateConfigSafety({ root }).failures, []);
  assert.deepEqual(validateConfigSafety({ root, prod: true }).failures, []);
}));

test('configuration completeness rejects unsupported @Value syntax instead of ignoring it', () => withRoot((root) => {
  write(root, 'ruoyi-admin/src/main/resources/application-prod.yml', safeProdConfig());
  write(
    root,
    'ruoyi-framework/src/main/java/com/ruoyi/framework/config/properties/DruidProperties.java',
    druidPropertiesSource().replace('class DruidProperties {', 'class DruidProperties {\n  @Value(SOME_CONSTANT)\n  private String unsupported;')
  );

  assertSingleFailure(validateConfigSafety({ root }), {
    code: 'druid-properties-source-invalid',
    file: 'ruoyi-framework/src/main/java/com/ruoyi/framework/config/properties/DruidProperties.java'
  });
}));

test('normal configuration CLI fails on a production Druid omission', () => withRoot((root) => {
  write(root, 'ruoyi-admin/src/main/resources/application-prod.yml', safeProdConfig({ omitDruidKey: 'maxActive' }));
  writeDruidProperties(root);

  const result = spawnSync(
    process.execPath,
    ['tools/config-safety-checker.js', '--root', root],
    { cwd: process.cwd(), encoding: 'utf8' }
  );

  assert.equal(result.status, 1);
  assert.match(`${result.stdout}\n${result.stderr}`, /\[prod-druid-property-missing\]/);
  assert.match(`${result.stdout}\n${result.stderr}`, /spring\.datasource\.druid\.maxActive/);
}));

test('package scripts expose production safety and release verification', () => {
  const pkg = readJson('package.json');
  assert.equal(pkg.scripts['check:config-safety'], 'node tools/config-safety-checker.js');
  assert.equal(pkg.scripts['check:prod-safety'], 'node tools/config-safety-checker.js --prod');
  assert.ok(pkg.scripts.check.split(/\s*&&\s*/).includes('npm run check:config-safety'));
  assert.equal(pkg.scripts['verify:release'], 'node tools/release-verifier.js');
});

test('verify:release is explicit and not only check:runtime execution', () => {
  const script = readJson('package.json').scripts['verify:release'];
  assert.equal(script, 'node tools/release-verifier.js');
  assert.deepEqual(RELEASE_NPM_STEPS, [
    ['run', 'check'],
    ['run', 'check:prod-safety'],
    ['--prefix', 'ruoyi-ui', 'test'],
    ['--prefix', 'ruoyi-ui', 'audit', '--audit-level=moderate', '--include=dev'],
    ['--prefix', 'ruoyi-ui', 'run', 'build:prod']
  ]);
  assert.deepEqual(MAVEN_INTEGRATION_ARGS, ['-pl', 'ruoyi-business', '-am', '-Pintegration-test', 'verify']);
  assert.equal(/-DskipTests|-DskipITs|-Dmaven\.test\.skip/.test(MAVEN_INTEGRATION_ARGS.join(' ')), false);
  assert.equal(/check:runtime\s+--execute/.test(script), false);
});
