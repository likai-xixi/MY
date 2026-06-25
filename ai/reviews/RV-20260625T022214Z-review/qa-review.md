# QA Review

## Verification Plan

- `npm run scan:all`
- `npm run finalize:change -- --summary "客户管理定金入口资金边界收口"`
- `npm run check`
- `npm test`
- `git diff --check`

## Coverage Expectations

- `/fund/deposit` default path writes `CUSTOMER_DEPOSIT`.
- `/fund/deposit` explicit `CUSTOMER_DEPOSIT` is accepted.
- `/fund/deposit` `SAMPLE_REBATE` is rejected.
- `/fund/deposit` other `accountType` values are rejected.
- Rejection occurs before account balance, deposit batch, or fund flow mutation.
- Internal sample rebate path still creates `sample_rebate_record` before writing `SAMPLE_REBATE_GENERATE`.

## Residual Risk

- The repository governance test style is static. Runtime database transaction behavior should be validated later in an integrated backend test suite when one exists.
