# Handover

## Summary

R-07 customer fund idempotency is the active change.

Current change record: `ai/changes/CR-20260626T124443Z-customer-fund-idempotency`.

## Impact

Customer deposit entry and sample rebate generation now require `idempotentKey`. The change adds platform-level `idempotent_request` support with `PROCESSING`, `SUCCESS`, and `FAILED` status vocabulary, a unique key on `(biz_type, idempotent_key)`, canonical request hashing, same-hash success replay, processing rejection, and different-hash conflict rejection.

The customer Vue page now generates a hidden stable `idempotentKey` when the deposit or sample-rebate dialog opens and submits that same key with the payload. `ruoyi-ui/src/api/customer.js` and API paths remain unchanged.

`ai/registry/features.json` and `memory/API_CATALOG.md` are included in R-07 because the idempotency baseline changes customer fund API request semantics and ownership traceability. `features.json` records customer/platform idempotency ownership for `idempotent_request`; `API_CATALOG` records customer fund idempotency request semantics.

The idempotency record and customer fund mutation run in the same Spring transaction. This R-07 implementation uses rollback-on-business-failure for safe retry: failed business attempts roll back the `PROCESSING` idempotency row together with fund account, fund flow, deposit batch, and sample rebate changes.

`ai/registry/idempotency-registry.json` now has required entries for `POST /business/customer/{customerId}/fund/deposit` and `POST /business/customer/{customerId}/sample-rebate`. `ai/registry/migration-registry.json` now registers `platform-idempotent-request-baseline` for `sql/migrations/V20260625_004_idempotent_request.sql`. `scan:all` refreshed `ai/generated/db-schema.json` and customer ownership registry entries for `idempotent_request`.

No sales-order runtime, salesorder runtime, production safety configuration, package scripts, tools, old three-account fund model, deduction/refund/adjustment/reversal runtime, or database table other than `idempotent_request` was added.

## Changed Files

See `ai/changes/CR-20260626T124443Z-customer-fund-idempotency/changed-files.json` for the full recorded file list.

Key runtime and contract files:

- `ruoyi-business/src/main/java/com/ruoyi/business/common/idempotency/**`
- `ruoyi-business/src/main/resources/mapper/common/IdempotentRequestMapper.xml`
- `ruoyi-business/src/main/java/com/ruoyi/business/customer/domain/CustomerFundEntry.java`
- `ruoyi-business/src/main/java/com/ruoyi/business/customer/domain/SampleRebateRecord.java`
- `ruoyi-business/src/main/java/com/ruoyi/business/customer/service/impl/CustomerFundServiceImpl.java`
- `ruoyi-business/src/main/java/com/ruoyi/business/customer/service/impl/CustomerServiceImpl.java`
- `ruoyi-business/src/main/java/com/ruoyi/business/customer/mapper/CustomerMapper.java`
- `ruoyi-business/src/main/resources/mapper/customer/CustomerMapper.xml`
- `ruoyi-ui/src/views/customer/index.vue`
- `sql/migrations/V20260625_004_idempotent_request.sql`
- `ai/registry/idempotency-registry.json`
- `ai/registry/migration-registry.json`
- `tests/customer-risk-gate.test.js`
- `tests/high-risk-governance.test.js`

## Commands

- [local] `npm run resume`
- [local] frontend `idempotentKey` precheck commands
- [local] `npm run impact -- 客户管理`
- [local] `npm run scan:all`
- [local] `npm run context:build -- customer`
- [local] `node --test tests/customer-risk-gate.test.js`
- [local] `npm --prefix ruoyi-ui run build:prod`
- [local] `npm run check:high-risk-governance`
- [local] `node --test tests/high-risk-governance.test.js`
- [local] `npm test`
- [not-run] `mvn -pl ruoyi-admin -am -DskipTests compile`
- [local] `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests compile`
- [local] `npm run check`
- [local] `git diff --check`

## Verification

- [local] `npm run resume` passed.
- [local] Final scope audit confirmed `ai/registry/features.json` and `memory/API_CATALOG.md` belong to R-07 idempotency ownership/API catalog sync and are already listed in `changed-files.json`.
- [local] Frontend precheck confirmed the customer page lacked `idempotentKey`; R-07 now adds stable hidden dialog keys for deposit and sample rebate while keeping `customer.js` unchanged.
- [local] `npm run impact -- 客户管理` passed with no blockers.
- [local] `npm run scan:all` passed.
- [local] `npm run context:build -- customer` passed.
- [local] Permission scan completed with no contract changes; R-07 does not add or change menus, auth strings, permissions, or permission ownership.
- [local] `node --test tests/customer-risk-gate.test.js` passed with 15/15 tests.
- [local] `npm --prefix ruoyi-ui run build:prod` passed with Vite production build success.
- [local] `npm run check:high-risk-governance` passed.
- [local] `node --test tests/high-risk-governance.test.js` passed with 40/40 tests.
- [local] `npm test` passed with 196/196 tests.
- [not-run] Plain `mvn -pl ruoyi-admin -am -DskipTests compile` is unavailable on PATH.
- [local] Configured Maven path compile passed with `BUILD SUCCESS`.
- [not-run] `idempotent_request` migration was statically checked by governance tests; runtime MySQL execution was not performed in this environment.
- [local] `npm run check` passed with 196/196 Node tests.
- [local] `git diff --check` passed.

## Risks

- Runtime MySQL execution of `sql/migrations/V20260625_004_idempotent_request.sql` and `sql/validation/customer_runtime_validation.sql` was not performed in this environment.
- Duplicate replay/conflict behavior is covered by static governance tests and backend compile, not live HTTP retry tests in this pass.

## Next Actions

- Suggested next customer follow-up: R-08 customer runtime tests.
- Alternative next planning package: R-09 sales-order pre-implementation contract package.
