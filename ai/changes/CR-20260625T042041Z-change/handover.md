# Handover

## Summary

客户管理资金并发安全收口. Current change record: `ai/changes/CR-20260625T042041Z-change`.

## Impact

This change extracts customer fund mutation from `CustomerServiceImpl` into `CustomerFundServiceImpl`, adds a mapper row-lock read for `customer_fund_account`, and adds bounded duplicate-key retry for fund-flow and deposit-batch number generation. External customer API paths and frontend API clients are unchanged. No SQL business table structure was changed.

## Changed Files

- `ruoyi-business/src/main/java/com/ruoyi/business/customer/service/ICustomerFundService.java`
- `ruoyi-business/src/main/java/com/ruoyi/business/customer/service/impl/CustomerFundServiceImpl.java`
- `ruoyi-business/src/main/java/com/ruoyi/business/customer/service/impl/CustomerServiceImpl.java`
- `ruoyi-business/src/main/java/com/ruoyi/business/customer/service/ICustomerService.java` remains compatible; no signature removal.
- `ruoyi-business/src/main/java/com/ruoyi/business/customer/mapper/CustomerMapper.java`
- `ruoyi-business/src/main/resources/mapper/customer/CustomerMapper.xml`
- `tests/customer-risk-gate.test.js`
- `features/customer.md`
- `ai/contracts/customer.api.md`
- `ai/contracts/customer.db.md`
- `ai/registry/features.json`
- `ai/context/current-context.json`
- `ai/context/current-context.md`
- `memory/API_CATALOG.md`
- `memory/HANDOVER.md`
- `memory/PROJECT_STATE.md`
- `memory/TASKS.json`
- `memory/CHANGELOG.md`
- `memory/sessions/2026-06-25-customer-fund-concurrency.md`
- `ai/changes/CR-20260625T042041Z-change/*`
- `ai/reviews/RV-20260625T042103Z-review/*`

## Commands

- `npm run resume`
- `npm run context:build -- customer`
- `npm run ai:do -- "功能迭代：客户管理"`
- `npm run impact -- 客户管理`
- `npm run review:feature -- "功能预审：客户管理资金并发安全收口" --feature customer`
- `node --test tests/customer-risk-gate.test.js`
- `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests compile`
- `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests package`
- Runtime API/DB validation on `http://127.0.0.1:18080`
- `npm run scan:all`
- `npm run finalize:change -- --summary "客户管理资金并发安全收口"`
- `npm run context:build -- customer`
- `npm run check` - passed with 121 Node tests.
- `npm test` - standalone passed with 121 Node tests.
- `git diff --check` - passed.

## Verification

Verification passed: review approval exists, targeted customer risk gate passed with 8 tests, Maven compile/package passed, live API/DB concurrency validation passed, `npm run scan:all` and `finalize:change` passed, current context was regenerated, full `npm run check` passed with 121 Node tests, standalone `npm test` passed with 121 Node tests, and `git diff --check` passed. Runtime validation proved the key concurrent case: 10 simultaneous one-yuan deposits created 10 flows and 10 batches, increased deposit balance/frozen by exactly `10.00`, left available unchanged, and produced no duplicate `flow_no` or `deposit_batch_no`.

## Risks

- Runtime validation retained test customer `26 / RT_FUND_CONCURRENCY_202606250432` and its fund evidence in local development data for audit traceability.
- This change fixes customer-level deposit entry concurrency only. Sales-order, delivery, finance settlement, automatic deduction, customer deposit deduction, refund, adjustment, and reversal remain future modules.
- No commit or push has been made; publishing still requires explicit user approval.

## Next Actions

- Review the diff and, if approved, commit with `fix(customer): make fund entries concurrency safe`.
