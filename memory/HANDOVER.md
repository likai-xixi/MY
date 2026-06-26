# Handover

## Summary

Current change record: `ai/changes/CR-20260626T145150Z-customer-runtime-tests`.

R-08 adds runtime-test coverage for the R-07 customer fund idempotency gap. It does not add business features or change customer production runtime behavior.

## Impact

- Java unit/runtime tests under `ruoyi-business/src/test/java`.
- `ruoyi-business/pom.xml` adds test dependencies and an opt-in `integration-test` profile for MySQL/Testcontainers.
- Customer/high-risk Node governance tests now assert runtime-test ownership.
- Customer feature docs, API/DB contracts, idempotency and migration registries, current context, project state, changelog, and tasks were updated for R-08 evidence.
- Current change record includes scoped RuoYi baseline boundary/component exception notes for inherited system/tool UI files only.

## Changed Files

- `ai/changes/CR-20260626T145150Z-customer-runtime-tests/boundary-exception.md`
- `ai/changes/CR-20260626T145150Z-customer-runtime-tests/changed-files.json`
- `ai/changes/CR-20260626T145150Z-customer-runtime-tests/component-exception.md`
- `ai/changes/CR-20260626T145150Z-customer-runtime-tests/handover.md`
- `ai/changes/CR-20260626T145150Z-customer-runtime-tests/impact.json`
- `ai/changes/CR-20260626T145150Z-customer-runtime-tests/plan.md`
- `ai/changes/CR-20260626T145150Z-customer-runtime-tests/request.md`
- `ai/changes/CR-20260626T145150Z-customer-runtime-tests/verification.md`
- `ai/changes/CURRENT_CHANGE.json`
- `ai/context/current-context.json`
- `ai/context/current-context.md`
- `ai/contracts/customer.api.md`
- `ai/contracts/customer.db.md`
- `ai/registry/idempotency-registry.json`
- `ai/registry/migration-registry.json`
- `docs/customer-database-migration.md`
- `docs/runtime-verification-boundary.md`
- `features/customer.md`
- `memory/CHANGELOG.md`
- `memory/HANDOVER.md`
- `memory/PROJECT_STATE.md`
- `memory/TASKS.json`
- `ruoyi-business/pom.xml`
- `ruoyi-business/src/test/java/com/ruoyi/business/common/idempotency/IdempotencyServiceTest.java`
- `ruoyi-business/src/test/java/com/ruoyi/business/customer/service/CustomerFundMySqlIT.java`
- `ruoyi-business/src/test/java/com/ruoyi/business/customer/service/CustomerFundServiceTest.java`
- `ruoyi-business/src/test/java/com/ruoyi/business/customer/service/CustomerServiceTest.java`
- `ruoyi-business/src/test/java/com/ruoyi/business/customer/service/CustomerTestSupport.java`
- `tests/customer-risk-gate.test.js`
- `tests/high-risk-governance.test.js`

## Commands

- [local] `npm run resume`
- [local] `npm run impact -- 客户管理`
- [local] `npm run scan:all`
- [local] `node --test tests/customer-risk-gate.test.js`
- [local] `npm run check:high-risk-governance`
- [local] `node --test tests/high-risk-governance.test.js`
- [local] `npm test`
- [local] `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-business -am test`
- [local] `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-business -am -Pintegration-test verify`
- [local] `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests compile`
- [local] `npm run check`
- [local] `git diff --check`

## Verification

- [local] `npm run resume` passed.
- [local] `npm run impact -- 客户管理` passed with no blockers.
- [local] `npm run scan:all` passed.
- [local] `node --test tests/customer-risk-gate.test.js` passed 16/16.
- [local] `npm run check:high-risk-governance` passed.
- [local] `node --test tests/high-risk-governance.test.js` passed 40/40.
- [local] `npm test` passed 197/197.
- [local] Plain `mvn` is unavailable on PATH; configured Maven path was used.
- [local] `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-business -am test` passed 19/19.
- [local] `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-business -am -Pintegration-test verify` passed, including `CustomerFundMySqlIT` with MySQL Testcontainers 1/1.
- [local] `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests compile` passed with reactor `BUILD SUCCESS`.
- [local] `npm run check` passed with 197/197 Node tests.
- [local] `git diff --check` passed.

## Boundaries

No customer production Java, idempotency production Java, mapper XML, customer controller, customer Vue/API, production safety configuration, package scripts, tools, SQL business table structure, sales-order/salesorder runtime, old three-account fund model, or deduction/refund/adjustment/reversal runtime was changed.

## Risks

- No Spring MVC controller integration test was added because the current admin module has no existing controller test harness; the service/runtime layers and MySQL Testcontainers path cover the R-07 idempotency gap.
- The MySQL/Testcontainers test is opt-in through `-Pintegration-test` and is not part of default `npm run check`.

## Next Actions

- R-09 sales-order pre-implementation contract package.
