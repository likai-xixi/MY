# Handover

## Summary

Current change record: `ai/changes/CR-20260623T235902Z-change`.

The latest customer iteration locks down PUBLIC public customers as fixed system classification customers. PUBLIC is no longer a normal add/edit choice, public rows do not show real-customer type/level labels, and backend APIs reject normal create/edit/delete/status/owner-change operations for PUBLIC rows. REAL customer validation, factory/salesman ownership rules, unified `CUSTOMER_DEPOSIT`, and independent `SAMPLE_REBATE` remain unchanged.

## Impact

This is a customer-module business change plus a scoped RuoYi platform baseline gate exception. It affects the customer list/add/edit/detail UI, customer service save/status/delete/owner-change protections, customer mapper uniqueness support, customer SQL ownership documentation, customer contracts, API catalog, registry metadata, generated scans, current change-record evidence, and project memory. It does not add or modify sales-order, delivery, finance, channel, showroom, account, performance, commission, scanner, rule, or profile code.

## Changed Files

Primary customer files changed in the current iteration:

- `ruoyi-ui/src/views/customer/index.vue`
- `ruoyi-ui/src/api/customer.js`
- `ruoyi-business/src/main/java/com/ruoyi/business/customer/service/impl/CustomerServiceImpl.java`
- `ruoyi-business/src/main/java/com/ruoyi/business/customer/mapper/CustomerMapper.java`
- `ruoyi-business/src/main/resources/mapper/customer/CustomerMapper.xml`
- `features/customer.md`
- `sql/customer.ownership.md`
- `ai/contracts/customer.api.md`
- `ai/contracts/customer.db.md`
- `ai/contracts/customer.ui.md`
- `memory/API_CATALOG.md`
- `ai/registry/features.json`
- `ai/changes/CR-20260623T235902Z-change/*`

Submission-gate baseline files added under the current change record:

- `ai/changes/CR-20260623T235902Z-change/component-exception.md`
- `ai/changes/CR-20260623T235902Z-change/boundary-exception.md`

The working tree still includes earlier customer change-record directories from `CR-20260623T134224Z-change`, `CR-20260623T144532Z-change`, and `CR-20260623T155049Z-change`. Do not revert them without an explicit user request.

## Commands

- `npm run resume`
- `npm run ai:do -- "功能迭代：客户管理"`
- `npm run impact -- 客户管理`
- `mvn -pl ruoyi-admin -am -DskipTests compile`
- `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests compile`
- `npm --prefix ruoyi-ui run build:prod`
- `npm run scan:all`
- `npm run finalize:change -- --summary "客户管理公共客户固定分类口径收口"`
- `npm run check:components`
- `node --test tests/component-checker.test.js`
- `node --test tests/boundary-lint.test.js`
- `npm run check:boundaries`
- `npm run check`
- `npm test`
- `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests package`
- runtime API validation against `http://localhost:18080/business/customer`
- `git diff --check`

## Verification

Passed:

- cached Maven backend compile
- `npm --prefix ruoyi-ui run build:prod`
- `npm run scan:all`
- `npm run finalize:change -- --summary "客户管理公共客户固定分类口径收口"`
- `npm run check:components`
- `node --test tests/component-checker.test.js`
- `node --test tests/boundary-lint.test.js`
- `npm run check:boundaries`
- cached Maven backend package for runtime validation
- runtime API validation for PUBLIC create/edit/status/delete/owner-change rejection and reserved-code rejection
- captcha restore check with `/captchaImage` returning `captchaEnabled=true`
- `npm run check`
- `npm test`
- `git diff --check`

Plain `mvn -pl ruoyi-admin -am -DskipTests compile` failed because Maven is not on `PATH`; cached Maven passed.

## Risks

- Browser-click validation was not rerun for this closeout; UI behavior is supported by code inspection, API validation, and a successful production build.
- The local runtime database has older PUBLIC validation rows from earlier iterations. The final SQL ownership file defines only two seed PUBLIC rows and `uk_customer_public_channel`, but the development database needs rebuild or cleanup before it can prove the exact two-row PUBLIC invariant.

## Next Actions

- If runtime data cleanliness matters next, rebuild or clean the customer-owned development tables from `sql/customer.ownership.md`.
- Before committing future changes, review `git status --short` and rerun the project gate.
