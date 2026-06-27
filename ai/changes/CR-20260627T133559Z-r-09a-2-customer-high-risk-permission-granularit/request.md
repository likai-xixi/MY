# Request

R-09A.2 customer high-risk permission granularity

## User Scope

Fix customer-fund high-risk API permission granularity. Split permissions only:

- `POST /business/customer/{customerId}/fund/deposit` must use `business:customer:fund:deposit`.
- `POST /business/customer/{customerId}/sample-rebate` must use `business:customer:sample-rebate:create`.
- Frontend operation buttons, SQL menu permission seed, `features.json`, `high-risk-permission-coverage.json`, and `tests/customer-risk-gate.test.js` must stay aligned.

## Non-Goals

- Do not change customer fund calculation, idempotency, fund-flow, deposit-batch, or sample-rebate calculation logic.
- Do not change `CUSTOMER_DEPOSIT` or `SAMPLE_REBATE` semantics.
- Do not create sales-order runtime artifacts.
- Do not loosen `beforeSalesOrder`.
