# Verification

Status: [local] verified

## Commands

- [local] `npm run resume` - passed; current change is `CR-20260625T170213Z-customer-fund-vocabulary-source-cleanup`.
- [local] Required `grep -R` old-fund-vocabulary scan - attempted first and failed because `grep` is not available in this PowerShell environment.
- [local] Required fallback `Select-String -Path * ... -Recurse` - attempted and failed because this PowerShell version does not support `Select-String -Recurse`.
- [local] Equivalent recursive PowerShell scan with `Get-ChildItem -Recurse -File | Select-String` - completed.
- [local] Current-doc old-fund-vocabulary scan across current customer brief, context, contracts, README, handover, project state, changelog, and tasks - no matches.
- [local] `npm run scan:all` - passed.
- [local] `npm run check:high-risk-governance` - passed with the expected non-blocking baseline migration warning for the existing customer DDL markdown baseline.
- [local] First `npm test` - failed because the current CR lacked scoped RuoYi baseline exception files and generated current-context was out of date; it also proved `sql/customer.ownership.md` must remain unchanged in this CR.
- [local] `npm run context:build -- customer` - passed and regenerated current context.
- [local] Second `npm test` - passed with 185/185 Node tests after scoped baseline exceptions were added and the SQL ownership doc change was removed.
- [local] `npm run finalize:change -- --summary "客户资金口径上下文源清理"` - passed.
- [local] `npm run check` - passed with 185/185 Node tests; existing config-safety warnings and high-risk baseline DDL warning remained non-blocking.
- [local] `git diff --check` - passed.

## Old Vocabulary Search Result

Current docs and contracts have no active old-fund-vocabulary matches.

Remaining matches are historical evidence only:

- `ai/changes/CR-20260622T081827Z-change/**` runtime validation and runtime evidence from the first customer implementation.
- `ai/changes/CR-20260622T102456Z-change/**` runtime evidence logs.
- `ai/changes/CR-20260622T150304Z-change/**` browser evidence text.
- `ai/changes/CR-20260623T105432Z-change/**` historical handover/verification/runtime validation.
- `ai/changes/CR-20260623T134224Z-change/verification.md` historical verification note.
- `runtime-logs/customer-backend.out.log` historical local runtime log.
- `memory/sessions/2026-06-23-customer-public-unified-deposit.md` historical session note.

These historical files are not the current customer fund contract and were intentionally not bulk-edited.

## Evidence

- [local] `features/customer.md` now identifies R-03 and states the active two-account vocabulary.
- [local] `features/customer.md`, `ai/context/features/customer.md`, API/DB/UI contracts, and `ruoyi-ui/src/api/customer.contract.md` document that the current customer module only implements customer-level deposit incoming funds.
- [local] Sales-order is documented as customer selection/default contact/default address/owner snapshot plus deposit status prompt only, with no direct customer-fund deduction.
- [local] Delivery / finance are documented as the future owners of customer-level deposit deduction/refund/adjustment/reversal and sample-rebate deduction.
- [local] UI contract wording is unified around `客户级定金账户`, `样品返现账户`, and `资金流水`.
- [local] Route contract is documented as canonical runtime route `/business/customer`, RuoYi menu segment `business/customer`, and direct `/customer` unsupported.
- [local] `sql/customer.ownership.md` was inspected and left unchanged because it already contained the final two-account SQL ownership model and current high-risk tests treat it as a customer runtime ownership path.
- [local] No customer runtime code, sales-order runtime code, production safety config, Java/Vue fund runtime code, migration/idempotency registry, or business database table structure was modified.

## Final Gate Notes

- [local] `npm run check` included `check:change`, `close:change`, `check:diff`, `check:runtime`, and `npm test`.
- [local] No customer runtime code, sales-order runtime code, production safety config, Java/Vue fund runtime code, migration/idempotency registry, or business database table structure was modified.
