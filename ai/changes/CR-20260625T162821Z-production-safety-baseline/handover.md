# Handover

## Summary

R-02 production safety baseline for `ai/changes/CR-20260625T162821Z-production-safety-baseline`.

## Impact

This rule-change removes anonymous Druid monitor exposure, adds a production profile, adds a blocking production safety checker, and documents the release verification boundary.

No customer runtime code, sales-order code, customer fund model code, migration/idempotency registry, or business database table structure is changed. No API, UI, permission, database object, or component ownership contract is changed.

## Changed Files

- `ruoyi-framework/src/main/java/com/ruoyi/framework/config/SecurityConfig.java`
- `ruoyi-admin/src/main/resources/application.yml`
- `ruoyi-admin/src/main/resources/application-druid.yml`
- `ruoyi-admin/src/main/resources/application-prod.yml`
- `tools/config-safety-checker.js`
- `tests/production-safety.test.js`
- `package.json`
- `docs/production-readiness.md`
- `README.md`
- `ai/context/current-context.md`
- `ai/context/current-context.json`
- `memory/HANDOVER.md`
- `memory/PROJECT_STATE.md`
- `memory/CHANGELOG.md`
- `memory/TASKS.json`
- `ai/changes/CR-20260625T162821Z-production-safety-baseline/*`
- `ai/changes/CURRENT_CHANGE.json`

## Commands

- [local] `npm run resume` - passed before this change record was created.
- [local] `node --test tests/production-safety.test.js` - passed with 7 tests.
- [local] `npm run check:config-safety` - passed with development/default warnings only.
- [local] `npm run check:prod-safety` - passed.
- [local] `npm test` - passed with 185/185 Node tests.
- [local] `npm run check` - passed with 185/185 Node tests.
- [local] `git diff --check` - passed.
- [inconclusive] `mvn -pl ruoyi-admin -am -DskipTests compile` - failed because plain `mvn` is not available on local PATH.
- [local] `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests compile` - passed with reactor `BUILD SUCCESS`.
- [local] `npm --prefix ruoyi-ui run build:prod` - passed with Vite production build success.
- [inconclusive] `npm run verify:release` - ran `npm run check` and `npm run check:prod-safety` successfully, then failed because plain `mvn` is not available on local PATH.

## Verification

- [local] `SecurityConfig` no longer has `/druid/**` in the explicit permit-all matcher.
- [local] Repository search found no other `/druid/**` `permitAll` or anonymous source; remaining `/druid/*` references are Druid servlet URL-pattern configuration, not Spring Security anonymous access.
- [local] `application-prod.yml` exists and uses environment variables/placeholders for production DB, Redis, Druid login values, and token secret.
- [local] Production Druid console and Swagger UI are disabled by default.
- [local] `check:prod-safety` blocks production default passwords, local DB URLs, missing environment placeholders, `/druid/**` permit-all, enabled Druid console, and enabled Swagger UI.

## Risks

- [inconclusive] Final release verification is not complete because `npm run verify:release` failed at plain `mvn`.
- [local] `npm run check:config-safety` intentionally keeps development/default risky values as warnings, so it must not be used as production approval.

## Next Actions

- Review/commit R-02 if accepted.
- After R-02, choose R-03 customer fund vocabulary source cleanup or R-04 governance/runtime verification boundary clarification.
