# Request

R-07 customer fund idempotency.

Add request idempotency to the high-risk customer fund entry points only:

- `POST /business/customer/{customerId}/fund/deposit`
- `POST /business/customer/{customerId}/sample-rebate`

Create the platform-level `idempotent_request` migration and service support for `PROCESSING`, `SUCCESS`, and `FAILED`. Keep the change out of sales-order runtime, production safety config, package/tools, the old three-account fund model, and deduction/refund/adjust/reversal runtime.
