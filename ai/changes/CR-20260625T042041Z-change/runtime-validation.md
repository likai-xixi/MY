# Runtime Validation

Date: 2026-06-25

Scope: `CR-20260625T042041Z-change` customer fund concurrency safety and `CustomerFundService` extraction.

## Environment

- Backend: `http://127.0.0.1:18080`
- Backend package: `ruoyi-admin/target/ruoyi-admin.jar`
- Runtime database: `my_ry_vue_runtime`
- MySQL container: `mj-mysql`
- Redis container: `mj-redis`
- Redis database used by backend: `1`
- Test marker: `RT_FUND_CONCURRENCY_20260625043231`
- Test customer: `customer_id=26`, `customer_code=RT_FUND_CONCURRENCY_202606250432`

The backend was packaged with cached Maven, started from `ruoyi-admin/target/ruoyi-admin.jar` on port `18080`, and pointed at `my_ry_vue_runtime` plus Redis DB1. `GET /captchaImage` returned HTTP 200 before API validation. Captcha was temporarily disabled in `sys_config` and Redis DB0/DB1 to obtain an API token, then restored to `true` in MySQL and both Redis DB0/DB1. The backend process started for validation was stopped after evidence capture.

Full machine-readable evidence: `ai/changes/CR-20260625T042041Z-change/runtime-evidence/api-db-validation.json`.

## API/DB Cases

### Omitted `accountType` Deposit

- Request: `POST /business/customer/26/fund/deposit`
- Body: `amount=1.23`, `receiptNo=RT_FUND_CONCURRENCY_20260625043231_OMITTED`
- Result: passed. Response `code=200`, `accountType=CUSTOMER_DEPOSIT`, `flowType=DEPOSIT_IN`.
- DB moved from no fund rows to `CUSTOMER_DEPOSIT balance=1.23`, `frozen=1.23`, `available=0`, `flow_count=1`, `batch_count=1`.

### Explicit `CUSTOMER_DEPOSIT` Deposit

- Request: `POST /business/customer/26/fund/deposit`
- Body: `accountType=CUSTOMER_DEPOSIT`, `amount=2.34`, `receiptNo=RT_FUND_CONCURRENCY_20260625043231_EXPLICIT`
- Result: passed. Response `code=200`, `accountType=CUSTOMER_DEPOSIT`, `flowType=DEPOSIT_IN`.
- DB moved to `CUSTOMER_DEPOSIT balance=3.57`, `frozen=3.57`, `available=0`, `flow_count=2`, `batch_count=2`.

### Forbidden `SAMPLE_REBATE` Through Deposit Endpoint

- Request: `POST /business/customer/26/fund/deposit`
- Body: `accountType=SAMPLE_REBATE`, `amount=3.45`
- Result: passed. Response `code=500` with `定金录入接口只允许写入CUSTOMER_DEPOSIT账户，样品返现请通过样品返现入口处理。`
- DB state stayed unchanged: `CUSTOMER_DEPOSIT balance=3.57`, `flow_count=2`, `batch_count=2`, `rebate_count=0`.

### Invalid `accountType`

- Request: `POST /business/customer/26/fund/deposit`
- Body: `accountType=INVALID_ACCOUNT`, `amount=4.56`
- Result: passed. Response `code=500` with the same deposit-account-only message.
- DB state stayed unchanged: `CUSTOMER_DEPOSIT balance=3.57`, `flow_count=2`, `batch_count=2`, `rebate_count=0`.

### Sample Rebate

- Request: `POST /business/customer/26/sample-rebate`
- Body: `sampleOrderNo=RT_FUND_CONCURRENCY_20260625043231_SAMPLE`, `sampleAmount=100.00`, `totalSupportRate=0.2`, `instantDiscountAmount=0.00`
- Result: passed. Response `code=200`, `rebateAmount=20.00`.
- DB created one `sample_rebate_record`, then one `SAMPLE_REBATE_GENERATE` fund flow. `customer_deposit_batch` count stayed at `2`.

### PUBLIC Customer Deposit Rejection

- Request: `POST /business/customer/1/fund/deposit`
- Target: `PUB_DIRECT_SALE`
- Body: `amount=5.67`
- Result: passed. Response `code=500` with `公共客户不启用客户级定金，请在销售订单中记录本单定金。`
- PUBLIC customer fund state stayed unchanged: no fund accounts, flows, batches, or rebates.

### Concurrent Deposits

- Request: 10 concurrent `POST /business/customer/26/fund/deposit` calls.
- Body per request: `amount=1.00`, unique `receiptNo=RT_FUND_CONCURRENCY_20260625043231_CONC_<n>`.
- Result: passed.
- Before: `CUSTOMER_DEPOSIT balance=3.57`, `frozen=3.57`, `available=0`, `flow_count=3`, `batch_count=2`.
- After: `CUSTOMER_DEPOSIT balance=13.57`, `frozen=13.57`, `available=0`, `flow_count=13`, `batch_count=12`.
- Concurrent marker evidence: `concurrentFlowCount=10`, `concurrentBatchCount=10`.
- Duplicate checks: `flowTotal=13`, `distinctFlowNo=13`, `batchTotal=12`, `distinctDepositBatchNo=12`.

## Restore

- MySQL `sys.account.captchaEnabled`: `true`
- Redis DB0 `sys_config:sys.account.captchaEnabled`: `true`
- Redis DB1 `sys_config:sys.account.captchaEnabled`: `true`
- The backend validation process was stopped after evidence capture. A post-restore `/captchaImage` HTTP check raced with the backend shutdown, so this file only claims the DB/Redis restore values above.

## Result

Live API/DB validation passed for omitted and explicit customer deposit, rejected `SAMPLE_REBATE` and invalid account types without mutation, sample rebate record-before-flow behavior, PUBLIC rejection without mutation, and 10 concurrent one-yuan deposits without lost update or duplicate fund/deposit numbers.

No sales-order, delivery, finance, deduction, refund, adjustment, reversal, governance-rule, or SQL business table structure change was made.
