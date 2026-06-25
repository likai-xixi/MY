# Architecture Review

## Boundary

- `CustomerController.fundDeposit` is the external API boundary for customer deposit entry.
- `CustomerServiceImpl.recordFundEntry` is the shared internal fund-entry transaction used by both customer deposit and sample rebate.
- The safe architecture is a deposit-only service wrapper between the controller and the shared transaction.

## Decision

- Add `ICustomerService.recordCustomerDeposit(...)`.
- Route `/fund/deposit` through `recordCustomerDeposit(...)`.
- Keep `recordFundEntry(...)` capable of `SAMPLE_REBATE` so `createSampleRebateRecord(...)` can create the sample rebate record and then write the internal `SAMPLE_REBATE_GENERATE` flow.

## Scope Guard

- Allowed paths stay under customer backend/controller/contracts/docs/tests/memory/CR artifacts.
- No sales-order, governance script, scanner, or SQL business table change is required.
