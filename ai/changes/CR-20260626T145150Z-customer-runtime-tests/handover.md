# Handover

## Summary

R-08 adds customer runtime idempotency test coverage without changing customer production behavior.

## Impact

The change is scoped to Java tests, an opt-in Testcontainers profile in `ruoyi-business/pom.xml`, Node ownership assertions, docs, idempotency/migration registries, context, and memory. It does not edit customer production Java, mapper XML, customer controller, customer Vue/API files, production safety configuration, package scripts, tools, SQL business table structure, sales-order runtime, or the fund model.

## New Test Coverage

- `IdempotencyServiceTest` covers missing idempotent key, same key/different hash rejection, PROCESSING duplicate rejection, SUCCESS replay, and first-request PROCESSING insert.
- `CustomerFundServiceTest` covers deposit idempotency, CUSTOMER_DEPOSIT/DEPOSIT_IN enforcement, PUBLIC customer fund entry rejection, SUCCESS replay, retry-safe batch/flow references, and SAMPLE_REBATE_GENERATE internal flow stamping.
- `CustomerServiceTest` covers sample rebate idempotency, PUBLIC sample rebate rejection, SUCCESS replay, SAMPLE_REBATE fund flow delegation, and salesman candidates not falling back to all users.
- `CustomerFundMySqlIT` is under the `integration-test` profile and covers concurrent deposits, row-lock balance consistency, `idempotent_request` uniqueness, and retry-safe `flow_no` / `deposit_batch_no` uniqueness against MySQL Testcontainers.

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

[local] Verification passed: customer risk gate 16/16, high-risk governance direct suite 40/40, full Node suite 197/197, Java unit tests 19/19, MySQL/Testcontainers integration test 1/1, admin reactor compile `BUILD SUCCESS`, full `npm run check`, and final `git diff --check`. [not-run] Plain `mvn` is unavailable on PATH; the configured Maven path from runtime policy was used.

## Risks

- No Spring MVC controller integration test was added because the current admin module has no existing controller test harness; the service/runtime layers and MySQL Testcontainers path cover the R-07 idempotency gap.
- The MySQL/Testcontainers test is opt-in through `-Pintegration-test` and is not part of default `npm run check`.

## Next Actions

- R-09 sales-order pre-implementation contract package.
