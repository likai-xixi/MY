# Handover

## Summary

客户管理定金入口资金边界收口.

## Impact

This customer change routes external `POST /business/customer/{customerId}/fund/deposit` through a deposit-only service method. The endpoint accepts omitted `accountType` or explicit `CUSTOMER_DEPOSIT`, rejects `SAMPLE_REBATE` and any other non-`CUSTOMER_DEPOSIT` value before account balance, deposit batch, or fund flow mutation, and keeps sample rebate creation on `/business/customer/{customerId}/sample-rebate`.

No sales-order implementation, governance-rule change, or SQL business table structure change is included.

## Changed Files

- See `changed-files.json` for the exact current-change record.
- Key runtime files: `CustomerController.java`, `ICustomerService.java`, and `CustomerServiceImpl.java`.
- Key evidence files: `runtime-validation.md`, `tests/customer-risk-gate.test.js`, `tests/governance-sales-order-handoff-gate.test.js`, `features/customer.md`, `ai/contracts/customer.api.md`, `ruoyi-ui/src/api/customer.contract.md`, `memory/API_CATALOG.md`, current CR files, and `RV-20260625T022214Z-review`.

## Commands

- `npm run resume`
- `npm run context:build -- customer`
- `npm run ai:do -- "功能迭代：客户管理"`
- `npm run review:feature -- "功能预审：客户管理定金入口资金边界收口" --feature customer`
- `node --test tests/customer-risk-gate.test.js`
- `node --test tests/governance-sales-order-handoff-gate.test.js`
- `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests compile`
- `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests package`
- Docker/Desktop runtime startup for `mj-mysql`, `mj-redis`, and backend `http://127.0.0.1:18080`
- Live API/DB validation recorded in `runtime-validation.md`
- `npm run scan:all`
- `npm run finalize:change -- --summary "客户管理定金入口资金边界收口"`
- `npm run check`
- `npm test`
- `git diff --check`

## Verification

Passed: targeted customer risk tests with 7 tests, governance handoff gate tests with 16 tests, cached Maven backend compile/package for `ruoyi-admin`, live API/DB validation on backend `http://127.0.0.1:18080` against database `my_ry_vue_runtime`, `npm run scan:all`, `npm run finalize:change -- --summary "客户管理定金入口资金边界收口"`, `npm run check` including 120 Node tests after live runtime validation, standalone `npm test` with 120 Node tests after live runtime validation, and `git diff --check` after live runtime validation.

Runtime validation used test customer `customer_id=25`, `customer_code=KH202606000021`, marker `RT_DEPOSIT_BOUNDARY_20260625031150`. Omitted and explicit `CUSTOMER_DEPOSIT` deposit requests wrote `CUSTOMER_DEPOSIT / DEPOSIT_IN / CUSTOMER_DEPOSIT_BATCH`; forbidden `SAMPLE_REBATE` and `INVALID_ACCOUNT` deposit requests failed before balance, flow, or batch mutation; `/sample-rebate` created `sample_rebate_record` and then wrote `SAMPLE_REBATE_GENERATE`; `PUB_DIRECT_SALE` deposit was rejected without creating funds data. Captcha was restored to `true` in `sys_config` and Redis DB0/DB1, and `/captchaImage` returned `captchaEnabled=true`.

## Risks

- Test REAL customer `25 / KH202606000021` and its fund evidence remain in local development data for audit traceability.
- `CustomerServiceImpl.java` is an existing over-threshold service; this CR uses a scoped `weight-exception.md` because the fix must enforce the boundary at the service layer.
- Sales-order, delivery, finance settlement, automatic deduction, and order-level deposit behavior remain future modules.

## Next Actions

Run closeout gates again after this runtime evidence update. If they pass, commit and push only the current customer CR scope.
