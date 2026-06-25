# Session: Customer Fund Deposit Boundary

## Task

`TASK-0003 / TASK-CUSTOMER` - Implement `CR-20260625T022150Z-change` for customer-management deposit account boundary tightening.

## Status

`in_progress` - Backend service/controller changes, customer contracts/docs, static risk tests, current change record, review approval record, session memory, and live API/DB runtime evidence have been updated. Post-runtime closeout gates passed. The change is not committed or pushed yet.

## Goal

Close the customer fund-entry account boundary:

- `/business/customer/{customerId}/fund/deposit` accepts omitted `accountType` and explicit `CUSTOMER_DEPOSIT`.
- `/fund/deposit` rejects `SAMPLE_REBATE` and any other non-`CUSTOMER_DEPOSIT` `accountType`.
- Rejection must happen before account balance, deposit batch, or fund flow mutation.
- Sample rebate remains separate through `/business/customer/{customerId}/sample-rebate`, which creates `sample_rebate_record` before internal `SAMPLE_REBATE_GENERATE` fund flow.
- Do not develop sales order, modify governance rules, lower gates, or change SQL business table structure.

## Changed Files

- `ruoyi-admin/src/main/java/com/ruoyi/web/controller/business/customer/CustomerController.java`
- `ruoyi-business/src/main/java/com/ruoyi/business/customer/service/ICustomerService.java`
- `ruoyi-business/src/main/java/com/ruoyi/business/customer/service/impl/CustomerServiceImpl.java`
- `tests/customer-risk-gate.test.js`
- `tests/governance-sales-order-handoff-gate.test.js`
- `features/customer.md`
- `ai/contracts/customer.api.md`
- `ruoyi-ui/src/api/customer.contract.md`
- `memory/API_CATALOG.md`
- `memory/PROJECT_STATE.md`
- `memory/HANDOVER.md`
- `memory/CHANGELOG.md`
- `memory/TASKS.json`
- `memory/sessions/2026-06-25-customer-fund-deposit-boundary.md`
- `ai/changes/CR-20260625T022150Z-change/*`
- `ai/reviews/RV-20260625T022214Z-review/*`

## Commands

- `npm run resume`
- `npm run context:build -- customer`
- `npm run ai:do -- "功能迭代：客户管理"`
- `npm run review:feature -- "功能预审：客户管理定金入口资金边界收口" --feature customer`
- `node --test tests/customer-risk-gate.test.js`
- `node --test tests/governance-sales-order-handoff-gate.test.js`
- `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests compile`
- `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests package`
- live API/DB validation on backend `http://127.0.0.1:18080`, database `my_ry_vue_runtime`, Redis DB1
- `npm run scan:all`
- `npm run finalize:change -- --summary "客户管理定金入口资金边界收口"`
- `npm run check`
- `npm test`
- `git diff --check`

## Verification

- `node --test tests/customer-risk-gate.test.js` passed with 7 tests after adding deposit account-boundary coverage.
- `node --test tests/governance-sales-order-handoff-gate.test.js` passed with 16 tests after isolating the file-weight checker fixture from the current CR weight exception.
- Cached Maven backend compile/package passed.
- Live API/DB validation passed with test customer `customer_id=25`, `customer_code=KH202606000021`, marker `RT_DEPOSIT_BOUNDARY_20260625031150`.
- Runtime cases passed: omitted `accountType` deposit, explicit `CUSTOMER_DEPOSIT` deposit, rejected `SAMPLE_REBATE` without mutation, rejected `INVALID_ACCOUNT` without mutation, `/sample-rebate` creating `sample_rebate_record` plus `SAMPLE_REBATE_GENERATE`, and PUBLIC `PUB_DIRECT_SALE` deposit rejection without funds data.
- Captcha was restored to `true` in `sys_config` and Redis DB0/DB1, and `/captchaImage` returned `captchaEnabled=true`.
- `npm run scan:all`, `npm run finalize:change`, `npm run check`, standalone `npm test`, and `git diff --check` passed after live runtime validation.

## Risks

- Test REAL customer `25 / KH202606000021` and its fund evidence remain in local development data for audit traceability.
- `CustomerServiceImpl.java` is an existing over-threshold service; current CR has a scoped `weight-exception.md` because the boundary fix must live at the service layer.
- Sales-order, delivery, finance settlement, automatic deduction, and order-level deposit behavior remain future modules.

## Next Entry Point

Read `ai/changes/CR-20260625T022150Z-change/runtime-validation.md` for live API/DB evidence. Do not add sales-order code or governance-rule changes to this customer-management iteration.
