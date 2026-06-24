# Session: Customer Required Validation

## Task

`TASK-0003 / TASK-CUSTOMER` - Add customer add/edit required-field validation and matching backend fallback validation in `CR-20260623T134224Z-change`.

## Status

`verified` for implementation, backend compile, frontend build, backend package, API validation, browser validation, scan, finalize evidence, `npm run check`, standalone `npm test`, and `git diff --check`.

## Goal

Add customer add/edit non-empty validation for the existing REAL/PUBLIC customer model without changing the unified deposit model, database structure, API routes, permissions, or future sales/delivery/finance scopes.

## Changed Files

- `ruoyi-ui/src/views/customer/index.vue`
- `ruoyi-business/src/main/java/com/ruoyi/business/customer/service/impl/CustomerServiceImpl.java`
- `features/customer.md`
- `ai/contracts/customer.ui.md`
- `ai/changes/CR-20260623T134224Z-change/`
- `memory/PROJECT_STATE.md`
- `memory/TASKS.json`
- `memory/HANDOVER.md`
- `memory/CHANGELOG.md`
- `memory/sessions/2026-06-23-customer-required-validation.md`

## Commands

- `npm run resume`
- `npm run ai:do -- "功能迭代：客户管理"`
- `npm run impact -- 客户管理`
- `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests compile`
- `npm --prefix ruoyi-ui run build:prod`
- `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests package`
- Runtime API validation against `http://localhost:18080/business/customer`
- Browser validation on `http://127.0.0.1:5174/business/customer`
- `npm run scan:all`
- `npm run finalize:change -- --summary "客户管理新增编辑非空校验"`
- `npm run check`
- `npm test`
- `git diff --check`

## Verification

- Frontend add/edit now validates through `customerRef.validate(...)`.
- Always required: customer name, customer nature, customer type, customer level.
- REAL required: main contact, contact phone, owner salesman, complete province/city/district, detail address.
- PUBLIC required: public channel.
- Customer nature switching clears stale REAL/PUBLIC validation errors.
- Backend `normalizeCustomerForSave(...)` rejects direct API saves using the same REAL/PUBLIC required-field split.
- API validation rejected missing REAL customer name/type/level/contact/phone/owner/district/address and PUBLIC missing public channel.
- API validation confirmed REAL short-name defaulting and default contact/address creation still work.
- API/DB/detail validation confirmed PUBLIC save/update clears contact, phone, owner, address, contacts, and addresses.
- Browser validation confirmed REAL empty-form errors, REAL -> PUBLIC error clearing and public-channel requirement, and PUBLIC -> REAL validation reactivation.
- `npm run scan:all` passed.
- `npm run finalize:change -- --summary "客户管理新增编辑非空校验"` passed.
- `npm run check` passed, including `close:change`, runtime checker, and 97 Node tests.
- Standalone `npm test` passed with 97 Node tests.
- `git diff --check` passed with only the `memory/CHANGELOG.md` line-ending warning.

## Follow-up: Mobile Phone Validation

`CR-20260623T144532Z-change` extends this validation slice with mainland China mobile-phone format checks:

- REAL master `contactPhone` must match `^1[3-9]\d{9}$`.
- PUBLIC customers remain exempt from contact-phone validation and still clear submitted contact/phone/address children before save.
- Optional `contacts[].phone` and `addresses[].receiverPhone` are validated only when filled.
- Frontend `contactPhone` rules now run required validation and then `联系电话必须为11位手机号` format validation for REAL customers.
- Backend `CustomerServiceImpl` enforces the same REAL/PUBLIC split for direct API saves.
- Runtime API validation rejected REAL empty phone, `1856584`, `12345678901`, invalid REAL update phone, invalid contact child phone, and invalid shipping-address receiver phone.
- Runtime API validation accepted REAL `18565840000` and PUBLIC invalid submitted phone while detail showed `contactPhone=null`, `contactCount=0`, and `addressCount=0`.
- Backend compile, frontend `build:prod`, backend package/runtime restart, `npm run scan:all`, and `npm run finalize:change -- --summary "客户管理联系电话手机号校验"` passed.
- `npm run check` passed, including close-change and 97 Node tests.
- Standalone `npm test` passed with 97 Node tests.
- `git diff --check` passed.
- Captcha was temporarily disabled in `my_ry_vue_runtime` for API token acquisition, then restored; `/captchaImage` returned `captchaEnabled=true`.

## Risks

- The default `ry-vue` database still has an old customer schema missing `customer_nature`; current customer runtime validation should use the rebuilt `my_ry_vue_runtime` development DB.
- This change does not add SQL NOT NULL/CHECK constraints by design; conditional business validation lives in the service because PUBLIC customers intentionally do not require REAL-only fields.

## Next Entry Point

Run `npm run resume`, read `ai/changes/CR-20260623T134224Z-change/verification.md`, then continue with user review or user-approved commit/push. Do not add sales order, delivery, finance, automatic deduction, receipt claiming, reconciliation, order-level deposit, or buyer-snapshot scope to customer management.
