# Architecture Review

## Boundary

- `CustomerController` keeps the same external route contract and continues calling `ICustomerService`.
- `CustomerServiceImpl` remains the customer master service and delegates fund mutations to the injected `ICustomerFundService`; this preserves controller compatibility while avoiding self-invocation transaction loss.
- `CustomerFundServiceImpl` owns the transactional fund-entry path and is the only place where row locking, balance math, deposit-batch insertion, fund-flow insertion, and duplicate-key retry should live.
- `CustomerMapper` and `CustomerMapper.xml` remain the mapper boundary; the new row-lock query belongs beside the existing fund account query.

## Transaction Design

- Public fund-entry methods on `CustomerFundServiceImpl` must be `@Transactional`.
- `selectFundAccountForUpdate` must run inside that service transaction before balance math.
- Missing fund accounts must be created optimistically, then re-selected with `for update`; `DuplicateKeyException` must trigger a re-select with the row lock.
- `CustomerServiceImpl` must not call a transactional method on itself for this fund path.

## Contract Stability

- External paths remain unchanged: deposit, fund account/flow/batch reads, sample policy, sample rebate create/list.
- `/fund/deposit` keeps omitted or explicit `CUSTOMER_DEPOSIT` account type and omitted or explicit `DEPOSIT_IN` flow type.
- `/fund/deposit` still rejects `SAMPLE_REBATE` and other non-deposit accounts, plus deduction/refund/adjust/reversal flow types.
- `/sample-rebate` creates `sample_rebate_record` before writing an internal `SAMPLE_REBATE_GENERATE` fund flow and must not create a deposit batch.

## Scope Guard

- Implementation is limited to the current customer change allowed roots.
- Controller changes are avoided unless compile requires a minimal compatibility adjustment.
- Sales-order, delivery, finance, SQL structure, and governance scanner/rule changes are out of scope.
