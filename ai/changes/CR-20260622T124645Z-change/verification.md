# Verification

Status: passed

## Commands Passed

- `npm run resume`
- `npm run ai:do -- "功能迭代：客户管理"`
- `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests compile`
- `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests package`
- `npm --prefix ruoyi-ui run build:prod`
- local DB migration against `my_ry_vue_runtime`
- local backend restart on `18080`
- browser validation on `http://127.0.0.1:5174/business/customer`
- export XLSX parse verification
- `npm run scan:all`
- `npm run finalize:change -- --summary "客户管理省市区行政区划编码补齐"`
- `npm run check`
- `npm test`

## Runtime Evidence

- Added customer through browser with `河南省 / 郑州市 / 中原区`.
- DB verified saved customer codes and Chinese names: `410000 / 河南省`, `410100 / 郑州市`, `410102 / 中原区`.
- Edit dialog echoed the customer Cascader by code.
- Edited the customer area to `广东省 / 广州市 / 天河区`; DB verified `440000 / 440100 / 440106`.
- Added shipping address with `山东省 / 济南市 / 历下区`; DB verified `370000 / 370100 / 370102`.
- Reopened edit dialog and verified shipping-address Cascader echo by code.
- Historical name-only record `KH202606000003` with NULL code fields opened without crash and name-matched to `北京市 / 北京市 / 朝阳区`.
- List, detail base, detail address tab, and export continue to show Chinese province/city/district values.
- Export XLSX row `KH202606000004` shows `经销商`, `普通`, `广东省`, `广州市`, `天河区`; no code columns are exported.
- Browser console evidence after validation is an empty warning/error list.

## Evidence Files

- `runtime-validation.md`
- `runtime-evidence/db-area-code-columns.txt`
- `runtime-evidence/region-code-helper-check.json`
- `runtime-evidence/region-code-coverage-check.json`
- `runtime-evidence/db-customer-area-code-save.txt`
- `runtime-evidence/db-customer-area-code-update.txt`
- `runtime-evidence/db-address-area-code-save.txt`
- `runtime-evidence/db-historical-name-only-candidates.txt`
- `runtime-evidence/export-xlsx-area-check.json`
- `runtime-evidence/browser-console-after-area-code-validation.json`
- browser screenshots under `runtime-evidence/browser-*.png`

## Final Gates

- `npm run check` passed with 76 Node tests.
- Standalone `npm test` passed with 76 Node tests.
