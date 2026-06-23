# Handover

## Summary

客户管理省市区行政区划编码补齐已完成实现和真实库/浏览器验证，当前变更记录为 `CR-20260622T124645Z-change`。

## What Changed

- Added nullable administrative division code fields to `customer` and `customer_address`: `province_code`, `city_code`, `district_code`.
- Updated `Customer`, `CustomerAddress`, and `CustomerMapper.xml` so customer master and shipping-address APIs receive, persist, list, detail-return, and edit-echo the code fields.
- Updated customer UI Cascader behavior so `value` is administrative division code and `label` is Chinese name.
- Customer add/edit and shipping-address add/edit save both code fields and Chinese names.
- List, detail, and export continue to display Chinese names only.
- Historical rows without code are not force-backfilled. Edit forms try name-based matching and write codes on the next confirmed save.
- Existing RuoYi baseline exception notes for the current CR are documented in `boundary-exception.md` and `component-exception.md`; no governance rule was modified or weakened.

## Runtime Evidence

- Browser add customer: `河南省 / 郑州市 / 中原区`.
- DB customer insert: `410000 / 河南省`, `410100 / 郑州市`, `410102 / 中原区`.
- Browser edit echo by code: `河南省 / 郑州市 / 中原区`.
- Browser edit update and DB verification: `广东省 / 广州市 / 天河区` with `440000 / 440100 / 440106`.
- Browser shipping-address add and DB verification: `山东省 / 济南市 / 历下区` with `370000 / 370100 / 370102`.
- Browser shipping-address edit echo by code passed.
- Historical name-only customer `KH202606000003` opened in edit and name-matched `北京市 / 北京市 / 朝阳区`.
- Detail base/address tab and export display Chinese names, not codes.
- Export XLSX parsed successfully: customer type `经销商`, level `普通`, area `广东省 / 广州市 / 天河区`.
- Browser console warnings/errors after validation: none.

## Key Evidence Files

- `ai/changes/CR-20260622T124645Z-change/runtime-validation.md`
- `ai/changes/CR-20260622T124645Z-change/runtime-evidence/db-customer-area-code-save.txt`
- `ai/changes/CR-20260622T124645Z-change/runtime-evidence/db-customer-area-code-update.txt`
- `ai/changes/CR-20260622T124645Z-change/runtime-evidence/db-address-area-code-save.txt`
- `ai/changes/CR-20260622T124645Z-change/runtime-evidence/browser-edit-area-code-echo.png`
- `ai/changes/CR-20260622T124645Z-change/runtime-evidence/browser-address-area-code-echo.png`
- `ai/changes/CR-20260622T124645Z-change/runtime-evidence/browser-historical-name-only-area-echo.png`
- `ai/changes/CR-20260622T124645Z-change/runtime-evidence/export-xlsx-area-check.json`
- `ai/changes/CR-20260622T124645Z-change/runtime-evidence/region-code-coverage-check.json`

## Verification

- Backend compile passed with `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests compile`.
- Frontend production build passed with `npm --prefix ruoyi-ui run build:prod`.
- `npm run scan:all` passed.
- `npm run finalize:change -- --summary "客户管理省市区行政区划编码补齐"` passed.
- `npm run check` passed with 76 Node tests.
- Standalone `npm test` passed with 76 Node tests.

## Risks And Notes

- Historical formal data was not bulk-backfilled. This is intentional; a later controlled migration can match names to codes after business review.
- Existing historical validation customers may still have NULL code fields until edited and saved.
- Automatic sales-order, shipment, and finance deductions remain deferred to their own future modules.
