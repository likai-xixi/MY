# Plan

Mode: `update`
Feature: `masterdata`

1. Resume project state, build the focused masterdata context, and bind the approved umbrella review.
2. Record an exact change scope limited to masterdata runtime, tests, SQL, contracts, registry, generated database scan, context, and memory.
3. Add failing static and service tests for deterministic parent/target locking and every owned active-reference edge.
4. Implement normalized bulk deletion, exact affected-row checks, deterministic locks, and seven-edge delete rejection.
5. Add MySQL concurrency coverage for both transaction orderings and read-only orphan validation SQL.
6. Independently review data integrity and locking; repair active-model series recategorization, concurrent category-tree depth, and mutation-count coverage.
7. Reproduce the empty-tree first-create deadlock, then add a permanent hidden hierarchy mutex row and a real two-transaction regression proving both creates succeed.
8. Exercise the real Spring transaction proxy, production service, MyBatis XML, migration, and MySQL lock-wait observation; cover every non-empty reference edge plus migration repeat, repair, and missing-sentinel failure.
9. Synchronize contracts, registry, generated database scan, current context, task/session memory, exact changed-files evidence, and handover.
10. Run focused tests, Maven reactor tests, Testcontainers integration, scans, change closeout, the full project gate, and final independent review.
11. Commit only the exact approved masterdata file set; do not push until all later system, platform, and governance batches pass.

## Scope Boundary

- No frontend, route, permission, sales-order, system-notice, production-profile, or governance-tool changes.
- The migration adds one permanent logically deleted mutex record; it does not add or reshape a table.
- `beforeSalesOrder` remains blocked.
- The project remains unreleased; this batch does not deploy or publish.
