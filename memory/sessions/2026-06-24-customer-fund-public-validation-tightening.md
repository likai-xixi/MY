# Session: Customer Fund/Public Validation Tightening

## Task

`TASK-0003 / TASK-CUSTOMER` - Implement `CR-20260624T010638Z-change` for customer-management validation tightening: deposit entry入金-only, REAL phone trim/validation, PUBLIC fixed-classification runtime evidence, and stable owner-log ordering.

## Status

`in_progress` - Code, docs, runtime API/DB validation, local PUBLIC development-data cleanup, captcha restore, generated scans, finalize, `npm run check`, standalone `npm test`, and `git diff --check` have passed or are being rerun for the cleanup update. A test-backed customer risk regression gate was added. The change is not committed or pushed.

## Goal

Keep the current customer module scope intact while tightening runtime behavior:

- customer deposit entry must not perform deduction, refund, adjustment, or reversal;
- REAL phone fields should be trimmed before validation/save;
- duplicate-warning should not use obviously invalid mobile phone values for phone duplicate lookup;
- PUBLIC stays fixed to the two seed classification customers and normal UI/API PUBLIC maintenance remains blocked;
- owner-change logs should show the latest same-second change first.
- risk regression coverage should prevent future drift of the deposit-in-only endpoint, API contract/export parity, edit-sync user-requirement docs, and fixed PUBLIC seed invariants.

## Changed Files

- `ruoyi-business/src/main/java/com/ruoyi/business/customer/service/impl/CustomerServiceImpl.java`
- `ruoyi-business/src/main/resources/mapper/customer/CustomerMapper.xml`
- `ruoyi-ui/src/views/customer/index.vue`
- `ruoyi-ui/src/api/customer.contract.md`
- `features/customer.md`
- `sql/customer.ownership.md`
- `ai/contracts/customer.api.md`
- `ai/contracts/customer.ui.md`
- `memory/API_CATALOG.md`
- `memory/PROJECT_STATE.md`
- `memory/TASKS.json`
- `memory/HANDOVER.md`
- `memory/CHANGELOG.md`
- `memory/sessions/2026-06-24-customer-fund-public-validation-tightening.md`
- `ai/changes/CR-20260624T010638Z-change/request.md`
- `ai/changes/CR-20260624T010638Z-change/verification.md`
- `ai/changes/CR-20260624T010638Z-change/runtime-validation.md`
- `ai/changes/CR-20260624T010638Z-change/handover.md`
- `ai/changes/CR-20260624T010638Z-change/component-exception.md`
- `ai/changes/CR-20260624T010638Z-change/boundary-exception.md`
- `tests/customer-risk-gate.test.js`

## Commands

- `npm run resume`
- `npm run ai:do -- "功能迭代：客户管理"`
- `npm run impact -- 客户管理`
- `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests compile`
- `npm --prefix ruoyi-ui run build:prod`
- `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests package`
- runtime API/DB validation against `http://localhost:18080`
- `npm run scan:all`
- `npm run finalize:change -- --summary "客户管理资金入金与公共客户口径校验收口"`
- `npm run check`
- `npm test`
- `git diff --check`
- `node --test tests/customer-risk-gate.test.js`
- `npm run scan:all`
- `npm run finalize:change -- --summary "客户管理风险防复发门禁"`
- `git diff --check`
- `npm run check`
- `npm test`
- `git diff --check`
- local development DB PUBLIC cleanup on `my_ry_vue_runtime`
- post-clean SQL invariant checks
- post-clean runtime API rejection validation for PUBLIC create/edit/status/delete/owner-change
- `npm run check`
- `npm test`
- `git diff --check`

## Verification

- Cached Maven compile passed.
- Frontend `build:prod` passed.
- Cached Maven package passed after stopping the MY backend process that locked `ruoyi-admin.jar`.
- Runtime API validation on `http://localhost:18080` created REAL validation customer `22`.
- Deposit entry with omitted `flowType` and with `DEPOSIT_IN` both wrote `DEPOSIT_IN`.
- Invalid deposit flow types were rejected and did not change the customer deposit balance.
- DB evidence for customer `22` showed `CUSTOMER_DEPOSIT / DEPOSIT_IN / CUSTOMER_DEPOSIT_BATCH`.
- Invalid REAL master phone and invalid contact phone were rejected.
- Phone values with surrounding spaces were saved trimmed.
- Owner assign-maintenance and return-factory both updated current owner fields, and latest owner log ordering was verified after the mapper change.
- Captcha was restored to true and `/captchaImage` returned `captchaEnabled=true`.
- `npm run scan:all` passed.
- `npm run finalize:change -- --summary "客户管理资金入金与公共客户口径校验收口"` passed.
- `npm run check` passed, including 97 Node tests.
- Standalone `npm test` passed with 97 Node tests.
- `git diff --check` passed.
- `node --test tests/customer-risk-gate.test.js` passed with 5 tests.
- `npm run scan:all` passed after adding the risk gate.
- `npm run finalize:change -- --summary "客户管理风险防复发门禁"` passed.
- `git diff --check` passed after the risk-gate update.
- `npm run check` passed after the risk-gate update, including 102 Node tests.
- Standalone `npm test` passed after the risk-gate update with 102 Node tests.
- Final `git diff --check` passed after standalone tests.
- Local development DB PUBLIC cleanup passed: pre-clean PUBLIC count `8`, backup suffix `20260624_211203`, 6 non-seed PUBLIC rows deleted, post-clean PUBLIC count `2`.
- Post-clean SQL invariant checks passed: non-seed PUBLIC count `0`, duplicate `public_channel` count `0`, both seed rows `MATCH`, and all PUBLIC child dirty counts `0`.
- Post-clean runtime API validation passed: PUBLIC create, seed edit, seed status change, seed delete, and owner transfer all rejected; captcha restored to `true` in `sys_config` and Redis DB0/DB1.

## Risks

- The current local development database has been cleaned for the two-row PUBLIC seed invariant. Future manual DB writes or validation scripts can still introduce drift, so rerun the SQL invariant checks before relying on runtime PUBLIC data cleanliness.
- Dedicated deposit deduction/refund/adjust/reversal processing remains future work and was intentionally not added.
- Current-change component/boundary exceptions are exact RuoYi platform baseline paths only; do not broaden them into a `ruoyi-ui/src/views/**` whitelist.
- There is no standalone `check:customer-risk` package script in this customer update CR because `package.json` is protected by the rule-lock gate. Equivalent coverage is the new `tests/customer-risk-gate.test.js`, which runs through the existing `npm test` script included by `npm run check`.

## Next Entry Point

Run `npm run resume`, inspect `ai/changes/CR-20260624T010638Z-change/verification.md` and `runtime-validation.md`, then commit/push only when the user explicitly asks. Do not add sales-order, delivery, finance, reconciliation, production, commission, old deposit enum, or order-level deposit behavior to this customer-management change.
