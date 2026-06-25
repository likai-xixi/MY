# Verification

Status: passed

## Commands

- `npm run resume` - passed.
- `npm run context:build -- customer` - passed.
- `npm run ai:do -- "功能迭代：客户管理"` - passed and created `CR-20260625T022150Z-change`.
- `npm run review:feature -- "功能预审：客户管理定金入口资金边界收口" --feature customer` - passed and created `RV-20260625T022214Z-review`.
- `node --test tests/customer-risk-gate.test.js` - passed with 7 tests.
- `node --test tests/governance-sales-order-handoff-gate.test.js` - passed with 16 tests.
- `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests compile` - passed with reactor `BUILD SUCCESS`.
- `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests package` - passed and produced `ruoyi-admin/target/ruoyi-admin.jar`.
- Docker Desktop was started, then existing containers `mj-mysql` and `mj-redis` were started; MySQL ping and Redis DB1 ping passed.
- Live API/DB validation against backend `http://127.0.0.1:18080`, database `my_ry_vue_runtime`, and Redis DB1 passed. See `runtime-validation.md`.
- `npm run scan:all` - passed.
- `npm run finalize:change -- --summary "客户管理定金入口资金边界收口"` - passed.
- `npm run check` - passed after live runtime validation, including 120 Node tests.
- `npm test` - passed after live runtime validation with 120 Node tests.
- `git diff --check` - passed after live runtime validation.

## Evidence

- External `/business/customer/{customerId}/fund/deposit` calls `recordCustomerDeposit(...)` instead of the generic `recordFundEntry(...)`.
- `recordCustomerDeposit(...)` accepts omitted `accountType`, accepts explicit `CUSTOMER_DEPOSIT`, stamps `CUSTOMER_DEPOSIT`, and rejects `SAMPLE_REBATE` or any other non-`CUSTOMER_DEPOSIT` value before calling the shared fund-entry mutation path.
- The internal sample rebate path still creates `sample_rebate_record`, sets `SAMPLE_REBATE` and `SAMPLE_REBATE_GENERATE`, and then calls the shared `recordFundEntry(...)` path.
- Runtime validation used test customer `customer_id=25`, `customer_code=KH202606000021`, marker `RT_DEPOSIT_BOUNDARY_20260625031150`.
- `/fund/deposit` with omitted `accountType` wrote `CUSTOMER_DEPOSIT / DEPOSIT_IN / CUSTOMER_DEPOSIT_BATCH`, and `customer_deposit_batch.deposit_type=CUSTOMER_DEPOSIT`.
- `/fund/deposit` with `accountType=CUSTOMER_DEPOSIT` wrote the same DB shape.
- `/fund/deposit` with `accountType=SAMPLE_REBATE` failed with body `code=500` before balances, fund flows, or deposit batches changed.
- `/fund/deposit` with `accountType=INVALID_ACCOUNT` failed with body `code=500` before balances, fund flows, or deposit batches changed.
- `/sample-rebate` created `sample_rebate_record.rebate_record_id=1`, then wrote `customer_fund_flow.account_type=SAMPLE_REBATE` and `flow_type=SAMPLE_REBATE_GENERATE`, without creating a deposit batch.
- `PUB_DIRECT_SALE` deposit was rejected and did not create fund account, fund flow, deposit batch, or sample rebate rows.
- Active PUBLIC seed invariant passed before runtime validation: only `PUB_DIRECT_SALE` and `PUB_SELF_MEDIA` active PUBLIC rows existed.
- Captcha was restored after runtime validation: `sys_config` value `true`, Redis DB0/DB1 cache value `true`, and `/captchaImage` returned `captchaEnabled=true`.
- `tests/customer-risk-gate.test.js` covers default deposit account behavior, explicit `CUSTOMER_DEPOSIT`, rejection of `SAMPLE_REBATE`, rejection of other account types, rejection before account/batch/flow mutation, and preservation of the internal sample rebate fund flow.
- `check:review` passed with `Allow Implementation` in `RV-20260625T022214Z-review`.
- `check:file-weight` passed with the scoped `weight-exception.md` for the existing over-threshold `CustomerServiceImpl.java`.
- No sales-order code, governance-rule change, SQL business table structure change, commit, or push was performed at the time of this evidence update.

## Residual Risk

- Test REAL customer `25 / KH202606000021` and its fund evidence remain in local development data for audit traceability.
