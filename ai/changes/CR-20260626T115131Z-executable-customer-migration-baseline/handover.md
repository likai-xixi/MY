# Handover

## Summary

R-06 executable customer migration baseline is the current customer change.

## Impact

The customer schema, two PUBLIC seed rows, customer menu/permissions, and runtime validation SQL now have executable baseline files. `ai/registry/migration-registry.json` now uses blocking SQL entries instead of a current markdown-only customer baseline warning. Customer Java/Vue runtime, customer fund runtime logic, sales-order, security config, idempotency registry, `idempotent_request`, package scripts, tools, and non-customer business tables remain out of scope.

`ai/registry/features.json` is included in R-06 because `npm run scan:all` / ownership sync registered the new customer executable SQL baseline files, validation SQL, and customer menu permission SQL in the customer feature ownership.

## Changed Files

- `ai/changes/CR-20260626T115131Z-executable-customer-migration-baseline/*`
- `ai/changes/CURRENT_CHANGE.json`
- `ai/context/current-context.md`
- `ai/context/current-context.json`
- `ai/contracts/customer.db.md`
- `ai/generated/db-schema.json`
- `ai/registry/features.json`
- `ai/registry/migration-registry.json`
- `docs/customer-database-migration.md`
- `features/customer.md`
- `memory/CHANGELOG.md`
- `memory/HANDOVER.md`
- `memory/PROJECT_STATE.md`
- `memory/TASKS.json`
- `sql/customer.ownership.md`
- `sql/migrations/V20260625_001_customer_schema.sql`
- `sql/migrations/V20260625_002_customer_seed_public_customer.sql`
- `sql/migrations/V20260625_003_customer_menu_permission.sql`
- `sql/validation/customer_runtime_validation.sql`
- `tests/high-risk-governance.test.js`

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

## Verification

- [local] `npm run resume` passed.
- [local] `npm run impact -- 客户管理` passed with no blockers.
- [local] `npm run check:high-risk-governance` passed, and the current customer markdown baseline warning is gone because the registry now points at blocking executable SQL entries.
- [local] `node --test tests/high-risk-governance.test.js` passed with 39/39 tests.
- [local] `npm run scan:all` passed and refreshed customer DB ownership scan output.
- [local] `npm run context:build -- customer` passed.
- [local] `npm test` passed with 191/191 tests.
- [local] `npm run check` passed with 191/191 tests.
- [local] `git diff --check` passed.
- [not-run] MySQL execution of `sql/migrations/*.sql` and `sql/validation/customer_runtime_validation.sql` was not performed in this environment.

## Risks

- SQL was statically checked by governance and Node tests only; no disposable MySQL runtime execution was performed.
- The validation SQL is read-only and reports violation rows; it does not clean bad data by itself.

## Next Actions

- Next planned work is either R-07 customer fund idempotency or R-09 sales-order pre-implementation contract package.
