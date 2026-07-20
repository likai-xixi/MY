# Governance Roadmap

## Current Position

- Repository profile: locked RuoYi + Vue3 adapter.
- Active governance change: R-11 engineering-core roadmap rebaseline.
- Existing R-10 masterdata runtime: implemented, but its product/option/generic-CRUD semantics are scheduled for destructive replacement.
- Engineering-core runtime: not started.
- Sales-order, production, formula-engine, and DXF runtime: not started.

## Governance Sequence

1. Approve the R-11 engineering-core contracts and five reverse-review assertions.
2. Register `engineeringCoreReady` and make `beforeSalesOrder` depend on `engineering-core-ready`.
3. Keep `engineering-core-ready` incomplete until catalog migration, field versions, process plans, calculation I/O, release artifacts, golden samples, and reverse review are complete.
4. Execute each runtime slice in a separate approved change; no R-11 runtime.
5. Preserve current-context, provenance, file-weight, review, rule-object, and handover evidence through every slice.
6. Open sales-order runtime only after both aggregate engineering and sales-order-specific gates pass.

## Single Truth Sources

- `ai/contracts/engineering-core.index.md`: architecture precedence.
- `ai/roadmap/phase-gates.json`: phase status and dependencies.
- `ai/roadmap/enhancement-backlog.json`: required item status/evidence/action.
- `tools/phase-gate-checker.js`: machine enforcement.
- `before-sales-order-phase-gate` rule object: governance ownership and change policy.

Do not add a parallel sales-order or engineering-core gate script. Extend the existing phase-gate chain.

## R-11 Non-goals

- No business runtime, table, migration, page, endpoint, route, permission, formula, DXF, release, or deployment.
- No compatibility layer for current masterdata semantics.
- No claim that contract-ready means engineering-core-ready.
