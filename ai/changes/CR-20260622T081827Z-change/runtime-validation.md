# Customer Runtime Validation

Date: 2026-06-22

## Environment

- Database: Docker container `mj-mysql`, schema `my_ry_vue_runtime`.
- Redis: Docker container `mj-redis`, Redis DB 1.
- Backend: `http://localhost:18080`, original validation PID `39992`; closeout validation PID `35160`, packaged `ruoyi-admin/target/ruoyi-admin.jar`.
- Frontend: `http://127.0.0.1:5174`, PID `37000`, `vite --host 127.0.0.1 --port 5174 --strictPort`.
- Browser login: `admin/admin123`, captcha shown as `9-9=?`, entered `0`.
- Runtime evidence directory: `ai/changes/CR-20260622T081827Z-change/runtime-evidence/`.

## Database Setup

- Applied table/menu/permission SQL from `sql/customer.ownership.md` to `my_ry_vue_runtime`.
- Verified customer tables exist: `customer`, `customer_contact`, `customer_address`, `customer_salesman_bind_log`, `customer_fund_account`, `customer_fund_flow`, `customer_deposit_batch`, `customer_sample_policy`, `sample_rebate_record`.
- Verified `17` customer permission rows and `17` admin role customer menu links.

## Test Data

- Customer: `验收客户20260622092456`
- Customer code: `CUS20260622172644379`
- Phone: `13922092456`
- Export file: `ai/changes/CR-20260622T081827Z-change/runtime-evidence/customer-export.xlsx`

## Browser Acceptance Results

| Item | Result | Evidence |
| --- | --- | --- |
| Apply SQL/menu/permission | Pass | `runtime-evidence/db-verification.txt` |
| Start backend | Pass | `http://localhost:18080/captchaImage` returned 200 |
| Start frontend | Pass | `http://127.0.0.1:5174/` served Vite app |
| Browser login | Pass | `01-login-page.png`, `02-after-login-business-menu.png` |
| Customer menu appears | Pass | Menu shows `业务管理 / 客户管理`; accepted runtime route is `/business/customer`; direct top-level route is not part of the RuoYi menu contract |
| Add customer | Pass | `05-add-customer-dialog.png` through `12-after-customer-add-list.png` |
| Edit customer | Pass | `13-edit-customer-dialog.png` through `15-after-customer-edit-list.png` |
| Query customer | Pass | `16-customer-query-result.png` |
| Disable customer | Pass | `18-disable-customer-confirm.png`, `19-after-customer-disabled.png`; DB `customer.status=1` |
| Detail view | Pass | `20-customer-detail-base.png` |
| Contacts and default switch | Pass | `21-detail-contacts-default.png`; active DB rows have one `Y` and one `N` |
| Addresses and default switch | Pass | `22-detail-addresses-default.png`; active DB rows have one `Y` and one `N` |
| Owner transfer and log | Pass | `23-transfer-owner-dialog.png` through `26-detail-owner-transfer-log.png`; DB log records `研发部门 -> 测试部门` |
| Long-term deposit entry | Pass | Original flow `LONG_TERM_DEPOSIT_IN=1000`; closeout flow `4` stores `related_biz_type=CUSTOMER_DEPOSIT_BATCH`, `related_biz_id=3`, `related_biz_no=DEP20260622175920510` |
| Rolling deposit entry | Pass | Original flow `ROLLING_ORDER_DEPOSIT_IN=500`; closeout flow `5` stores `related_biz_type=CUSTOMER_DEPOSIT_BATCH`, `related_biz_id=4`, `related_biz_no=DEP20260622175920762` |
| Sample policy config | Pass | `33-sample-policy-filled.png`, `34-sample-policy-saved.png`; DB policy `DISCOUNT_AND_REBATE` |
| Sample rebate record | Pass | `37-after-sample-rebate-flow.png`, `closeout-sample-rebate-table.png`; DB/UI record `SAMPLE-20260622092456`, rebate `300`, create time visible |
| Export | Pass | UI export button click captured `Network.responseReceived` for `/dev-api/business/customer/export`, HTTP 200, XLSX MIME; authenticated backend export file also saved |
| Normal edit cannot change fund balance | Pass | `40-edit-dialog-no-fund-balance-fields.png`; regular edit dialog has no fund/balance fields |

## Database Cross-Checks

- `runtime-evidence/db-verification.txt` records customer, owner log, fund accounts, fund flows, deposit batches, sample policy, and sample rebate rows.
- `runtime-evidence/db-active-child-verification.txt` confirms active contacts and addresses only have one default row each. Older child rows from edit are logically deleted with `del_flag=2`.

## Runtime Closeout

1. Route decision: keep the RuoYi runtime menu route `/business/customer`. The parent menu path `business` and child path `customer` are working as configured; `closeout-route-evidence.json`, `closeout-route-business-customer.png`, and `closeout-route-customer-404.png` capture the decision evidence.
2. Deposit fund-flow traceability is fixed for new long-term and rolling deposit entries. New flows now write `related_biz_type=CUSTOMER_DEPOSIT_BATCH`, `related_biz_id=customer_deposit_batch.deposit_batch_id`, and `related_biz_no=customer_deposit_batch.deposit_batch_no`. See `closeout-db-verification.txt`.
3. Customer detail `资金与政策` now includes a dedicated `样品返现记录` table with sample order number, sample amount, support mode, instant discount amount, rebate amount, used amount, remaining amount, status, create time, and remark. See `closeout-sample-rebate-table.png`.
4. Export button is usable. The in-app browser still may not expose a download event, but the actual button click produced an XLSX network response from `/dev-api/business/customer/export` with HTTP 200 and MIME `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`. See `closeout-export-button-network.json`.

## Customer UX Iteration: CR-20260622T102456Z-change

This follow-up keeps the accepted RuoYi route `/business/customer`.

- New customer codes now use `KH + yyyyMM + monthly sequence`; browser validation created `KH202606000001` and `KH202606000002`.
- Historical `CUS...` validation records are not backfilled.
- `customer_code` remains protected by the unique index `uk_customer_code`; duplicate count for `KH202606%` was `0`.
- Customer level `NORMAL` displays and exports as `普通`; customer type values display and export as Chinese labels.
- Add/edit customer dialogs use a province/city/district cascader and continue storing Chinese names in `province`, `city`, and `district`; no `province_code`, `city_code`, or `district_code` columns were added.
- Edit validation echoed `浙江省 / 杭州市 / 滨江区`, changed it to `浙江省 / 宁波市 / 鄞州区`, and detail/export/DB reflected the change.
- Blank short names on create/update save as customer name.
- Evidence is in `ai/changes/CR-20260622T102456Z-change/runtime-validation.md` and `ai/changes/CR-20260622T102456Z-change/runtime-evidence/`.

## Region Data Follow-up: CR-20260622T114208Z-change

This follow-up keeps the accepted RuoYi route `/business/customer` and only fixes customer province/city/district data completeness.

- The incomplete hand-written Cascader options in `ruoyi-ui/src/views/customer/index.vue` were replaced with `ruoyi-ui/src/utils/region-data.js`.
- `region-data.js` is generated from `china-area-data@5.0.1 (MIT)` and covers 34 province-level regions, direct municipalities, autonomous regions, prefecture-level cities/states/leagues, and district/county/county-level-city nodes.
- 河南省 now exposes 18 city-level options, including 开封市、安阳市、新乡市、许昌市、南阳市、商丘市、周口市、驻马店市、信阳市、焦作市、濮阳市、漯河市、三门峡市、平顶山市、鹤壁市、济源示范区.
- Direct municipalities keep complete 3-level paths, for example `北京市 / 北京市 / 朝阳区`.
- No `province_code`, `city_code`, or `district_code` columns were added. Customer v1 stores Chinese names only; future logistics/region-statistics work can add administrative division code fields through a separate DB change.
- Browser validation created `省市区完整验证客户20260622115256` with `河南省 / 开封市 / 龙亭区`, echoed it in edit, saved `北京市 / 北京市 / 朝阳区`, and confirmed list/detail/export Chinese names.
- Evidence is in `ai/changes/CR-20260622T114208Z-change/runtime-validation.md` and `ai/changes/CR-20260622T114208Z-change/runtime-evidence/`.

## Administrative Division Code Follow-up: CR-20260622T124645Z-change

This follow-up keeps the accepted RuoYi route `/business/customer` and only completes province/city/district code persistence for customer master data and shipping addresses.

- Added nullable `province_code`, `city_code`, and `district_code` to `customer` and `customer_address`.
- Cascader values now use administrative division codes and labels remain Chinese names.
- Customer and shipping-address create/update payloads save both code fields and Chinese `province`, `city`, `district` fields.
- List, detail, and export continue to display Chinese names rather than code values.
- Historical rows without code fields are not force-backfilled; edit forms try Chinese-name matching and write codes on the next confirmed save.
- Backend compile, backend package, frontend `build:prod`, local DB migration, and initial `scan:all` passed. Browser validation is tracked in `ai/changes/CR-20260622T124645Z-change/runtime-validation.md`.

## Default Contact And Address Follow-up: CR-20260622T150304Z-change

This follow-up keeps the accepted RuoYi route `/business/customer` and only changes customer create/edit default child-data behavior.

- New customer create now derives a default contact from master `contactName/contactPhone/wechat` when no meaningful child contact is submitted.
- New customer create now derives a default shipping address from master contact, phone, area code/name fields, and detail address when no meaningful child address is submitted and detail address exists.
- Customer edit adds explicit `同步到默认联系人` and `同步到默认收货地址` options. Existing default child records are not overwritten unless the matching option is checked.
- Backend compile, backend package after stopping the locked MY jar, frontend `build:prod`, MY runtime restart, transaction code evidence, browser/API/DB runtime validation, and final gates passed.
- Detailed evidence is tracked in `ai/changes/CR-20260622T150304Z-change/runtime-validation.md`; UTF-8 API/DB evidence is in `runtime-evidence/default-child-api-verification-utf8.json` and `runtime-evidence/default-child-db-verification-staged-utf8.txt`.

## Commands Run

- `npm run resume`
- Applied SQL from `sql/customer.ownership.md` to `my_ry_vue_runtime` with `docker exec mj-mysql mysql`.
- `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests package`
- Started backend on `18080`.
- Started frontend on `5174`.
- Browser acceptance via in-app browser.
- Closeout backend compile, backend package, frontend `build:prod`, browser route/UI/export validation, and DB persistence checks.
- Final gates passed after this runtime-validation update: `npm run scan:all`, `npm run finalize:change -- --summary "客户管理运行偏差收口"`, `npm run check`, and standalone `npm test`.
- Follow-up customer UX iteration additionally ran backend compile/package, frontend `build:prod`, browser runtime validation, export XLSX parsing, and `npm run scan:all`; final follow-up gates are tracked in `CR-20260622T102456Z-change`.
- Region data follow-up additionally ran frontend `build:prod`, browser runtime validation, DB/export checks, and tracks final gates in `CR-20260622T114208Z-change`.
