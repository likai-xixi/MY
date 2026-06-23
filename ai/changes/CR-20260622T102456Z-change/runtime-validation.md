# Runtime Validation: 客户管理编码字典与地址联动优化

Change: `CR-20260622T102456Z-change`
Route: `/business/customer`

## Runtime Stack

- Local database: `my_ry_vue_runtime` in Docker container `mj-mysql`.
- Redis: Docker container `mj-redis`, database `1`.
- Backend: restarted `ruoyi-admin/target/ruoyi-admin.jar` on `http://localhost:18080`.
- Frontend: existing Vite dev server on `http://127.0.0.1:5174`.

## Completed Evidence

- Backend package passed after customer backend changes.
- Frontend `build:prod` passed after UI changes.
- `/captchaImage` returned HTTP 200 after backend restart.
- `customer.uk_customer_code` exists and is unique on `customer_code`.
- Browser login used the local RuoYi captcha shown as `9-7=?`; answer `2` was entered after user confirmation.
- Browser created two customers:
  - `编码优化客户A202606221835` -> `KH202606000001`
  - `编码优化客户B202606221835` -> `KH202606000002`
- Export XLSX saved as `runtime-evidence/customer-encoding-address-export.xlsx`.

## Runtime Test Matrix

| Check | Status | Evidence |
| --- | --- | --- |
| New code format `KHyyyyMM000001` style | Pass | `04-after-two-customers-list-kh-codes.png`, `db-customer-ux-verification.txt` |
| Same-month code increment | Pass | `KH202606000001` and `KH202606000002` created in browser; `db-customer-ux-verification.txt` |
| `customer_code` uniqueness | Pass | DB index check confirmed `uk_customer_code` |
| Customer code table cell no-wrap | Pass | `04-after-two-customers-list-kh-codes.png` |
| Level `NORMAL` displays as `普通` in list/detail/export | Pass | `01-customer-list-normal-label.png`, `05-detail-type-level-address.png`, `export-xlsx-verification.txt` |
| Customer type displays as Chinese label in list/detail/export | Pass | `04-after-two-customers-list-kh-codes.png`, `05-detail-type-level-address.png`, `export-xlsx-verification.txt` |
| New customer province/city/district cascader | Pass | `02-area-cascader-filter-zhejiang.png`, `03-add-customer-area-selected.png` |
| Edit customer cascader echo and save | Pass | `06-edit-dialog-area-echo.png`, `07-edit-area-changed-before-save.png`, `09-detail-after-edit-address.png`, `db-customer-ux-verification.txt` |
| Empty short name falls back to customer name | Pass | Created A/B with blank short name; list/DB/export show short name equals customer name |
| Export XLSX values | Pass | `customer-encoding-address-export.xlsx`, `export-xlsx-verification.txt` |

## Notes

- Historical `CUS...` test records are not backfilled by this iteration.
- No province/city/district code columns were added; the UI persists Chinese names into existing `province`, `city`, and `district` fields.
- The UI export button was clicked in the browser with no console errors; XLSX content was verified from an authenticated backend export using the same RuoYi endpoint.
- Code-generation boundary check inserted `KH202606999999` and `KH2026061000000` inside a transaction, confirmed `KH2026061000000` is selected as the max code, then rolled back. See `db-code-unique-and-boundary.txt`.
