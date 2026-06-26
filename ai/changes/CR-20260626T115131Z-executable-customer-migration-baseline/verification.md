# Verification

Status: [local] passed so far

## Commands

- [local] `npm run resume`
- [local] `npm run impact -- 客户管理`
- [local] `npm run check:high-risk-governance`
- [local] `node --test tests/high-risk-governance.test.js`
- [local] `npm run scan:all`
- [local] `npm run context:build -- customer`
- [local] `npm test`
- [not-run] `mysql < sql/migrations/V20260625_001_customer_schema.sql`
- [not-run] `mysql < sql/migrations/V20260625_002_customer_seed_public_customer.sql`
- [not-run] `mysql < sql/migrations/V20260625_003_customer_menu_permission.sql`
- [not-run] `mysql < sql/validation/customer_runtime_validation.sql`
- [local] `npm run check`
- [local] `git diff --check`
- [local] `git diff -- ai/registry/features.json`
- [local] `git status --short`

## Evidence

- [local] `npm run resume` passed.
- [local] `npm run impact -- 客户管理` passed with no blockers.
- [local] `npm run check:high-risk-governance` passed. The previous current customer markdown baseline warning is gone because customer baseline registry entries now point to blocking executable SQL files.
- [local] `node --test tests/high-risk-governance.test.js` passed with 39/39 tests.
- [local] `npm run scan:all` passed.
- [local] `npm run context:build -- customer` passed.
- [local] `npm test` passed with 191/191 tests.
- [local] `npm run check` passed with 191/191 tests.
- [local] `git diff --check` passed.
- [local] `ai/registry/features.json` diff was reviewed after pre-commit scope audit. The diff only updates the `customer` feature ownership for R-06 executable migration baseline files, menu permission SQL ownership, and generated customer database ownership (`sys_menu` for the RuoYi menu seed). It does not add customer Java/Vue/API runtime ownership, sales-order or salesorder ownership, customer fund runtime ownership, idempotency registry ownership, `idempotent_request`, non-customer business table ownership, or old `LONG_TERM_DEPOSIT` / `ROLLING_ORDER_DEPOSIT` terms.
- [not-run] MySQL execution was not performed in this environment. SQL files were statically checked by governance tests only.
