# Request

R-09A.3 governance graph validation cleanup.

Repair governance drift and false-green paths after R-09A.1 / R-09A.2:

- Split customer SQL runtime validation from platform idempotency validation.
- Keep `idempotent_request` owned by platform while customer records only endpoint-level usage.
- Remove fake UI screens generated from backend/API routes.
- Scan Vue template global component tags such as `right-toolbar`, `pagination`, and `svg-icon`.
- Add API graph endpoint permission metadata and high-risk permission checks.
- Reconcile README, current context, memory, handover, tasks, and changelog state.

Forbidden scope:

- Do not create sales-order controller, service, mapper, domain, Vue, API client, SQL, table, route, menu, or permission artifacts.
- Keep `beforeSalesOrder` blocked.
- Do not modify `CustomerFundServiceImpl`.
- Do not modify `CustomerServiceImpl`.
- Do not change customer fund calculation, idempotency, flow, batch, sample-rebate business logic.
- Do not weaken gates, fake tests, fake CI, or echo-success scripts.
