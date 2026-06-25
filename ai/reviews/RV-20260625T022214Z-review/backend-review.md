# Backend Review

## Required Backend Change

- `CustomerController.fundDeposit` must call a deposit-only service method.
- The deposit-only service method must reject non-`CUSTOMER_DEPOSIT` account types before the generic fund-entry transaction runs.
- The generic fund-entry transaction may still normalize and accept `SAMPLE_REBATE` for internal sample rebate generation.

## Data Integrity

- Rejection happens before `ensureFundAccount`, `updateFundAccountBalance`, `insertDepositBatch`, or `insertFundFlow`.
- Default omitted `accountType` is stamped as `CUSTOMER_DEPOSIT`.
- Explicit `CUSTOMER_DEPOSIT` remains valid.
- `SAMPLE_REBATE` and arbitrary account values fail with a service error.

## Tests

- Add static tests around controller routing, service wrapper order, mutation absence before rejection, and internal sample rebate path.
