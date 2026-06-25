# Decision

Decision: Allow Implementation

Reason: The requested change is a narrow customer-management concurrency-safety and service-extraction slice. Implementation may proceed only inside the current customer change record and only for `CustomerFundService` extraction, fund-account row locking, duplicate-key retry for account/flow/deposit-batch creation, static tests, customer contracts/docs, registry/context/memory, generated scans, and CR evidence.

Constraints:

- Keep existing external customer API paths unchanged.
- Keep `/fund/deposit` deposit-only: omitted or explicit `CUSTOMER_DEPOSIT`; omitted or explicit `DEPOSIT_IN`; reject `SAMPLE_REBATE` and deduction/refund/adjust/reversal flow types.
- Keep `/sample-rebate` internal: create `sample_rebate_record` before writing `SAMPLE_REBATE_GENERATE`; do not create a deposit batch.
- Do not implement sales-order, delivery, finance, deduction, refund, adjustment, or reversal behavior.
- Do not change SQL business table structure or add `customer.deposit_balance`.
- Do not change governance rules or lower gates.

Required evidence:

- Static customer risk gate coverage for the fund service extraction, `for update` mapper, transaction boundary, duplicate account-create handling, and duplicate-key retry.
- Maven compile for Java/XML changes.
- Updated customer feature/API/DB contracts, registry/context/memory, and current CR files.
- `npm run scan:all`
- `npm run finalize:change -- --summary "客户管理资金并发安全收口"`
- `npm run check`
- `npm test`
- `git diff --check`
- Runtime API/DB concurrency validation when local backend/MySQL/Redis are available, or an explicit handover note that live concurrency validation was not completed.
