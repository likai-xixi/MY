# Plan

Mode: `update`
Feature: `customer`

## Scope

Implement the second customer-management fund safety batch: extract `CustomerFundService`, make customer fund entries row-lock safe, and add bounded retry for fund/deposit number unique-key collisions.

## Steps

1. Confirm clean worktree and `origin/master=166c3ee48d558bff7ccb81eec576803e3c9fa31d`.
2. Run `npm run resume`, `npm run context:build -- customer`, `npm run ai:do -- "功能迭代：客户管理"`, and `npm run impact -- 客户管理`.
3. Run `npm run review:feature -- "功能预审：客户管理资金并发安全收口" --feature customer`, fill the review record, and proceed only after `decision.md` contains `Allow Implementation`.
4. Add `ICustomerFundService` and `CustomerFundServiceImpl`.
5. Delegate fund mutation from `CustomerServiceImpl` to the injected fund service, keeping controller API paths unchanged.
6. Add `CustomerMapper.selectFundAccountForUpdate(customerId, accountType)` and mapper XML SQL with `limit 1 for update`.
7. Move balance calculation after the locked account read.
8. Handle concurrent first account creation with `DuplicateKeyException` and locked re-read.
9. Add bounded retry for `insertFundFlow` and `insertDepositBatch` unique-key collisions.
10. Update customer risk static tests, customer contracts, feature brief, registry, API catalog, memory, session note, and current context.
11. Run Maven compile/package, targeted Node test, live API/DB validation if runtime starts, `npm run scan:all`, `npm run finalize:change`, `npm run check`, `npm test`, and `git diff --check`.

## Non-Goals

- No sales-order implementation.
- No delivery, finance, deduction, refund, adjustment, or reversal implementation.
- No SQL business table structure change.
- No frontend screen/API-client path change.
- No governance-rule loosening.
