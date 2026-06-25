# Frontend Review

No runtime frontend implementation is required for this concurrency-safety slice.

## Contract Impact

- `ruoyi-ui/src/api/customer.js` keeps the same customer fund API paths and methods.
- `POST /business/customer/{customerId}/fund/deposit` continues accepting omitted `accountType` and omitted `flowType`.
- Existing customer detail fund views should continue reading the same account, flow, and deposit-batch endpoints.

## UI Scope

- No new screen.
- No shared or module-local component.
- No sales-order UI.
- No direct Vue or customer API client change unless later verification discovers a contract documentation mismatch.
