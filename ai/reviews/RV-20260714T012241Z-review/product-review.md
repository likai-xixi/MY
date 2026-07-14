# Product Review

## Outcome

Fix the validated whole-project review findings without declaring the unfinished product release-ready. The work is corrective: protect customer financial data, fail closed when sample-order truth is unavailable, preserve master-data referential integrity, isolate notice HTML, make the production profile bootable, and remove governance false-greens.

## Approved Business Scope

- `customer`: query-safe detail responses, read-only fund queries, fail-closed authoritative-order rebate boundary, and concurrency-safe owner-transfer enforcement.
- `masterdata`: reject logical deletion while active records still reference the target.
- `system`: render notice rich text in a browser-enforced sandbox so stored content cannot execute in the parent application.
- `platform`: provide every Druid property required by the standalone production profile.
- A later, separate `governance/rule-change`: bind reviews to the active change/scope, verify committed handoff coverage, run Maven as a reactor, execute tests in CI/release verification, lock frontend dependencies, and detect current-context drift.

## User Value

- Basic customer viewers no longer see fund, rebate, policy, or owner-history data without the matching permission.
- A caller cannot invent a sample order or amount: generation is unavailable until a real order authority exists, and future activation has order-level uniqueness plus policy/idempotency controls.
- Ordinary edits and concurrent transfers cannot silently change ownership or create a misleading audit sequence.
- Users cannot delete master data that still has active dependants.
- Notice authors retain formatted content, but the content cannot execute in the application origin.
- Development continues with trustworthy checks; this change does not claim production release readiness.

## Non-Goals

- No sales-order, delivery, finance, production-domain, formula, model-config, or DXF implementation.
- No customer deposit deduction, refund, adjustment, or reversal.
- No compatibility layer for stale pre-release payloads.
- No release declaration and no weakening of an existing gate.

## Success Criteria

- Every validated finding has a failing regression test before its implementation and a passing positive/negative control afterward.
- Business and governance edits are isolated in separate change records and commits.
- `beforeSalesOrder` remains blocked.
- Full Node, Maven unit/integration, frontend build/audit, production-profile startup, governance, and post-push CI evidence is recorded.
