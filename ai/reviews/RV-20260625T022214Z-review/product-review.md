# Product Review

Request: close the customer fund-entry safety gap for `POST /business/customer/{customerId}/fund/deposit`.

## User Value

- Sales users can still record customer deposits through the existing deposit endpoint.
- Finance data stays separated: deposit entry cannot be abused to write sample rebate balance.
- Sample rebate keeps its own business trace because it must start from a `sample_rebate_record`.

## Scope

- Accept omitted `accountType` and explicit `CUSTOMER_DEPOSIT` on `/fund/deposit`.
- Reject `SAMPLE_REBATE` and any other non-`CUSTOMER_DEPOSIT` account type before balance, batch, or flow mutation.
- Preserve sample rebate creation through `/sample-rebate`.

## Non-Goals

- No sales-order development.
- No database table or SQL ownership change.
- No governance rule change.
- No frontend redesign.

## Success Criteria

- Static tests prove the external controller no longer calls the generic fund-entry path directly.
- Static tests prove rejected account types fail before account, batch, or flow mutation can run.
- Documentation and API contracts record the customer deposit/sample rebate boundary.
