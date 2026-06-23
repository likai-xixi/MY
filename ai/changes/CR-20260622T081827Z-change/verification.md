# Verification

Status: passed

## Commands

- `npm run resume` - passed before closeout work.
- `npm run impact -- 客户管理` - passed with no blockers; customer RuoYi roots and change/memory/graph/docs were allowed.
- `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests compile` - passed after fund-flow and UI changes.
- `npm --prefix ruoyi-ui run build:prod` - passed after adding the sample rebate record table.
- `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests package` - first attempt failed because the running backend locked `ruoyi-admin.jar`; after stopping PID `39992`, the package passed and backend restarted as PID `35160`.
- Browser closeout validation - passed for accepted route `/business/customer`, direct top-level route 404 evidence, detail-page sample rebate record table, and export button network response.
- Database closeout validation - passed for new fund flows `4` and `5` with `related_biz_type=CUSTOMER_DEPOSIT_BATCH`, deposit-batch ids, and `DEP...` related business numbers.
- `npm run scan:all` - passed after closeout changes.
- `npm run finalize:change -- --summary "客户管理运行偏差收口"` - passed.
- `npm run check` - passed, including scan check, registry, ownership, graph, memory, handover, component, boundary, stale-doc, orphan, close-change, rule-lock, diff, duplicate, runtime checks, and 76 Node tests.
- `npm test` - passed separately with 76 Node tests.

## Evidence

Closeout keeps the RuoYi runtime route `/business/customer`; direct top-level customer path is not part of the accepted menu contract. New long/rolling deposit entries write fund-flow related business data to the created deposit batch. Customer detail now shows a dedicated `样品返现记录` table. The UI export button produced an HTTP 200 XLSX network response.

Follow-up `CR-20260622T102456Z-change` keeps `/business/customer` and validates the customer UX/display iteration: `KH202606000001` and `KH202606000002` generation, no duplicate `KH202606%` codes, `NORMAL -> 普通`, Chinese customer type labels, province/city/district cascader add/edit/echo/save, blank short-name fallback, and XLSX export values. Detailed evidence lives under `ai/changes/CR-20260622T102456Z-change/runtime-evidence/`.

Follow-up `CR-20260622T114208Z-change` keeps `/business/customer` and validates the province/city/district data-source fix: incomplete hand-written Cascader options were replaced with `china-area-data@5.0.1` generated data, Henan has 18 city-level nodes with no required gaps, Beijing/Shanghai and Zhejiang/Shandong/Guangdong selection work, add/edit echo/save persist Chinese names, and export XLSX shows the saved Chinese province/city/district values. Detailed evidence lives under `ai/changes/CR-20260622T114208Z-change/runtime-evidence/`.

Follow-up `CR-20260622T124645Z-change` completes administrative division code persistence for customer master and shipping addresses: nullable `province_code`, `city_code`, and `district_code` columns were added, Cascader values now use codes while labels remain Chinese names, add/edit payloads save both code and name fields, and historical name-only rows remain compatible through name matching. Detailed evidence lives under `ai/changes/CR-20260622T124645Z-change/runtime-evidence/`.

Follow-up `CR-20260622T150304Z-change` adds default child-data behavior for customer create/edit: create auto-generates default contact/default shipping address from master fields when no meaningful child records are submitted, and edit uses explicit sync flags instead of blindly overwriting child records. Backend compile/package, frontend `build:prod`, local runtime restart, browser/API/DB validation, transaction code evidence, final `scan:all`, `finalize:change`, `check`, and standalone `npm test` passed. Detailed evidence lives under `ai/changes/CR-20260622T150304Z-change/runtime-evidence/`.

Key evidence files:

- `runtime-evidence/closeout-route-evidence.json`
- `runtime-evidence/closeout-route-business-customer.png`
- `runtime-evidence/closeout-route-customer-404.png`
- `runtime-evidence/closeout-db-verification.txt`
- `runtime-evidence/closeout-sample-rebate-table.png`
- `runtime-evidence/closeout-export-button-network.json`
- `../CR-20260622T114208Z-change/region-data-module-check.json`
- `../CR-20260622T114208Z-change/runtime-evidence/02-henan-cascader-search-results.png`
- `../CR-20260622T114208Z-change/runtime-evidence/10-list-area-column-beijing.png`
- `../CR-20260622T114208Z-change/runtime-evidence/export-region-verification.txt`
- `../CR-20260622T124645Z-change/runtime-evidence/db-area-code-columns.txt`
- `../CR-20260622T124645Z-change/runtime-evidence/region-code-helper-check.json`
- `../CR-20260622T150304Z-change/runtime-evidence/runtime-processes.txt`
- `../CR-20260622T150304Z-change/runtime-evidence/transaction-code-evidence.txt`
- `../CR-20260622T150304Z-change/runtime-evidence/default-child-api-verification-utf8.json`
- `../CR-20260622T150304Z-change/runtime-evidence/default-child-db-verification-staged-utf8.txt`
