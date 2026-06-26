# Request

R-04 governance/runtime verification boundary clarification.

Clarify that `npm run check` is a governance consistency and Node structural gate, not production readiness, runtime business correctness, database migration safety, browser acceptance, money-flow idempotency, or complete high-risk semantic coverage.

Document the runtime checker default behavior, production safety gates, CI scaffold-ci boundary, release verification entry, and remaining manual/runtime acceptance requirements.

Do not change customer runtime code, sales-order runtime code, production safety configuration, customer fund model, migration/idempotency registries, database business table structure, package scripts, tools, or tests.
