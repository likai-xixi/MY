# Session: Customer Fund Concurrency Safety

## Task

`TASK-0003` / `TASK-CUSTOMER` - Implement `CR-20260625T042041Z-change` for customer fund concurrency safety and `CustomerFundService` extraction.

## Status

`in_progress` - Implementation, review approval, targeted static tests, Maven compile/package, live API/DB validation, generated scans, `finalize:change`, regenerated current context, full `npm run check`, standalone `npm test`, and `git diff --check` have passed. Awaiting user review/commit approval; no commit or push has been made.

## Goal

- Extract customer fund mutation from `CustomerServiceImpl` into `CustomerFundServiceImpl`.
- Keep existing external customer API paths and business口径 unchanged.
- Add `selectFundAccountForUpdate(customerId, accountType)` and calculate balances only after the locked account read.
- Handle concurrent first account creation through `DuplicateKeyException` and locked re-read.
- Retry `flow_no` and `deposit_batch_no` unique-key collisions with bounded insert retry.
- Do not implement sales-order, delivery, finance, deduction, refund, adjustment, or reversal behavior.

## Changed Files

- `ruoyi-business/src/main/java/com/ruoyi/business/customer/service/ICustomerFundService.java`
- `ruoyi-business/src/main/java/com/ruoyi/business/customer/service/impl/CustomerFundServiceImpl.java`
- `ruoyi-business/src/main/java/com/ruoyi/business/customer/service/impl/CustomerServiceImpl.java`
- `ruoyi-business/src/main/java/com/ruoyi/business/customer/mapper/CustomerMapper.java`
- `ruoyi-business/src/main/resources/mapper/customer/CustomerMapper.xml`
- `tests/customer-risk-gate.test.js`
- `features/customer.md`
- `ai/contracts/customer.api.md`
- `ai/contracts/customer.db.md`
- `ai/registry/features.json`
- `memory/API_CATALOG.md`
- `memory/HANDOVER.md`
- `memory/PROJECT_STATE.md`
- `memory/TASKS.json`
- `memory/CHANGELOG.md`
- `ai/changes/CR-20260625T042041Z-change/*`
- `ai/reviews/RV-20260625T042103Z-review/*`

## Commands

- `git rev-parse origin/master`
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
- `npm run check`
- `npm test`
- `git diff --check`

## Verification

- `ai/reviews/RV-20260625T042103Z-review/decision.md` contains `Allow Implementation`.
- `node --test tests/customer-risk-gate.test.js` passed with 8 tests.
- Cached Maven compile passed.
- Cached Maven package passed.
- Live API/DB validation passed on backend `http://127.0.0.1:18080`, database `my_ry_vue_runtime`, Redis DB1.
- Runtime marker: `RT_FUND_CONCURRENCY_20260625043231`.
- Runtime test customer: `customer_id=26`, `customer_code=RT_FUND_CONCURRENCY_202606250432`.
- Concurrent 10 x `1.00` deposits succeeded with final `CUSTOMER_DEPOSIT.balance_amount=13.57`, `frozen_amount=13.57`, `available_amount=0`, `flow_count=13`, `batch_count=12`, no duplicate `flow_no`, and no duplicate `deposit_batch_no`.
- `npm run scan:all` passed.
- `npm run finalize:change -- --summary "客户管理资金并发安全收口"` passed.
- First final `npm run check` reached `check:memory-quality` and failed on this session note/handover evidence formatting, so the runtime code path was not the blocker.
- Final `npm run check` passed with 121 Node tests after correcting evidence formatting, changed-file manifest, exact review/context impact roots, runtime evidence newline, and current context.
- Standalone `npm test` passed with 121 Node tests.
- `git diff --check` passed.

## Risks

- Runtime validation retained test customer `26 / RT_FUND_CONCURRENCY_202606250432` in local development data for audit traceability.
- Sales-order, delivery, finance, deduction, refund, adjustment, and reversal behavior remain out of scope.
- No commit or push has been made; publishing still requires explicit user approval.

## Next Entry Point

Review the diff and `ai/changes/CR-20260625T042041Z-change/verification.md`. Suggested commit message is `fix(customer): make fund entries concurrency safe`. Do not add sales-order, delivery, finance, deduction, refund, adjustment, reversal, governance-rule, or SQL business table structure changes to this customer fund concurrency CR.
