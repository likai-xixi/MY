# Handover

## Summary

Current change record: `ai/changes/CR-20260625T170213Z-customer-fund-vocabulary-source-cleanup`.

R-03 customer fund vocabulary source cleanup updates current context, customer feature docs, API/DB/UI contracts, README, memory, and the active change record so the current source vocabulary is two-account only:

- `CUSTOMER_DEPOSIT`: 客户级定金
- `SAMPLE_REBATE`: 样品返现

R-02 production safety baseline is previous context before this R-03 batch.

## Impact

Current change `CR-20260625T170213Z-customer-fund-vocabulary-source-cleanup` affects 22 recorded path(s). See `ai/changes/CR-20260625T170213Z-customer-fund-vocabulary-source-cleanup/changed-files.json` for exact coverage.

No customer runtime code, sales-order runtime code, production safety config, Java/Vue customer fund runtime code, migration/idempotency registry, or business database table structure was modified. `beforeSalesOrder` remains blocked.

Sales-order may select customer, carry default contact/default address/owner snapshots, and show `CUSTOMER_DEPOSIT` status during submit, but must not directly deduct customer funds. Delivery / finance contracts must later define `CUSTOMER_DEPOSIT` deduction/refund/adjustment/reversal and `SAMPLE_REBATE` deduction. Every customer-fund mutation must write `customer_fund_flow`.

## Changed Files

- `README.md`
- `ai/changes/CR-20260625T170213Z-customer-fund-vocabulary-source-cleanup/*`
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

- [local] `npm run resume` - passed.
- [local] Required `grep -R` old-fund-vocabulary scan - attempted first and failed because `grep` is unavailable in this PowerShell environment.
- [local] Required fallback `Select-String -Path * ... -Recurse` - attempted and failed because this PowerShell version does not support `Select-String -Recurse`.
- [local] Equivalent recursive PowerShell scan with `Get-ChildItem -Recurse -File | Select-String` - completed.
- [local] Current-doc old-fund-vocabulary scan - no matches.
- [local] `npm run scan:all` - passed.
- [local] `npm run check:high-risk-governance` - passed with expected non-blocking baseline migration warning.
- [local] `npm run context:build -- customer` - passed.
- [local] `npm test` - passed on rerun with 185/185 Node tests.
- [local] `npm run finalize:change -- --summary "客户资金口径上下文源清理"` - passed.
- [local] `npm run check` - passed with 185/185 Node tests; existing config-safety warnings and high-risk baseline DDL warning remained non-blocking.
- [local] `git diff --check` - passed.

## Verification

Current docs and contracts have no active old-fund-vocabulary matches. Remaining matches are historical evidence only under old change records, runtime logs, and one historical session note.

[local] Final `npm run check` and `git diff --check` passed.

## Risks

- Historical evidence keeps old vocabulary by design and must not be treated as the current contract.
- This batch did not runtime-test customer funds because it intentionally did not change runtime behavior.

## Next Actions

- Choose R-04 governance/runtime verification boundary clarification or R-05 customer salesman candidate hardening.
