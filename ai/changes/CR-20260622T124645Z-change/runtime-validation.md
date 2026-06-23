# Runtime Validation

Date: 2026-06-22

## Scope

Customer administrative division code completion only. No sales order, shipment, finance, profile, rule, scanner, workflow, or governance-script changes.

## Database

- Applied nullable columns to local schema `my_ry_vue_runtime`.
- `customer`: `province_code`, `city_code`, `district_code`.
- `customer_address`: `province_code`, `city_code`, `district_code`.
- Existing historical rows are not forcibly backfilled; future backfill should be a separately reviewed name-to-code migration.
- Evidence: `runtime-evidence/db-area-code-columns.txt`.

## Region Data

- `ruoyi-ui/src/utils/region-data.js` uses administrative division code values and Chinese labels.
- Verified code/name mapping for Henan, Zhejiang, Shandong, Guangdong, Beijing, and Shanghai.
- Verified `河南省 / 郑州市 / 中原区` resolves to `410000 / 410100 / 410102`.
- Verified `北京市 / 北京市 / 朝阳区` resolves to `110000 / 110100 / 110105`.
- Verified historical `河南省 / 省直辖县级行政区划 / 济源市` can name-match to `410000 / 419000 / 419001` and display `济源示范区`.
- Evidence: `runtime-evidence/region-code-helper-check.json`, `runtime-evidence/region-code-coverage-check.json`.

## Runtime Stack

- Backend rebuilt and restarted from `D:\Project\MY\ruoyi-admin\target\ruoyi-admin.jar` on `http://localhost:18080`; `/captchaImage` returned 200.
- Frontend is running on `http://127.0.0.1:5174`; `/dev-api/business/customer/list` reaches backend and returns 401 without login, confirming the proxy points to the MY backend.
- Browser login succeeded after the user allowed handling the local RuoYi CAPTCHA.
- Runtime page: `/business/customer`.

## Browser And DB Validation

- Added customer `行政编码验证客户20260622135304` through the browser add dialog with `河南省 / 郑州市 / 中原区`.
- DB verified customer save: `province_code=410000`, `province=河南省`, `city_code=410100`, `city=郑州市`, `district_code=410102`, `district=中原区`.
- Edit dialog echoed the customer Cascader by saved code as `河南省 / 郑州市 / 中原区`.
- Modified the customer master area to `广东省 / 广州市 / 天河区`; DB verified `440000 / 440100 / 440106` with matching Chinese names.
- Added a shipping address in the customer edit dialog with `山东省 / 济南市 / 历下区`; DB verified `370000 / 370100 / 370102` with matching Chinese names.
- Reopened the edit dialog and verified the shipping-address Cascader echoed `山东省 / 济南市 / 历下区` by code.
- Detail drawer base information and address tab display Chinese province/city/district names only, not codes.
- Historical rows with Chinese names but NULL code fields were found and verified. Example `KH202606000003` opened in edit without crashing and name-matched to `北京市 / 北京市 / 朝阳区`.
- Export endpoint returned a valid XLSX; parsed row `KH202606000004` shows customer type `经销商`, customer level `普通`, and area `广东省 / 广州市 / 天河区`, without code columns.
- Browser console after validation had no error/warning entries.

## Runtime Evidence

- `runtime-evidence/browser-cascader-search-zhongyuan.png`
- `runtime-evidence/browser-add-customer-area-selected.png`
- `runtime-evidence/browser-list-added-customer-area-code.png`
- `runtime-evidence/db-customer-area-code-save.txt`
- `runtime-evidence/browser-edit-area-code-echo.png`
- `runtime-evidence/browser-cascader-search-tianhe.png`
- `runtime-evidence/browser-list-edited-customer-area-code.png`
- `runtime-evidence/db-customer-area-code-update.txt`
- `runtime-evidence/browser-address-cascader-search-lixia.png`
- `runtime-evidence/browser-address-area-selected.png`
- `runtime-evidence/db-address-area-code-save.txt`
- `runtime-evidence/browser-address-area-code-echo.png`
- `runtime-evidence/db-historical-name-only-candidates.txt`
- `runtime-evidence/browser-historical-name-only-area-echo.png`
- `runtime-evidence/browser-detail-chinese-area.png`
- `runtime-evidence/browser-detail-address-chinese-area.png`
- `runtime-evidence/customer-export-area-code.xlsx`
- `runtime-evidence/export-request.json`
- `runtime-evidence/export-xlsx-area-check.json`
- `runtime-evidence/browser-console-after-area-code-validation.json`

## Build And Gate Verification

- `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests compile` passed after browser validation.
- `npm --prefix ruoyi-ui run build:prod` passed after browser validation.
- `npm run scan:all` passed after final doc/evidence updates were prepared.
- `npm run finalize:change -- --summary "客户管理省市区行政区划编码补齐"` passed.
- `npm run check` passed with 76 Node tests.
- Standalone `npm test` passed with 76 Node tests.
