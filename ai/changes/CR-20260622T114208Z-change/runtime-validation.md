# Runtime Validation: 客户管理省市区完整数据源修复

Change: `CR-20260622T114208Z-change`
Route: `/business/customer`
Date: 2026-06-22

## Runtime Stack

- Database: local MySQL schema `my_ry_vue_runtime` in Docker container `mj-mysql`.
- Backend: existing RuoYi backend on `http://localhost:18080`.
- Frontend: existing Vite dev server on `http://127.0.0.1:5174`.
- Browser: in-app browser, logged in to `/business/customer`.

## Scope

- Replaced the incomplete hand-written customer area Cascader options with a generated utility data file: `ruoyi-ui/src/utils/region-data.js`.
- Source package checked: `china-area-data@5.0.1 (MIT)`.
- The generated tree covers 34 province-level regions, direct municipalities, autonomous regions, prefecture-level cities/states/leagues, and district/county/county-level-city nodes.
- Direct municipalities are normalized to complete 3-level paths such as `北京市 / 北京市 / 朝阳区`.
- `河南省 / 省直辖县级行政区划 / 济源市` is displayed and echoed as `河南省 / 济源示范区 / 济源市`.
- At the time of this change, no backend or database fields were added and Customer v1 still stored Chinese names only in `province`, `city`, and `district`. Follow-up `CR-20260622T124645Z-change` supersedes this limitation by adding nullable `province_code`, `city_code`, and `district_code` to customer master and shipping addresses while keeping Chinese-name display.

## Runtime Test Matrix

| Check | Status | Evidence |
| --- | --- | --- |
| 河南省 has complete city-level choices | Pass | `region-data-module-check.json`, `runtime-evidence/02-henan-cascader-search-results.png`, `runtime-evidence/henan-cascader-search-text.txt` |
| 浙江省、山东省、广东省、北京市、上海市 can be selected/searched | Pass | `runtime-evidence/09-multi-province-cascader-search.png`, `runtime-evidence/multi-province-cascader-search.json` |
| Direct municipality selection to district | Pass | `北京市 / 北京市 / 朝阳区` selected in edit dialog; `runtime-evidence/07-edit-dialog-beijing-selected.png` |
| Add customer with area selection | Pass | Created `省市区完整验证客户20260622115256` with `河南省 / 开封市 / 龙亭区`; `runtime-evidence/03-add-customer-henan-selected.png`, `runtime-evidence/04-list-after-henan-customer-add.png` |
| Edit customer area echo | Pass | Existing `河南省 / 开封市 / 龙亭区` echoed in edit Cascader; `runtime-evidence/06-edit-dialog-henan-echo.png` |
| Edit customer area save | Pass | Changed to `北京市 / 北京市 / 朝阳区`; detail/list/DB reflect the new values; `runtime-evidence/08-detail-beijing-address.png`, `runtime-evidence/db-region-verification.txt` |
| List/detail/export Chinese area names | Pass | `runtime-evidence/10-list-area-column-beijing.png`, `runtime-evidence/05-detail-henan-address.png`, `runtime-evidence/export-region-verification.txt` |
| Export values remain Chinese | Pass | Authenticated export returned XLSX HTTP 200 and parsed row with `北京市 / 北京市 / 朝阳区`; `runtime-evidence/export-http-evidence.json`, `runtime-evidence/customer-region-export.xlsx` |
| Frontend build | Pass | `npm --prefix ruoyi-ui run build:prod` passed after adding `region-data.js` |
| Final gates | Pass | `npm run scan:all`, `npm run finalize:change -- --summary "客户管理省市区完整数据源修复"`, `npm run check`, and standalone `npm test` passed |

## Notes

- The in-app browser did not expose a download event for the export click within the short wait window, consistent with prior validation. The export endpoint was verified with the browser session token and returned a valid XLSX file.
- The add/edit dialogs remain searchable (`filterable`) and block partial province/city/district paths before save.
- Contacts, shipping address rows, owner transfer, funds, and sample policy flows were not changed by this iteration.
