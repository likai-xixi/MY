# Handover

## Summary

Customer detail now returns only basic data; dedicated permission-protected reads load owner, fund, flow, policy, and rebate domains. Fund reads are side-effect free. Owner transfer is row-locked, role-key constrained, and audited only after exactly one update. Sample rebate creation is fail-closed until an authoritative sample-order source exists; the frontend exposes read-only history, and the final pre-release schema reserves non-null unique order identities for future enablement.

## Impact

This change affects 54 files recorded in `changed-files.json`. It stays inside the `customer` business boundary plus its approved review, contracts, generated scans, graph, registry, context, and memory artifacts. It does not create sales-order, delivery, finance, production, formula, model-config, or DXF runtime.

## Changed Files

- `ai/changes/CR-20260714T013244Z-change/boundary-exception.md`
- `ai/changes/CR-20260714T013244Z-change/changed-files.json`
- `ai/changes/CR-20260714T013244Z-change/component-exception.md`
- `ai/changes/CR-20260714T013244Z-change/handover.md`
- `ai/changes/CR-20260714T013244Z-change/impact.json`
- `ai/changes/CR-20260714T013244Z-change/plan.md`
- `ai/changes/CR-20260714T013244Z-change/request.md`
- `ai/changes/CR-20260714T013244Z-change/split-plan.md`
- `ai/changes/CR-20260714T013244Z-change/verification.md`
- `ai/changes/CURRENT_CHANGE.json`
- `ai/context/current-context.json`
- `ai/context/current-context.md`
- `ai/contracts/customer.api.md`
- `ai/contracts/customer.db.md`
- `ai/contracts/customer.permission.md`
- `ai/contracts/customer.ui.md`
- `ai/generated/db-schema.json`
- `ai/generated/permissions.json`
- `ai/registry/features.json`
- `ai/registry/high-risk-permission-coverage.json`
- `ai/reviews/RV-20260714T012241Z-review/architecture-review.md`
- `ai/reviews/RV-20260714T012241Z-review/backend-review.md`
- `ai/reviews/RV-20260714T012241Z-review/context.md`
- `ai/reviews/RV-20260714T012241Z-review/decision.md`
- `ai/reviews/RV-20260714T012241Z-review/frontend-review.md`
- `ai/reviews/RV-20260714T012241Z-review/product-review.md`
- `ai/reviews/RV-20260714T012241Z-review/qa-review.md`
- `ai/reviews/RV-20260714T012241Z-review/request.md`
- `ai/reviews/RV-20260714T012241Z-review/review.json`
- `ai/reviews/RV-20260714T012241Z-review/risk-register.md`
- `features/customer.md`
- `graph/api-graph.json`
- `graph/ui-graph.json`
- `memory/API_CATALOG.md`
- `memory/CHANGELOG.md`
- `memory/HANDOVER.md`
- `memory/TASKS.json`
- `ruoyi-business/src/main/java/com/ruoyi/business/customer/mapper/CustomerMapper.java`
- `ruoyi-business/src/main/java/com/ruoyi/business/customer/service/SampleRebateOrderAuthority.java`
- `ruoyi-business/src/main/java/com/ruoyi/business/customer/service/impl/CustomerFundServiceImpl.java`
- `ruoyi-business/src/main/java/com/ruoyi/business/customer/service/impl/CustomerServiceImpl.java`
- `ruoyi-business/src/main/java/com/ruoyi/business/customer/service/impl/UnavailableSampleRebateOrderAuthority.java`
- `ruoyi-business/src/main/resources/mapper/customer/CustomerMapper.xml`
- `ruoyi-business/src/test/java/com/ruoyi/business/customer/service/CustomerFundMySqlIT.java`
- `ruoyi-business/src/test/java/com/ruoyi/business/customer/service/CustomerFundServiceTest.java`
- `ruoyi-business/src/test/java/com/ruoyi/business/customer/service/CustomerServiceTest.java`
- `ruoyi-ui/src/api/customer.contract.md`
- `ruoyi-ui/src/api/customer.js`
- `ruoyi-ui/src/views/customer/detail-request-guard.mjs`
- `ruoyi-ui/src/views/customer/index.vue`
- `sql/customer.ownership.md`
- `sql/migrations/V20260625_001_customer_schema.sql`
- `sql/validation/customer_runtime_validation.sql`
- `tests/customer-risk-gate.test.js`

## Commands

- `[local] npm run scan:all`
- `[local] node --test tests/customer-risk-gate.test.js`
- `[local] mvn -pl ruoyi-admin -am test`
- `[local] mvn -pl ruoyi-business -am -Pintegration-test verify`
- `[local] npm test`
- `[local] npm --prefix ruoyi-ui run build:prod`
- `[local] npm run check:high-risk-governance`
- `[local] git diff --check`
- `[inconclusive] npm run check` (stopped at the governance context-build idempotency test)

## Verification

- [local] Customer risk gate: 19/19 passed.
- [local] Maven reactor unit suite: 37/37 passed.
- [local] MySQL 8 Testcontainers integration: 1/1 passed, including non-null and duplicate sample-order constraints.
- [local] Standalone Node suite: 265/265 passed before the final context refresh.
- [local] Frontend production build: 2554 modules transformed successfully.
- [local] Generated scans, high-risk governance, and diff whitespace checks passed.
- [inconclusive] `npm run check` reached the final Node suite and stopped at 264/265 because the governance context-build idempotency test reported stale generated context. Customer-specific tests remained green; the project-wide gate stays blocked until the separate governance repair is complete.

## Risks

- [not-run] Authenticated browser role-matrix acceptance requires a live local RuoYi stack and remains for the final cross-batch runtime review.
- The pre-release `CREATE TABLE IF NOT EXISTS` baseline does not alter an already-created development table. Existing development databases must be rebuilt or audited before a future sample-order authority is enabled. Current creation is fail-closed, so this does not leave an active credit path.
- `CustomerServiceImpl` and the customer Vue page remain inherited overweight files; `split-plan.md` records the bounded follow-up decomposition.

## Next Actions

- Commit this bounded customer batch with the governance blocker explicitly recorded.
- Open a separate masterdata change after the customer commit; repair the context-build false green in the later governance change and require a clean full gate before the final push.
