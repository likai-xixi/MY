# Product Review

Request: close the second customer-management fund safety batch: make customer fund entries concurrency safe and extract only `CustomerFundService`.

## User Value

- Finance and operations can keep using the existing customer deposit entry API without path or payload drift.
- Concurrent customer deposit entries must not lose balance updates when they hit the same `customer_fund_account`.
- Fund serial-number collisions must fail safely through bounded insert retry, not by leaving partial or duplicate evidence.
- Sample rebate remains auditable because it still starts from `sample_rebate_record` and then writes the internal sample-rebate fund flow.

## Scope

- Add `ICustomerFundService` and `CustomerFundServiceImpl`.
- Move customer deposit entry, internal fund entry, fund-account ensure/lock, balance update, fund-flow insert, deposit-batch insert, sample-rebate fund-flow creation, and fund/deposit number retry into the new fund service.
- Keep `CustomerServiceImpl` as the customer master/contact/address/owner/public-customer service and delegate fund mutations to the injected fund service.
- Add `selectFundAccountForUpdate(customerId, accountType)` using `for update`.
- Preserve all existing customer external API routes and response shape.

## Non-Goals

- No sales-order implementation.
- No delivery, finance settlement, receipt claiming, reconciliation, automatic deduction, customer deposit deduction, refund, adjustment, or reversal implementation.
- No SQL business table structure change and no new `customer.deposit_balance`.
- No frontend screen or API-client behavior change unless contract text needs clarification.
- No governance-rule loosening.

## Success Criteria

- Static tests prove the fund service files exist and `CustomerServiceImpl` delegates fund mutation.
- Static tests prove row-lock SQL exists and the public entry method is transactional.
- Static tests prove duplicate account creation and fund/deposit number collisions are retried safely.
- Maven compile, governance checks, and Node tests pass, with runtime API/DB concurrency validation recorded if the local stack is available.
