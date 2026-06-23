# Handover

## Summary

客户管理编码字典与地址联动优化.

## Scope

- Feature: `customer` / 客户管理.
- Route: `/business/customer`.
- Adapter: locked RuoYi adapter.
- No new sales order, shipment, finance, or other business module was added.
- Profile, rules, scanner, workflow scripts, and governance scripts were not changed.

## What Changed

- New customer code generation now uses `KH + yyyyMM + monthly sequence`, for example `KH202606000001`.
- Monthly suffix starts at `000001`, resets by month, and can expand beyond six digits.
- Code generation retries on duplicate-key conflict and relies on `customer.uk_customer_code`.
- Customer short name remains optional; blank short name on create/update saves as customer name.
- Customer type and level show/export Chinese labels; `NORMAL` now displays/exports as `普通`.
- Add/edit customer and customer-address forms use province/city/district cascaders and save Chinese names into existing `province`, `city`, and `district` fields.
- Customer code table cells use fixed width, no wrap, ellipsis, and tooltip.
- No `province_code`, `city_code`, or `district_code` columns were added.
- Historical `CUS...` test codes were not backfilled.
- Current change record includes component/boundary exception docs for inherited RuoYi baseline files detected by existing heuristics; customer code does not import them and no governance rules were changed.

## Verification

- Backend compile, backend package, and frontend `build:prod` passed.
- Browser validation on `/business/customer` created `KH202606000001` and `KH202606000002`.
- DB validation confirmed no duplicate `KH202606%` codes and confirmed the unique index.
- Browser validation confirmed list/detail labels and address cascader add/edit/echo/save.
- Export XLSX parse verified KH codes, Chinese labels, and province/city/district values.
- `npm run scan:all` passed.
- `npm run finalize:change -- --summary "客户管理编码字典与地址联动优化"` passed.
- `npm run check` passed, including close-change, rule-lock, diff, duplicate, runtime, and 76 Node tests.
- Standalone `npm test` passed with 76 Node tests.
- Evidence is in `runtime-validation.md` and `runtime-evidence/`.

## Remaining

- No remaining customer UX/display iteration work.
- Future sales order, shipment settlement, and finance work remains deferred to separate modules.
