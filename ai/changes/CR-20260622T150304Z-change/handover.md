# Handover

## Summary

Customer default contact/default shipping-address generation and edit-time sync are implemented and runtime-validated. Scope stayed inside the existing `customer` RuoYi adapter module; no sales order, shipment, finance, profile, scanner, rule, workflow, or governance scripts were changed.

## Implemented Behavior

- Create customer now derives one default contact from master contact/phone/WeChat when no meaningful submitted contact exists.
- Create customer now derives one default shipping address from master contact/phone/area/detail-address when no meaningful submitted address exists and detail address is present.
- Edit customer exposes request-only `syncDefaultContact` and `syncDefaultAddress` flags from the UI base tab.
- Edit without sync flags leaves existing default contact/default shipping address unchanged.
- Edit with sync flags updates only the active default child record, or creates it when missing.
- Default shipping-address sync preserves existing `logistics_line`.
- Default normalization ignores blank child rows and keeps one meaningful default.

## Key Files

- `ruoyi-business/src/main/java/com/ruoyi/business/customer/domain/Customer.java`
- `ruoyi-business/src/main/java/com/ruoyi/business/customer/service/impl/CustomerServiceImpl.java`
- `ruoyi-ui/src/views/customer/index.vue`
- `features/customer.md`
- `ai/contracts/customer.api.md`
- `ai/contracts/customer.ui.md`
- `ruoyi-ui/src/api/customer.contract.md`
- `memory/API_CATALOG.md`
- `ai/changes/CR-20260622T150304Z-change/runtime-validation.md`
- `ai/changes/CR-20260622T150304Z-change/component-exception.md`
- `ai/changes/CR-20260622T150304Z-change/boundary-exception.md`

## Evidence

- API/DB validation customer: `默认同步UTF8验证客户20260622162301`, `customer_id=17`, `customer_code=KH202606000010`.
- Clean UTF-8 evidence: `runtime-evidence/default-child-api-verification-utf8.json` and `runtime-evidence/default-child-db-verification-staged-utf8.txt`.
- Browser evidence: `browser-01-filtered-customer-list.png`, `browser-03-detail-base-tab.png`, `browser-04-detail-contact-tab-dom.txt`, and `browser-05-detail-address-tab-dom.txt`.
- Transaction evidence: `runtime-evidence/transaction-code-evidence.txt`.

## Verification

- Backend compile passed.
- Frontend `build:prod` passed.
- Backend package passed after stopping the locked MY runtime jar.
- MY backend/frontend restarted on `18080/5174`; frontend proxy corrected to `RUOYI_API_BASE=http://127.0.0.1:18080`.
- `npm run scan:all` passed.
- `npm run finalize:change -- --summary "客户管理默认联系人和默认收货地址自动生成及同步"` passed.
- `npm run check` passed.
- Standalone `npm test` passed.

## Notes

- The in-app browser screenshot API timed out on contact/address drawer-tab screenshots; those tab-specific records are DOM text evidence.
- `component-exception.md` documents only pre-existing RuoYi platform/system/tool files flagged by generic component-name heuristics. No customer-local reusable component was added.
- `boundary-exception.md` documents only pre-existing RuoYi router/tool-generator cross-feature imports. No customer cross-feature import was added.
- The local runtime database contains validation customers from customer iterations; these are test records and were not cleaned by this non-destructive workflow.
