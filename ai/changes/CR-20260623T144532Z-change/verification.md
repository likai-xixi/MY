# Verification

Status: verified

## Commands

- `npm run resume` passed.
- `npm run ai:do -- "功能迭代：客户管理"` opened `CR-20260623T144532Z-change`.
- `npm run impact -- 客户管理` passed with no blockers.
- `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests compile` passed.
- `npm --prefix ruoyi-ui run build:prod` passed.
- `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests package` passed for runtime API validation.
- Runtime API validation against `http://localhost:18080/business/customer` passed after temporarily disabling captcha in `my_ry_vue_runtime`.
- Captcha was restored after API validation; `/captchaImage` returned `captchaEnabled=true` after backend restart.
- `npm run scan:all` passed.
- `npm run finalize:change -- --summary "客户管理联系电话手机号校验"` passed.
- `npm run check` passed, including change handoff integrity, close-change, runtime checker, and 97 Node tests.
- Standalone `npm test` passed with 97 Node tests.
- `git diff --check` passed.

## Evidence

Substantive validation evidence is recorded below. The runtime API results verify backend fallback behavior, and the frontend evidence verifies the Element Plus rule wiring and production build for the page-level validation change.

## Runtime API Evidence

- REAL create with empty `contactPhone` returned `code=500`, `msg=联系电话不能为空`.
- REAL create with `contactPhone=1856584` returned `code=500`, `msg=联系电话必须为11位手机号`.
- REAL create with `contactPhone=12345678901` returned `code=500`, `msg=联系电话必须为11位手机号`.
- REAL create with `contactPhone=18565840000` returned `code=200`, `msg=操作成功`.
- REAL update with `contactPhone=1856584` returned `code=500`, `msg=联系电话必须为11位手机号`.
- REAL update with `contacts[0].phone=1856584` returned `code=500`, `msg=第1个联系人电话必须为11位手机号`.
- REAL update with `addresses[0].receiverPhone=12345678901` returned `code=500`, `msg=第1条收货地址联系电话必须为11位手机号`.
- PUBLIC create with invalid submitted `contactPhone`, contact child phone, and address receiver phone returned `code=200`, `msg=操作成功`.
- PUBLIC detail after create returned `customerNature=PUBLIC`, `publicChannel=DIRECT_SALE`, `contactPhone=null`, `contactCount=0`, and `addressCount=0`.

## Frontend Evidence

- `ruoyi-ui/src/views/customer/index.vue` defines `MOBILE_PHONE_PATTERN = /^1[3-9]\d{9}$/`.
- The Element Plus `contactPhone` rule for REAL customers now runs required validation first, then mobile-phone format validation with `联系电话必须为11位手机号`.
- PUBLIC customer forms skip `contactPhone` validation because the predicate is `!isPublicCustomerForm.value`.
- `validateChildPhoneSelections()` blocks filled but invalid `contacts[].phone` and `addresses[].receiverPhone` values before `prepareCustomerBeforeSave()`.
- Existing red-star and `clearValidate()` behavior from the required-field change remains unchanged.
- Browser automation was not rerun in this closeout because only Node REPL was exposed for browser control in the current tool context; the production frontend build and source-level rule checks passed.

## Scope Checks

- No SQL table/column/check constraint change.
- No API route change.
- No permission-code change.
- No deposit, sample-rebate, sales-order, delivery, finance, automatic deduction, receipt claiming, reconciliation, order-level deposit, or buyer-snapshot scope added.
