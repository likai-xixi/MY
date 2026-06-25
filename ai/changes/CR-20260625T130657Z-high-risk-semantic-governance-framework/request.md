# Request

Governance/rule-change task: establish the CR-3 high-risk semantic governance framework.

Scope:

- Add high-risk domain, evidence, contract-to-test, idempotency, state-machine, migration, and permission coverage registries/schemas.
- Add real checker and test coverage for those framework artifacts.
- Wire the high-risk governance checker into `npm run check`.
- Keep `beforeSalesOrder` blocked and leave sales-order contract implementation to CR-4.

Non-goals:

- No customer Java/Vue/mapper/XML/API/SQL runtime changes.
- No sales-order, delivery, finance, or production runtime code.
- No business database table structure changes.
- No fake tests, echo-only gates, `continue-on-error`, or relaxed existing checks.
