# Handover

## Summary

客户管理省市区完整数据源修复.

Current change record: `ai/changes/CR-20260622T114208Z-change`.

## Changed Files

- `ruoyi-ui/src/views/customer/index.vue`
- `ruoyi-ui/src/utils/region-data.js`
- `features/customer.md`
- `ai/contracts/customer.ui.md`
- `ai/registry/features.json`
- `ai/registry/modules.json`
- `ai/changes/CR-20260622T081827Z-change/runtime-validation.md`
- `ai/changes/CR-20260622T081827Z-change/verification.md`
- `ai/changes/CR-20260622T081827Z-change/handover.md`
- `ai/changes/CR-20260622T114208Z-change/`
- `memory/HANDOVER.md`
- `memory/PROJECT_STATE.md`
- `memory/TASKS.json`
- `memory/sessions/2026-06-22-customer.md`

## Commands

- `npm run resume`
- `npm run ai:do -- "功能迭代：客户管理"`
- `npm run impact -- 客户管理`
- `npm run scan:all`
- `npm run finalize:change -- --summary "客户管理省市区完整数据源修复"`
- `npm --prefix ruoyi-ui run build:prod`
- `npm run check`
- `npm test`
- Browser runtime validation on `/business/customer`
- Export XLSX parse verification

## Verification

- Root cause: customer page used incomplete hand-written province/city/district options; 河南省 only exposed a small mock subset.
- Fix: `ruoyi-ui/src/views/customer/index.vue` imports `@/utils/region-data`; incomplete inline options were removed.
- Data source: `ruoyi-ui/src/utils/region-data.js` is generated from `china-area-data@5.0.1 (MIT)`, covers 34 province-level regions, and keeps complete 3-level Cascader paths.
- The data file was moved out of `ruoyi-ui/src/views/customer/` so scanners do not treat it as a fake `/customer/region-data` screen.
- 河南省 now has 18 city-level nodes and no required missing cities; 北京市/上海市 direct municipalities can select to district.
- Browser validation created `省市区完整验证客户20260622115256` with `河南省 / 开封市 / 龙亭区`, echoed it in edit, saved `北京市 / 北京市 / 朝阳区`, and confirmed list/detail/DB/export Chinese names.
- Frontend production build passed after the frontend code change.
- Final gates passed: `npm run check` and standalone `npm test` both completed with 76 Node tests.

## Evidence

- `ai/changes/CR-20260622T114208Z-change/runtime-validation.md`
- `ai/changes/CR-20260622T114208Z-change/region-data-module-check.json`
- `ai/changes/CR-20260622T114208Z-change/runtime-evidence/02-henan-cascader-search-results.png`
- `ai/changes/CR-20260622T114208Z-change/runtime-evidence/06-edit-dialog-henan-echo.png`
- `ai/changes/CR-20260622T114208Z-change/runtime-evidence/07-edit-dialog-beijing-selected.png`
- `ai/changes/CR-20260622T114208Z-change/runtime-evidence/10-list-area-column-beijing.png`
- `ai/changes/CR-20260622T114208Z-change/runtime-evidence/export-region-verification.txt`
- `ai/changes/CR-20260622T114208Z-change/runtime-evidence/db-region-verification.txt`

## Risks

- At the time of this change, no `province_code`, `city_code`, or `district_code` columns were added. Follow-up `CR-20260622T124645Z-change` supersedes that risk by adding nullable code fields to customer master and shipping addresses while preserving Chinese-name display.
- The generated region dataset increases the customer page chunk size, but `build:prod` succeeds and the data is scoped to the customer UI.
- Export button download events remain hard to capture in the in-app browser, so the export was verified by authenticated XLSX HTTP response and parsed workbook content.

## Next Actions

- Customer province/city/district data-source fix is closed for `CR-20260622T114208Z-change`.
- Keep later sales order, shipment settlement, finance, and automatic deduction work as separate future modules.
