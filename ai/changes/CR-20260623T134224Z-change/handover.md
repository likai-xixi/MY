# Handover

## Summary

Customer add/edit now has matching frontend Element Plus form validation and backend conditional save validation for REAL and PUBLIC customer rules.

## Impact

This change stays inside customer management and customer UI contract/feature documentation. It does not change SQL structure, API routes, permission codes, deposit model, sales order, delivery, finance, automatic deduction, receipt claiming, reconciliation, order-level deposits, or buyer snapshot scope.

## Code Changes

- `ruoyi-ui/src/views/customer/index.vue`
  - Added Element Plus form rules for customer name, nature, type, level, public channel, REAL contact/phone/owner/area/address.
  - Added conditional validators `requiredWhen(...)` and `areaPathRequiredWhenReal()`.
  - Kept `customerRef.validate(...)` as the submit gate.
  - `handleFormNatureChange(...)` now calls `clearValidate()` so hidden REAL/PUBLIC errors do not persist after switching customer nature.
  - PUBLIC still clears contact/address/owner/sync fields before save.
- `ruoyi-business/src/main/java/com/ruoyi/business/customer/service/impl/CustomerServiceImpl.java`
  - Added conditional save validation in `normalizeCustomerForSave(...)`.
  - REAL customers require customer type, customer level, main contact, contact phone, owner salesman, province/city/district, and detail address.
  - PUBLIC customers require public channel but still allow empty contact, phone, owner, area, address, contacts, and addresses.
- `features/customer.md` and `ai/contracts/customer.ui.md`
  - Documented add/edit required-field behavior and REAL/PUBLIC validation differences.

## Verification

See `verification.md` for detailed command output and runtime evidence. Highlights:

- Cached Maven backend compile passed.
- Frontend `build:prod` passed.
- Backend package passed after stopping the old locked MY runtime jar.
- API validation rejected all required REAL/PUBLIC missing-field cases with Chinese messages.
- API validation confirmed REAL short-name defaulting and default contact/address creation still work.
- API/DB/detail validation confirmed PUBLIC save/update clears real-customer fields and child contacts/addresses.
- Browser validation confirmed REAL empty form errors, REAL -> PUBLIC error clearing and public-channel requirement, and PUBLIC -> REAL rule reactivation.
- `npm run scan:all` and `npm run finalize:change -- --summary "客户管理新增编辑非空校验"` passed.
- `npm run check` passed, including `close:change`, runtime checker, and 97 Node tests.
- Standalone `npm test` passed with 97 Node tests.
- `git diff --check` passed with only the `memory/CHANGELOG.md` line-ending warning.

## Runtime Notes

- The first runtime API attempt used the default `ry-vue` DB and exposed that it still had old schema (`customer_nature` missing). Runtime validation was then switched to the already rebuilt `my_ry_vue_runtime` development DB with final customer DDL.
- Captcha was temporarily disabled in local DB config for API/browser validation and restored to `true`; the backend was restarted and `/captchaImage` confirmed `captchaEnabled=True`.
- Browser auth was done by setting a temporary `Admin-Token` cookie for `http://127.0.0.1:5174`.

## Risks

- No unresolved business-model risk is known for this customer validation scope.
- The default `ry-vue` DB still has an old customer schema. Runtime customer validation should use `my_ry_vue_runtime`, which has the final customer DDL.
- This change intentionally does not add SQL NOT NULL/CHECK constraints because PUBLIC customers do not require REAL-only fields.

## Next Actions

- Final gates passed; the change is ready for user review and user-approved commit/push.
- Do not add sales order, delivery, finance, automatic deduction, receipt claiming, reconciliation, order-level deposit, or buyer-snapshot scope to customer management.
