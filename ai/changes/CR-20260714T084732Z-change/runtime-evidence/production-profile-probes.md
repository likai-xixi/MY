# Production Profile Probe Evidence

All credentials below are probe-only literals. The database and Redis endpoints intentionally use closed local port `1`; no production service was contacted.

## Dynamic Druid Property Completeness

Run from repository root in PowerShell. The Java source is the source of truth; the probe compares the committed base profile with the current profile.

```powershell
@'
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import YAML from 'yaml';
const baseRevision = '12812fdf00465d923db2a0cc84d85a4bf12da9ea';
const javaFile = 'ruoyi-framework/src/main/java/com/ruoyi/framework/config/properties/DruidProperties.java';
const yamlFile = 'ruoyi-admin/src/main/resources/application-prod.yml';
const java = fs.readFileSync(javaFile, 'utf8');
const requiredKeys = [...java.matchAll(/@Value\("\$\{([^}:]+)(?::[^}]*)?\}"\)/g)].map((match) => match[1]);
const valueAt = (root, key) => key.split('.').reduce((value, part) => value?.[part], root);
const missingFrom = (text) => {
  const config = YAML.parse(text);
  return requiredKeys.filter((key) => valueAt(config, key) === undefined);
};
const baseText = execFileSync('git', ['show', `${baseRevision}:${yamlFile}`], { encoding: 'utf8' });
const currentText = fs.readFileSync(yamlFile, 'utf8');
const result = {
  baseRevision,
  extractedCount: requiredKeys.length,
  requiredKeys,
  baseMissingKeys: missingFrom(baseText),
  currentMissingKeys: missingFrom(currentText)
};
console.log(JSON.stringify(result, null, 2));
if (result.extractedCount === 0 || result.currentMissingKeys.length > 0) process.exit(1);
'@ | node --input-type=module -
```

Sanitized result:

```json
{
  "baseRevision": "12812fdf00465d923db2a0cc84d85a4bf12da9ea",
  "extractedCount": 13,
  "baseMissingKeyCount": 13,
  "currentMissingKeys": []
}
```

The 13 extracted keys were `initialSize`, `minIdle`, `maxActive`, `maxWait`, `connectTimeout`, `socketTimeout`, `timeBetweenEvictionRunsMillis`, `minEvictableIdleTimeMillis`, `maxEvictableIdleTimeMillis`, `validationQuery`, `testWhileIdle`, `testOnBorrow`, and `testOnReturn`, all under `spring.datasource.druid`.

## Packaged Backend

```powershell
& "$env:USERPROFILE\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd" -pl ruoyi-admin -am -DskipTests package
```

Result: `BUILD SUCCESS`, eight reactor modules successful, executable `ruoyi-admin/target/ruoyi-admin.jar` produced. Tests were intentionally skipped only for this configuration packaging step.

## Packaged `prod` Startup Boundary

```powershell
$env:DB_URL='jdbc:mysql://127.0.0.1:1/ruoyi?useUnicode=true&characterEncoding=utf8&connectTimeout=1000&socketTimeout=1000'
$env:DB_USERNAME='probe_user'
$env:DB_PASSWORD='probe_password_not_real'
$env:DRUID_LOGIN_USERNAME='probe_admin'
$env:DRUID_LOGIN_PASSWORD='probe_console_password_not_real'
$env:REDIS_HOST='127.0.0.1'
$env:REDIS_PORT='1'
$env:REDIS_PASSWORD='probe_redis_password_not_real'
$env:TOKEN_SECRET='probe_token_secret_32_bytes_long_only'
$stdout = Join-Path $env:TEMP 'my-prod-startup-probe.stdout.log'
$stderr = Join-Path $env:TEMP 'my-prod-startup-probe.stderr.log'
Remove-Item -LiteralPath $stdout,$stderr -Force -ErrorAction SilentlyContinue
& java -jar ruoyi-admin/target/ruoyi-admin.jar --spring.profiles.active=prod --server.port=0 1> $stdout 2> $stderr
$exitCode = $LASTEXITCODE
$probeText = ((Get-Content -Raw -ErrorAction SilentlyContinue $stdout) + "`n" + (Get-Content -Raw -ErrorAction SilentlyContinue $stderr))
[ordered]@{
  exitCode = $exitCode
  unresolvedPlaceholderCount = [regex]::Matches($probeText, 'Could not resolve placeholder').Count
  communicationsLinkFailureCount = [regex]::Matches($probeText, 'Communications link failure').Count
  connectionRefusedCount = [regex]::Matches($probeText, 'Connection refused').Count
  druidCreateConnectionSQLExceptionCount = [regex]::Matches($probeText, 'create connection SQLException').Count
  springStarted = [regex]::IsMatch($probeText, 'Started RuoYiApplication')
  expectedBoundaryReached = [regex]::IsMatch($probeText, 'Communications link failure') -and [regex]::IsMatch($probeText, 'Connection refused') -and [regex]::IsMatch($probeText, 'create connection SQLException')
} | ConvertTo-Json
```

Sanitized result from the final rerun:

```json
{
  "exitCode": 1,
  "unresolvedPlaceholderCount": 0,
  "communicationsLinkFailureCount": 19,
  "connectionRefusedCount": 6,
  "druidCreateConnectionSQLExceptionCount": 3,
  "springStarted": false,
  "expectedBoundaryReached": true
}
```

The non-zero exit is expected because MySQL is deliberately unreachable. The acceptance condition is reaching the MySQL/Druid connection boundary with zero unresolved placeholders, not starting the service.
