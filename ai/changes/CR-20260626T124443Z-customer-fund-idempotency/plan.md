# Plan

Mode: `update`
Feature: `customer`

1. Keep edits inside the R-07 impact scope: customer deposit/sample-rebate idempotency, platform `idempotent_request` support, registries, contracts, tests, generated scans, and memory.
2. Add `idempotentKey` to the customer fund deposit and sample rebate request payloads.
3. Add platform-level idempotency domain, mapper, XML, and service support for `PROCESSING`, `SUCCESS`, and `FAILED`.
4. Store first requests as `PROCESSING`, mark successful business mutations as `SUCCESS` with result references, replay same-key/same-hash successes, reject same-key/different-hash conflicts, and reject still-processing requests.
5. Keep fund behavior bounded to `CUSTOMER_DEPOSIT / DEPOSIT_IN` and `SAMPLE_REBATE / SAMPLE_REBATE_GENERATE`.
6. Update idempotency and migration registries, contracts, customer brief, generated scans, handoff memory, and focused tests.
7. Run the required local gates and record MySQL runtime execution as run or not-run.

## Summary

客户资金高风险入口幂等收口。
