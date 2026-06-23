# Handover

## Summary

客户管理列表隐藏客户简称列

## Impact

This change is limited to customer management UI display behavior and customer feature documentation. The customer list no longer renders a separate `shortName` table column by default, while short-name search, add/edit maintenance, export flow, API contracts, backend fallback semantics, permissions, database schema, funds, sample rebate, deposit, owner transfer, contacts, phone, area, and default contact/address logic remain unchanged.

## Changed Files

- `ai/changes/CR-20260623T055820Z-change/boundary-exception.md`
- `ai/changes/CR-20260623T055820Z-change/changed-files.json`
- `ai/changes/CR-20260623T055820Z-change/component-exception.md`
- `ai/changes/CR-20260623T055820Z-change/handover.md`
- `ai/changes/CR-20260623T055820Z-change/impact.json`
- `ai/changes/CR-20260623T055820Z-change/plan.md`
- `ai/changes/CR-20260623T055820Z-change/request.md`
- `ai/changes/CR-20260623T055820Z-change/verification.md`
- `ai/changes/CR-20260623T071949Z-change/changed-files.json`
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
- `features/customer.md`
- `graph/api-graph.json`
- `graph/module-graph.json`
- `graph/ui-graph.json`
- `memory/API_CATALOG.md`
- `memory/CHANGELOG.md`
- `memory/HANDOVER.md`
- `memory/PROJECT_STATE.md`
- `memory/TASKS.json`
- `ruoyi-admin/src/main/java/com/ruoyi/web/controller/business/customer`
- `ruoyi-admin/src/main/java/com/ruoyi/web/controller/business/customer/CustomerController.java`
- `ruoyi-admin/src/main/java/com/ruoyi/web/controller/business/customer/README.md`
- `ruoyi-business/src/main/java/com/ruoyi/business/customer`
- `ruoyi-business/src/main/java/com/ruoyi/business/customer/README.md`
- `ruoyi-business/src/main/resources/mapper/customer/CustomerMapper.xml`
- `ruoyi-ui/src/api/customer.contract.md`
- `ruoyi-ui/src/api/customer.js`
- `ruoyi-ui/src/utils/region-data.js`
- `ruoyi-ui/src/views/customer`
- `ruoyi-ui/src/views/customer/README.md`
- `ruoyi-ui/src/views/customer/index.vue`
- `sql/customer.ownership.md`

## Commands

- `npm run resume`
- `npm run ai:do -- "功能迭代：客户管理"`
- `npm run impact -- 客户管理`
- Static UI verification for customer list/search/add-edit behavior
- `npm --prefix ruoyi-ui run build:prod`
- `npm run scan:all`
- `npm run finalize:change -- --summary "客户管理列表隐藏客户简称列"`
- `npm run check`

## Verification

Static UI verification confirmed that the customer list no longer contains an independent `label="客户简称"` table column, does not render `scope.row.shortName` under customer name, and still keeps the customer name detail click handler. Search still binds `queryParams.shortName`, add/edit still binds `form.shortName`, and the placeholder now reads `选填，不填则同客户名称`. Production build and `npm run scan:all` passed. The full `npm run check` gate is rerun after this evidence update.

## Risks

- No backend, database, permission, API, export, funds, sample rebate, deposit, owner transfer, contact, phone, area, or default contact/address behavior was intentionally changed.
- Browser runtime verification was not launched in this turn; coverage is from source inspection, static assertions, production build, scanner gates, and the project governance check.

## Next Actions

- None for this slice after the final governance gate passes. Future customer-management work should continue through a new change record and stay inside the customer module boundary.
