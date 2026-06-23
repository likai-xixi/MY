# Handover
## Summary
客户管理列表隐藏客户简称列
Current change record: `ai/changes/CR-20260623T071949Z-change`.
## Impact
Current change `CR-20260623T071949Z-change` is limited to the customer management UI list display and customer feature brief. The customer list no longer shows a separate customer short-name column by default. Customer short name remains available for search, add/edit maintenance, export flow, and later business references. No backend, API path, permission code, database schema, funds, sample rebate, deposit, owner transfer, contact, phone, area, or default contact/address behavior was changed.
## Changed Files
- `ai/changes/CR-20260623T055820Z-change/boundary-exception.md`
- `ai/changes/CR-20260623T055820Z-change/changed-files.json`
- `ai/changes/CR-20260623T055820Z-change/component-exception.md`
- `ai/changes/CR-20260623T055820Z-change/handover.md`
- `ai/changes/CR-20260623T055820Z-change/impact.json`
- `ai/changes/CR-20260623T055820Z-change/plan.md`
- `ai/changes/CR-20260623T055820Z-change/request.md`
- `ai/changes/CR-20260623T055820Z-change/verification.md`
- `ai/changes/CR-20260623T071949Z-change/boundary-exception.md`
- `ai/changes/CR-20260623T071949Z-change/changed-files.json`
- `ai/changes/CR-20260623T071949Z-change/component-exception.md`
- `ai/changes/CR-20260623T071949Z-change/handover.md`
- `ai/changes/CR-20260623T071949Z-change/impact.json`
- `ai/changes/CR-20260623T071949Z-change/plan.md`
- `ai/changes/CR-20260623T071949Z-change/request.md`
- `ai/changes/CR-20260623T071949Z-change/verification.md`
- `ai/changes/CURRENT_CHANGE.json`
- `ai/contracts/customer.api.md`
- `ai/contracts/customer.db.md`
- `ai/contracts/customer.delete-ownership.md`
- `ai/contracts/customer.permission.md`
- `ai/contracts/customer.ui.md`
- `ai/generated/api-clients.json`
- `ai/generated/backend-routes.json`
- `ai/generated/component-usage.json`
- `ai/generated/db-schema.json`
- `ai/generated/frontend-routes.json`
- `ai/generated/permissions.json`
- `ai/registry/features.json`
- `ai/registry/modules.json`
- plus 22 additional files in the current change record.
## Commands
- `npm run resume`
- `npm run ai:do -- "功能迭代：客户管理"`
- `npm run impact -- 客户管理`
- `npm --prefix ruoyi-ui run build:prod`
- `npm run scan:all`
- `npm run finalize:change -- --summary "客户管理列表隐藏客户简称列"`
- `npm run check`
## Verification
Static UI verification checks confirmed the customer list no longer contains an independent `label="客户简称"` table column and does not render `scope.row.shortName` under customer name. Customer name still calls `handleView(scope.row)`. Search still binds `queryParams.shortName`, add/edit still binds `form.shortName`, and the short-name placeholder is `选填，不填则同客户名称`. Production build, `npm run scan:all`, and `npm run check` are the closeout checks for this slice.
## Risks
- Browser runtime was not launched for this small UI slice. Remaining confidence comes from source inspection, static assertions, production build, generated scans, and the governance gate.
## Next Actions
- None for this slice after the final governance gate passes. Keep future customer iterations inside a new change record and do not mix sales order, shipment, automatic deduction, finance settlement, DXF, workstation client, or mini-program scope into customer management.
