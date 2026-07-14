# Decision

Decision: Allow Implementation

Reason: The validated findings have concrete attack or failure paths, explicit invariants, bounded implementation roots, and repeatable negative/positive verification. Implementation is approved only through separate customer, masterdata, system notice, platform production-profile, and governance change records that reference this review.

Approved features:

- `customer`
- `masterdata`
- `system`
- `platform`

Constraints:

- Do not mix business files with governance rule/script/workflow/package changes in one active change.
- Do not create or modify sales-order, delivery, finance, production-domain, formula, model-config, or DXF runtime code.
- Keep `beforeSalesOrder` blocked.
- Keep existing endpoint paths and dedicated permission codes; breaking response cleanup is allowed because the project is unreleased.
- Because no authoritative sample-order runtime exists and `beforeSalesOrder` is blocked, customer sample rebate creation must fail closed. Do not invent an order table or accept client order amounts; keep historical rebate reads and add order-level uniqueness for future integration.
- Owner transfer must lock the customer row, require exactly one update before audit, and recognize salesman eligibility by controlled role keys rather than display names.
- Do not add compatibility shims or weaken a gate.
- Do not commit a record until its regression tests, finalize step, main check, and staged-scope review pass.

Required evidence:

- Focused failing tests before implementation and passing tests afterward.
- Maven unit and MySQL/Testcontainers integration tests.
- Frontend build and executable dependency audit.
- Packaged production-profile startup without unresolved placeholders.
- Browser notice-XSS and customer permission/API/DB acceptance.
- Final independent `spg-review`, clean staged diff, push readback, and real GitHub Actions conclusion.
