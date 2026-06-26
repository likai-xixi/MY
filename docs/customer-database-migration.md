# Customer Database Migration

## R-06 Executable Baseline

R-06 moves the customer database baseline from markdown-only ownership documentation to executable SQL files. `sql/customer.ownership.md` remains the ownership and business-rule document, but it is no longer the only customer DDL baseline source.

Executable files:

- `sql/migrations/V20260625_001_customer_schema.sql`: creates the nine customer-owned tables: `customer`, `customer_contact`, `customer_address`, `customer_salesman_bind_log`, `customer_fund_account`, `customer_fund_flow`, `customer_deposit_batch`, `customer_sample_policy`, and `sample_rebate_record`.
- `sql/migrations/V20260625_002_customer_seed_public_customer.sql`: inserts only the two built-in PUBLIC customers: `PUB_DIRECT_SALE` for `DIRECT_SALE` and `PUB_SELF_MEDIA` for `SELF_MEDIA`.
- `sql/migrations/V20260625_003_customer_menu_permission.sql`: inserts the RuoYi `business/customer` menu and `business:customer:*` button permissions with `not exists` guards.
- `sql/validation/customer_runtime_validation.sql`: read-only runtime validation for PUBLIC seeds, public channel uniqueness, final fund vocabulary, `CUSTOMER_DEPOSIT` batch typing, deposit-entry flow type, and absence of `LONG_TERM_DEPOSIT` / `ROLLING_ORDER_DEPOSIT` data.

## Registry Contract

`ai/registry/migration-registry.json` registers these customer entries as blocking:

- `customer-schema-baseline`
- `customer-public-seed-baseline`
- `customer-menu-permission-baseline`
- `customer-runtime-validation`

Each blocking entry must keep a non-empty `rollbackPlan`, non-empty `verification`, and an existing executable `.sql` file. Future blocking migrations must also be executable SQL, not markdown-only plans.

## Scope Boundaries

R-06 does not add `idempotent_request`, sales-order tables, sales-order permissions, sales-order routes, customer fund runtime logic, Java runtime changes, Vue runtime changes, or non-customer business tables.

The current final customer fund vocabulary remains:

- `CUSTOMER_DEPOSIT`
- `SAMPLE_REBATE`

`LONG_TERM_DEPOSIT` and `ROLLING_ORDER_DEPOSIT` must not be reintroduced in current schema, seed, menu, permission, or validation baselines.

## Runtime Use

For a disposable MySQL test database, apply the executable baseline in order:

```bash
mysql < sql/migrations/V20260625_001_customer_schema.sql
mysql < sql/migrations/V20260625_002_customer_seed_public_customer.sql
mysql < sql/migrations/V20260625_003_customer_menu_permission.sql
mysql < sql/validation/customer_runtime_validation.sql
```

The validation SQL is read-only. A passing validation run returns no violation rows for every query.
