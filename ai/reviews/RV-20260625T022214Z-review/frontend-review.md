# Frontend Review

No runtime frontend code change is required.

## Contract Impact

- `addFundDeposit(customerId, data)` may continue omitting `accountType`; backend defaults it to `CUSTOMER_DEPOSIT`.
- If any caller sends `SAMPLE_REBATE` or another non-`CUSTOMER_DEPOSIT` value, the backend rejects it.
- Sample rebate remains on the existing `createSampleRebate` API.

## UI Scope

- No new screen.
- No component change.
- No sales-order UI.
