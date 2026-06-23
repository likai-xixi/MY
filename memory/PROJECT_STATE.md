# Project State

## Current Goal

Maintain a chat-driven Codex App development template attached to a RuoYi + Vue3 project base. The user can add, update, and remove business features through conversation while repository gates enforce registry, graph, memory, component, and handoff consistency.

## Status

The governance layer is attached to a RuoYi Spring Boot backend and RuoYi Vue3 frontend base. Feature ownership is tracked through registry, graph, generated scans, change records, memory, and handover files. Customer runtime validation has now been performed against a real local MySQL/Redis/browser stack, the customer closeout deviations have been resolved, the customer code/dictionary/address-cascader UX iteration has been browser-validated, and the customer province/city/district Cascader uses a complete generated China region dataset. Customer follow-up `CR-20260622T124645Z-change` added administrative division code fields to customer master and shipping addresses. Current customer follow-up `CR-20260622T150304Z-change` adds and verifies transactional default contact/default shipping-address generation on customer create and explicit edit-time sync checkboxes so master-data edits do not blindly overwrite child records.

## Active Features

- `customer` — 客户管理 module implemented and registered under the locked RuoYi adapter.

## Active Task

`TASK-CUSTOMER` is verified in `memory/TASKS.json`. The accepted runtime route is `/business/customer`; closeout validation fixed new deposit fund-flow batch traceability and added the customer-detail sample rebate record table. Follow-up `CR-20260622T102456Z-change` changed new customer codes to `KHyyyyMM` monthly sequence, fixed customer type/level display/export labels, added province/city/district cascaders, verified blank short-name fallback, and passed final gates. Follow-up `CR-20260622T114208Z-change` replaced incomplete hand-written area options with `china-area-data@5.0.1` generated utility data and passed final gates. Follow-up `CR-20260622T124645Z-change` stores nullable `province_code`, `city_code`, and `district_code` alongside Chinese names in `customer` and `customer_address`; browser validation confirmed code save/echo/update for customer and shipping addresses, historical no-code compatibility, and Chinese list/detail/export display. Follow-up `CR-20260622T150304Z-change` verifies default contact/default shipping-address auto-create and opt-in edit sync behavior.

## Latest Session

`memory/sessions/2026-06-22-customer.md`

## Next Actions

- Customer administrative-code follow-up has passed backend compile/package, frontend `build:prod`, local DB migration verification, region helper verification, browser add/edit/address/history/export validation, `scan:all`, `finalize:change`, `check`, and standalone `npm test`.
- Current default-child follow-up has passed backend compile, backend package after stopping the locked runtime jar, frontend `build:prod`, local runtime restart on `18080/5174`, browser/API/DB validation, `scan:all`, `finalize:change`, `check`, and standalone `npm test`.
- Use chat requests for future `新增功能`, `功能迭代`, `删除功能预分析`, and `确认删除`.

## Deferred Scope

- Automatic deposit/rebate deduction remains intentionally deferred to sales order, shipment settlement, and finance modules.

## Last Verification

Customer SQL/menu/permission rows were applied to `my_ry_vue_runtime`; backend `18080` and frontend `5174` were started; browser validation covered login, menu, customer add/edit/query/disable/detail, contacts, addresses, owner transfer logs, long-term and rolling deposit flows, sample policy, sample rebate generation, export endpoint, and no direct fund-balance edit. Closeout evidence confirmed `/business/customer` as the accepted menu route, new deposit flows with `CUSTOMER_DEPOSIT_BATCH` traceability, the sample rebate record table, and export button network response. Follow-up browser validation created `KH202606000001` and `KH202606000002`, confirmed no duplicate `KH202606%` code, verified `NORMAL -> 普通` and Chinese customer-type labels in list/detail/export, verified province/city/district cascader add/edit/echo/save, and parsed the exported XLSX. Region-data follow-up verified complete Henan city coverage, Zhejiang/Shandong/Guangdong/Beijing/Shanghai selection, Beijing district save/echo, and export Chinese area values. Administrative-code follow-up verified local DB columns and region helper mapping, restarted the MY backend on `18080`, validated browser add/edit/address/history/export with code fields, and confirmed no browser console warnings/errors. Default-child follow-up verified create auto-default contact/address, edit no-sync no-overwrite, edit sync update, preserved shipping logistics line, and one active default contact/address using browser/API/DB evidence under `CR-20260622T150304Z-change`. Evidence is in `ai/changes/CR-20260622T081827Z-change/runtime-validation.md`, `ai/changes/CR-20260622T102456Z-change/runtime-validation.md`, `ai/changes/CR-20260622T114208Z-change/runtime-validation.md`, `ai/changes/CR-20260622T124645Z-change/runtime-validation.md`, and `ai/changes/CR-20260622T150304Z-change/runtime-validation.md`.
