# Session: Customer PUBLIC Fixed Classification

## Task

`TASK-0003 / TASK-CUSTOMER` - Implement `CR-20260623T235902Z-change` for PUBLIC public-customer口径收口: fixed system classification rows, no normal PUBLIC add/edit, no PUBLIC type/level business display, and backend protection for public create/edit/delete/status/owner-change.

## Status

`in_progress` - Customer implementation, backend compile/package, frontend production build, generated scans, runtime API validation, captcha restore, scoped RuoYi platform component/boundary exceptions, `finalize:change`, `npm run check`, `npm test`, and `git diff --check` have passed.

## Goal

Keep the current REAL/PUBLIC model, factory/salesman owner口径, REAL required-field/mobile validation, and unified `CUSTOMER_DEPOSIT` / `SAMPLE_REBATE` fund model intact while making PUBLIC a fixed system classification concept:

- only `PUB_DIRECT_SALE` and `PUB_SELF_MEDIA` are intended PUBLIC rows;
- normal customer add/edit only maintains REAL customers;
- PUBLIC rows are visible for order classification but not maintained like true customers;
- source platform/account/buyer/reception details remain future sales-order snapshot fields.

## Changed Files

- `ruoyi-ui/src/views/customer/index.vue`
- `ruoyi-ui/src/api/customer.js`
- `ruoyi-business/src/main/java/com/ruoyi/business/customer/service/impl/CustomerServiceImpl.java`
- `ruoyi-business/src/main/java/com/ruoyi/business/customer/mapper/CustomerMapper.java`
- `ruoyi-business/src/main/resources/mapper/customer/CustomerMapper.xml`
- `sql/customer.ownership.md`
- `features/customer.md`
- `ai/contracts/customer.api.md`
- `ai/contracts/customer.db.md`
- `ai/contracts/customer.ui.md`
- `memory/API_CATALOG.md`
- `ai/registry/features.json`
- `ai/changes/CR-20260623T235902Z-change/request.md`
- `ai/changes/CR-20260623T235902Z-change/plan.md`
- `ai/changes/CR-20260623T235902Z-change/component-exception.md`
- `ai/changes/CR-20260623T235902Z-change/boundary-exception.md`
- `ai/changes/CR-20260623T235902Z-change/verification.md`
- `ai/changes/CR-20260623T235902Z-change/runtime-validation.md`
- `ai/changes/CR-20260623T235902Z-change/handover.md`
- `memory/PROJECT_STATE.md`
- `memory/TASKS.json`
- `memory/HANDOVER.md`
- `memory/CHANGELOG.md`
- `memory/sessions/2026-06-24-customer-public-fixed-classification.md`

## Commands

- `npm run resume`
- `npm run ai:do -- "功能迭代：客户管理"` timed out in the shell but created `CR-20260623T235902Z-change`.
- `npm run impact -- 客户管理`
- `mvn -pl ruoyi-admin -am -DskipTests compile` failed because `mvn` is not on PATH.
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

- Backend compile passed with cached Maven.
- Frontend `build:prod` passed.
- `npm run scan:all` passed.
- `npm run finalize:change -- --summary "客户管理公共客户固定分类口径收口"` passed.
- Runtime API validation passed for PUBLIC manual create rejection, built-in PUBLIC edit/status/delete/owner-change rejection, and REAL reserved public-code rejection.
- Captcha was restored to true and `/captchaImage` returned `captchaEnabled=true`.
- `npm run check:components`, `node --test tests/component-checker.test.js`, `node --test tests/boundary-lint.test.js`, and `npm run check:boundaries` passed after adding exact current-change exceptions for pre-existing RuoYi platform files.
- `npm run check` passed.
- `npm test` passed with 97 tests.
- `git diff --check` passed.

## Risks

- The local `my_ry_vue_runtime` database still contains older PUBLIC validation rows from previous iterations. Rebuild or clean the development customer-owned tables from `sql/customer.ownership.md` before claiming runtime data contains only the two seed PUBLIC rows.
- Browser-click validation was not rerun for this closeout; UI behavior is covered by source inspection, API validation, and production build.
- The RuoYi platform baseline gate fix is scoped to exact current-change exception files; do not broaden it into a `ruoyi-ui/src/views/**` whitelist.

## Next Entry Point

Run `npm run resume`, inspect `ai/changes/CR-20260623T235902Z-change/verification.md` and `runtime-validation.md`, then either rebuild/clean the dev DB for exact PUBLIC seed validation or proceed with commit/push after reviewing `git status --short`. Do not add sales-order, delivery, finance, channel/showroom/account, performance, commission, old deposit enum, customer public pool, or order-level deposit behavior to this customer-management change.

## Boundaries

This change does not add sales-order, delivery, finance, channel management, showroom management, account management, performance reports, commission calculation, customer public pool, automatic deduction, receipt claiming, reconciliation, order-level deposit, or buyer snapshots. Later sales-order work should capture actual buyer/source/reception information on the order, not by creating additional PUBLIC customer rows.
