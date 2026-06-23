# Handover

## Summary

客户管理默认联系人和默认收货地址自动生成及同步迭代已完成运行验收。Current change record: `ai/changes/CR-20260622T150304Z-change`.

## Current Customer State

- Runtime route remains `/business/customer`.
- Customer master and shipping addresses store `province_code`, `city_code`, `district_code` alongside Chinese `province`, `city`, `district`.
- Cascader option `value` is administrative division code; `label` is Chinese name.
- List, detail, and export continue showing Chinese province/city/district names only.
- Historical rows without code remain compatible through name-based edit echo; they are not bulk-backfilled.
- 新增客户时，后端在同一事务内根据基础信息自动生成默认联系人和默认收货地址；如果请求已经提交有意义的子记录，则不重复派生。
- 修改客户时，基础信息默认不覆盖联系人/收货地址。只有勾选“同步到默认联系人”或“同步到默认收货地址”时，才同步对应默认记录。
- 默认收货地址同步保留已有 `logistics_line`；基础详细地址为空时不创建无效默认地址。

## Evidence

- Clean API evidence: `ai/changes/CR-20260622T150304Z-change/runtime-evidence/default-child-api-verification-utf8.json`.
- Clean DB evidence: `ai/changes/CR-20260622T150304Z-change/runtime-evidence/default-child-db-verification-staged-utf8.txt`.
- Browser base/detail evidence: `browser-01-filtered-customer-list.png` and `browser-03-detail-base-tab.png`.
- Contact/address drawer-tab evidence: `browser-04-detail-contact-tab-dom.txt` and `browser-05-detail-address-tab-dom.txt`.
- Validation customer: `默认同步UTF8验证客户20260622162301`, `KH202606000010`.
- Verified: create auto-default contact/address, no-sync no-overwrite, sync update, preserved `保留线路UTF8`, active default contacts = `1`, active default addresses = `1`.
- Component gate exception for pre-existing RuoYi platform/system/tool files is documented in `ai/changes/CR-20260622T150304Z-change/component-exception.md`; no customer-local reusable component was added.
- Boundary gate exception for pre-existing RuoYi router/tool-generator imports is documented in `ai/changes/CR-20260622T150304Z-change/boundary-exception.md`; no customer cross-feature import was added.

## Changed Files

- `ruoyi-business/src/main/java/com/ruoyi/business/customer/domain/Customer.java`
- `ruoyi-business/src/main/java/com/ruoyi/business/customer/service/impl/CustomerServiceImpl.java`
- `ruoyi-ui/src/views/customer/index.vue`
- `features/customer.md`
- `ai/contracts/customer.api.md`
- `ai/contracts/customer.ui.md`
- `ruoyi-ui/src/api/customer.contract.md`
- `memory/API_CATALOG.md`
- `memory/HANDOVER.md`
- `memory/PROJECT_STATE.md`
- `memory/TASKS.json`
- `memory/sessions/2026-06-22-customer.md`
- `ai/changes/CR-20260622T150304Z-change/`
- `ai/changes/CR-20260622T081827Z-change/runtime-validation.md`
- `ai/changes/CR-20260622T081827Z-change/verification.md`
- `ai/changes/CR-20260622T081827Z-change/handover.md`

## Commands

- `npm run resume`
- `npm run ai:do -- "功能迭代：客户管理"`
- `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests compile`
- `npm --prefix ruoyi-ui run build:prod`
- `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests package`
- Backend restart on `18080`; frontend restart on `5174` with `RUOYI_API_BASE=http://127.0.0.1:18080`
- `npm run scan:all`
- `npm run finalize:change -- --summary "客户管理默认联系人和默认收货地址自动生成及同步"`
- `npm run check`
- `npm test`

## Verification

- Backend compile/package passed.
- Frontend production build passed.
- Browser/API/DB runtime validation passed.
- Governance scan/finalize/check passed.
- Standalone Node tests passed.

## Risks

- Historical formal data was not bulk-backfilled with administrative codes. A later reviewed migration can handle that if needed.
- Automatic deposit/rebate deduction remains intentionally deferred to sales order, shipment settlement, and finance modules.
- The local runtime DB includes validation customers from this and previous customer iterations; they were left intact as evidence.

## Next Actions

- Do not add sales order, shipment, finance, or automatic deduction behavior inside customer.
- If formal historical data needs code values, create a separate reviewed backfill/migration change.
