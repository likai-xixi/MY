# Decision

Decision: Allow Implementation

Reason: The requested change is a narrow customer-management security boundary fix. Implementation may proceed only inside the current customer change record and only for the `/fund/deposit` account-type guard, related static tests, customer contracts/docs, memory, and CR evidence.

Constraints:

- Do not develop sales-order.
- Do not change governance rules or lower gates.
- Do not change SQL business table structure.
- Preserve internal sample rebate capability through `/sample-rebate` and `sample_rebate_record`.

Required evidence:

- Static tests covering deposit-only account guard and internal sample rebate path.
- Updated customer API contract/catalog/feature docs.
- `npm run scan:all`
- `npm run finalize:change -- --summary "客户管理定金入口资金边界收口"`
- `npm run check`
- `npm test`
- `git diff --check`
