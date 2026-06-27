# Handover

## Summary

R-09A.2 split customer fund high-risk permissions into dedicated deposit and sample-rebate permissions

## Impact

This change affects 28 recorded path(s). See changed-files.json for the complete coverage list.

## Changed Files

- `ai/changes/CR-20260627T133559Z-r-09a-2-customer-high-risk-permission-granularit/boundary-exception.md`
- `ai/changes/CR-20260627T133559Z-r-09a-2-customer-high-risk-permission-granularit/changed-files.json`
- `ai/changes/CR-20260627T133559Z-r-09a-2-customer-high-risk-permission-granularit/component-exception.md`
- `ai/changes/CR-20260627T133559Z-r-09a-2-customer-high-risk-permission-granularit/handover.md`
- `ai/changes/CR-20260627T133559Z-r-09a-2-customer-high-risk-permission-granularit/impact.json`
- `ai/changes/CR-20260627T133559Z-r-09a-2-customer-high-risk-permission-granularit/plan.md`
- `ai/changes/CR-20260627T133559Z-r-09a-2-customer-high-risk-permission-granularit/request.md`
- `ai/changes/CR-20260627T133559Z-r-09a-2-customer-high-risk-permission-granularit/rule-preflight.md`
- `ai/changes/CR-20260627T133559Z-r-09a-2-customer-high-risk-permission-granularit/verification.md`
- `ai/changes/CURRENT_CHANGE.json`
- `ai/context/current-context.json`
- `ai/context/current-context.md`
- `ai/generated/api-clients.json`
- `ai/generated/backend-routes.json`
- `ai/generated/component-usage.json`
- `ai/generated/db-schema.json`
- `ai/generated/frontend-routes.json`
- `ai/generated/permissions.json`
- `ai/registry/features.json`
- `ai/registry/high-risk-permission-coverage.json`
- `memory/CHANGELOG.md`
- `memory/HANDOVER.md`
- `memory/PROJECT_STATE.md`
- `memory/TASKS.json`
- `ruoyi-admin/src/main/java/com/ruoyi/web/controller/business/customer/CustomerController.java`
- `ruoyi-ui/src/views/customer/index.vue`
- `sql/migrations/V20260625_003_customer_menu_permission.sql`
- `tests/customer-risk-gate.test.js`

## Commands

- [local] `npm run resume`
- [local] `npm run rule:preflight -- customer-fund-deposit-entry customer-sample-rebate-generation public-customer-invariant`
- [local] `npm run scan:all`
- [local] `npm run check:ownership`
- [local] `npm run check:high-risk-governance`
- [local] `node --test tests/customer-risk-gate.test.js`
- [local] `npm test`
- [local] `npm run check`
- [local] `git diff --check`

## Verification

[local] `npm run check` remains the final gate. The current verification evidence records local resume, rule preflight, scan, ownership, high-risk governance, customer risk gate, and full Node test results for this permission-only change.

## Risks

- [not-run] Backend runtime API call, browser validation, Maven compile, frontend production build, database migration execution, and CI were not performed in this pass because the change only splits permissions and updates SQL seed/registry/test coverage.
- [local] Scoped boundary/component exception files in this CR carry forward pre-existing RuoYi system/tool baseline exceptions so `npm test` and `npm run check` evaluate the current CR without broadening global rules.

## Next Actions

- Apply the updated customer menu permission SQL in any target database that needs the new `business:customer:fund:deposit` and `business:customer:sample-rebate:create` menu rows.
- Continue R-09B sales-order pre-implementation contracts only after this change closes; `beforeSalesOrder` remains blocked.
