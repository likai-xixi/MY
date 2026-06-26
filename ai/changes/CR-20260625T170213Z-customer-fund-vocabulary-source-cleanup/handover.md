# Handover

## Summary

R-03 customer fund vocabulary source cleanup updates current context, customer feature docs, API/DB/UI contracts, README, memory, and the active change record so the current source vocabulary is two-account only:

- `CUSTOMER_DEPOSIT`: 客户级定金
- `SAMPLE_REBATE`: 样品返现

## Impact

This change affects 22 recorded path(s). It is documentation/context cleanup only.

No customer runtime code, sales-order runtime code, production safety config, Java/Vue customer fund runtime code, migration/idempotency registry, or business database table structure was modified. `beforeSalesOrder` remains blocked.

## Changed Files

- `README.md`
- `ai/changes/CR-20260625T170213Z-customer-fund-vocabulary-source-cleanup/boundary-exception.md`
- `ai/changes/CR-20260625T170213Z-customer-fund-vocabulary-source-cleanup/changed-files.json`
- `ai/changes/CR-20260625T170213Z-customer-fund-vocabulary-source-cleanup/component-exception.md`
- `ai/changes/CR-20260625T170213Z-customer-fund-vocabulary-source-cleanup/handover.md`
- `ai/changes/CR-20260625T170213Z-customer-fund-vocabulary-source-cleanup/impact.json`
- `ai/changes/CR-20260625T170213Z-customer-fund-vocabulary-source-cleanup/plan.md`
- `ai/changes/CR-20260625T170213Z-customer-fund-vocabulary-source-cleanup/request.md`
- `ai/changes/CR-20260625T170213Z-customer-fund-vocabulary-source-cleanup/verification.md`
- `ai/changes/CURRENT_CHANGE.json`
- `ai/context/current-context.json`
- `ai/context/current-context.md`
- `ai/context/features/customer.md`
- `ai/contracts/customer.api.md`
- `ai/contracts/customer.db.md`
- `ai/contracts/customer.ui.md`
- `features/customer.md`
- `memory/CHANGELOG.md`
- `memory/HANDOVER.md`
- `memory/PROJECT_STATE.md`
- `memory/TASKS.json`
- `ruoyi-ui/src/api/customer.contract.md`

## Commands

- [local] `npm run resume`
- [local] required old-fund-vocabulary scan attempts plus equivalent recursive PowerShell scan
- [local] `npm run scan:all`
- [local] `npm run check:high-risk-governance`
- [local] `npm run context:build -- customer`
- [local] `npm test`
- [local] `npm run finalize:change -- --summary "客户资金口径上下文源清理"`
- [local] `npm run check`
- [local] `git diff --check`

## Verification

Current docs and contracts have no active old-fund-vocabulary matches. Remaining matches are historical evidence only under old change records, runtime logs, and one historical session note.

[local] The second `npm test` run passed with 185/185 Node tests after scoped baseline exceptions were added and the SQL ownership doc change was removed.

[local] Final `npm run check` passed with 185/185 Node tests. Existing config-safety warnings and high-risk baseline DDL warning remained non-blocking.

[local] `git diff --check` passed.

## Risks

- Historical evidence keeps old vocabulary by design and must not be treated as the current contract.
- This batch did not runtime-test customer funds because it intentionally did not change runtime behavior.

## Next Actions

- Choose R-04 governance/runtime verification boundary clarification or R-05 customer salesman candidate hardening.
