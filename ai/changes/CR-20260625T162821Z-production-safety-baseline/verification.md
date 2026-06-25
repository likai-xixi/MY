# Verification

Status: [local] verified with release-script blocker

## Commands

- [local] `npm run resume` - passed before this change record was created.
- [local] `node --test tests/production-safety.test.js` - passed with 7 tests.
- [local] `npm run check:config-safety` - passed with warning-only findings for development/default `application.yml` and `application-druid.yml` values.
- [local] `npm run check:prod-safety` - passed; production safety baseline has no blocking failures.
- [local] `npm test` - passed with 185/185 Node tests after adding current-CR boundary/component baseline exceptions.
- [local] `npm run check` - passed with 185/185 Node tests after provenance handover correction.
- [local] `git diff --check` - passed.
- [inconclusive] `mvn -pl ruoyi-admin -am -DskipTests compile` - failed because plain `mvn` is not available on local PATH.
- [local] `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests compile` - passed with reactor `BUILD SUCCESS`.
- [local] `npm --prefix ruoyi-ui run build:prod` - passed with Vite production build success.
- [inconclusive] `npm run verify:release` - ran `npm run check` and `npm run check:prod-safety` successfully, then failed because plain `mvn` is not available on local PATH.

## Evidence

- [local] `/druid/**` was removed from the explicit Spring Security `permitAll` matcher list in `SecurityConfig`.
- [local] `application-prod.yml` exists and uses environment placeholders for `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `REDIS_HOST`, `REDIS_PASSWORD`, and `TOKEN_SECRET`.
- [local] Production Druid console and Swagger UI are disabled by default in `application-prod.yml`.
- [local] `check:prod-safety` is wired to `node tools/config-safety-checker.js --prod` and blocks unsafe production defaults, including RuoYi sample secrets and `/druid/**` permit-all exposure.
- [local] `verify:release` explicitly runs `npm run check`, `npm run check:prod-safety`, Maven compile, and `ruoyi-ui` production build; it is not a `check:runtime --execute` alias.
- [inconclusive] Release verification is not passed until `npm run verify:release` itself can execute plain `mvn` or the script is intentionally changed in a separate approved batch.
- [local] This change did not modify customer runtime, sales-order, fund model, migration/idempotency registry, or business database table structure.
