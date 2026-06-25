# Runtime Validation

Date: 2026-06-25

Scope: customer-management deposit account boundary tightening for
`CR-20260625T022150Z-change`.

## Environment

- Backend: `http://127.0.0.1:18080`
- Backend package: `ruoyi-admin/target/ruoyi-admin.jar`
- Runtime database: `my_ry_vue_runtime`
- MySQL container: `mj-mysql`
- Redis container: `mj-redis`
- Redis database used by backend: `1`
- Test marker: `RT_DEPOSIT_BOUNDARY_20260625031150`
- Test customer: `customer_id=25`, `customer_code=KH202606000021`,
  `customer_name=RT_DEPOSIT_BOUNDARY_20260625031150`

Docker Desktop was started from the local installation, then existing
containers `mj-mysql` and `mj-redis` were started. `docker exec mj-mysql
mysqladmin -uroot -ppassword ping` returned `mysqld is alive`, and
`docker exec mj-redis redis-cli -n 1 ping` returned `PONG`.

The backend was packaged with cached Maven and started with explicit runtime
overrides:

- `--server.port=18080`
- `--spring.datasource.druid.master.url=jdbc:mysql://localhost:3306/my_ry_vue_runtime?...`
- `--spring.datasource.druid.master.username=root`
- `--spring.datasource.druid.master.password=password`
- `--spring.data.redis.database=1`

`GET /captchaImage` returned HTTP 200 before validation with
`captchaEnabled=false`. Captcha was temporarily disabled in `sys_config` and
Redis DB0/DB1 to obtain an API token, then restored after validation.

## Preflight DB Checks

- `database()` returned `my_ry_vue_runtime`.
- Customer runtime tables existed: `customer`, `customer_fund_account`,
  `customer_fund_flow`, `customer_deposit_batch`, and
  `sample_rebate_record`.
- Active PUBLIC seed invariant passed:
  - `public_count=2`
  - `non_seed_public_count=0`
  - `duplicate_public_channel_count=0`
  - `customer_id=1`, `PUB_DIRECT_SALE`, `DIRECT_SALE`, `status=0`, `del_flag=0`
  - `customer_id=2`, `PUB_SELF_MEDIA`, `SELF_MEDIA`, `status=0`, `del_flag=0`

## API/DB Cases

### A. Deposit With Omitted `accountType`

- Request: `POST /business/customer/25/fund/deposit`
- Body: `amount=12.34`, `receiptNo=RT_DEPOSIT_BOUNDARY_20260625031150_A`
- Response: HTTP 200, body `code=200`, returned
  `accountType=CUSTOMER_DEPOSIT`, `flowType=DEPOSIT_IN`,
  `relatedBizType=CUSTOMER_DEPOSIT_BATCH`
- DB: `flow_id=4`, `account_type=CUSTOMER_DEPOSIT`,
  `flow_type=DEPOSIT_IN`, `related_biz_type=CUSTOMER_DEPOSIT_BATCH`,
  `amount=12.34`, `before_balance=0.00`, `after_balance=12.34`,
  `deposit_batch_id=4`, `deposit_type=CUSTOMER_DEPOSIT`,
  `deposit_amount=12.34`

Result: passed.

### B. Deposit With Explicit `CUSTOMER_DEPOSIT`

- Request: `POST /business/customer/25/fund/deposit`
- Body: `accountType=CUSTOMER_DEPOSIT`, `amount=23.45`,
  `receiptNo=RT_DEPOSIT_BOUNDARY_20260625031150_B`
- Response: HTTP 200, body `code=200`, returned
  `accountType=CUSTOMER_DEPOSIT`, `flowType=DEPOSIT_IN`,
  `relatedBizType=CUSTOMER_DEPOSIT_BATCH`
- DB: `flow_id=5`, `account_type=CUSTOMER_DEPOSIT`,
  `flow_type=DEPOSIT_IN`, `related_biz_type=CUSTOMER_DEPOSIT_BATCH`,
  `amount=23.45`, `before_balance=12.34`, `after_balance=35.79`,
  `deposit_batch_id=5`, `deposit_type=CUSTOMER_DEPOSIT`,
  `deposit_amount=23.45`

Result: passed.

### C. Deposit With Forbidden `SAMPLE_REBATE`

- Request: `POST /business/customer/25/fund/deposit`
- Body: `accountType=SAMPLE_REBATE`, `amount=34.56`
- Response: HTTP 200, body `code=500`, message
  `定金录入接口只允许写入CUSTOMER_DEPOSIT账户，样品返现请通过样品返现入口处理。`
- Before DB: `CUSTOMER_DEPOSIT balance=35.79`, `SAMPLE_REBATE balance=0.00`,
  `flow_count=2`, `batch_count=2`, `rebate_count=0`
- After DB: `CUSTOMER_DEPOSIT balance=35.79`, `SAMPLE_REBATE balance=0.00`,
  `flow_count=2`, `batch_count=2`, `rebate_count=0`

Result: passed. Rejection happened before account balance, deposit batch, or
fund flow mutation.

### D. Deposit With Other Invalid `accountType`

- Request: `POST /business/customer/25/fund/deposit`
- Body: `accountType=INVALID_ACCOUNT`, `amount=45.67`
- Response: HTTP 200, body `code=500`, message
  `定金录入接口只允许写入CUSTOMER_DEPOSIT账户，样品返现请通过样品返现入口处理。`
- Before DB: `CUSTOMER_DEPOSIT balance=35.79`, `SAMPLE_REBATE balance=0.00`,
  `flow_count=2`, `batch_count=2`, `rebate_count=0`
- After DB: `CUSTOMER_DEPOSIT balance=35.79`, `SAMPLE_REBATE balance=0.00`,
  `flow_count=2`, `batch_count=2`, `rebate_count=0`

Result: passed. Rejection happened before account balance, deposit batch, or
fund flow mutation.

### E. Sample Rebate

- Request: `POST /business/customer/25/sample-rebate`
- Body: `sampleOrderNo=RT_DEPOSIT_BOUNDARY_20260625031150_SAMPLE`,
  `sampleAmount=100.00`, `totalSupportRate=0.2000`,
  `instantDiscountAmount=0.00`
- Response: HTTP 200, body `code=200`, returned `rebateRecordId=1`,
  `rebateAmount=20.00`
- DB: `sample_rebate_record.rebate_record_id=1`,
  `sample_order_no=RT_DEPOSIT_BOUNDARY_20260625031150_SAMPLE`,
  `sample_amount=100.00`, `rebate_amount=20.00`,
  `customer_fund_flow.flow_id=6`, `account_type=SAMPLE_REBATE`,
  `flow_type=SAMPLE_REBATE_GENERATE`, `related_biz_type=SAMPLE_REBATE`,
  `related_biz_id=1`, `flow_amount=20.00`
- Deposit batch count stayed `2`

Result: passed. `/sample-rebate` created `sample_rebate_record` and then wrote
the internal `SAMPLE_REBATE_GENERATE` fund flow without creating a
`customer_deposit_batch`.

### F. PUBLIC Customer Deposit Rejection

- Request: `POST /business/customer/1/fund/deposit`
- Target: `PUB_DIRECT_SALE`
- Body: `amount=5.55`
- Response: HTTP 200, body `code=500`, message
  `公共客户不启用客户级定金，请在销售订单中记录本单定金。`
- Before DB for `customer_id=1`: no customer fund accounts, `flow_count=0`,
  `batch_count=0`, `rebate_count=0`
- After DB for `customer_id=1`: no customer fund accounts, `flow_count=0`,
  `batch_count=0`, `rebate_count=0`

Result: passed. PUBLIC customer rejection did not create fund account, fund
flow, deposit batch, or sample rebate rows.

## Final DB State For Test Customer

For `customer_id=25`:

- `CUSTOMER_DEPOSIT balance=35.79`, `available=0.00`, `frozen=35.79`
- `SAMPLE_REBATE balance=20.00`, `available=20.00`, `frozen=0.00`
- `flow_count=3`
- `batch_count=2`
- `rebate_count=1`

Fund flows:

- `flow_id=4`, `CUSTOMER_DEPOSIT`, `DEPOSIT_IN`,
  `CUSTOMER_DEPOSIT_BATCH`, `amount=12.34`
- `flow_id=5`, `CUSTOMER_DEPOSIT`, `DEPOSIT_IN`,
  `CUSTOMER_DEPOSIT_BATCH`, `amount=23.45`
- `flow_id=6`, `SAMPLE_REBATE`, `SAMPLE_REBATE_GENERATE`,
  `SAMPLE_REBATE`, `amount=20.00`

Deposit batches:

- `deposit_batch_id=4`, `deposit_type=CUSTOMER_DEPOSIT`, `amount=12.34`,
  `receipt_no=RT_DEPOSIT_BOUNDARY_20260625031150_A`
- `deposit_batch_id=5`, `deposit_type=CUSTOMER_DEPOSIT`, `amount=23.45`,
  `receipt_no=RT_DEPOSIT_BOUNDARY_20260625031150_B`

Sample rebate records:

- `rebate_record_id=1`,
  `sample_order_no=RT_DEPOSIT_BOUNDARY_20260625031150_SAMPLE`,
  `sample_amount=100.00`, `rebate_amount=20.00`

## Captcha And Runtime Restore

After validation:

- `sys_config.config_key=sys.account.captchaEnabled` restored to `true`
- Redis DB0 `sys_config:sys.account.captchaEnabled` restored to `true`
- Redis DB1 `sys_config:sys.account.captchaEnabled` restored to `true`
- `GET /captchaImage` returned HTTP 200 with `captchaEnabled=true`

The temporary backend validation process was stopped after evidence capture.
MySQL and Redis containers were left running. The test REAL customer and its
fund evidence were intentionally retained in local development data for audit
traceability.

## Result

Live API/DB validation passed for all required cases. No sales-order
implementation, governance-rule change, or SQL business table structure change
was made.
