# Request

Execute governance and architecture batch `R-11 engineering-core roadmap rebaseline` during the pre-release breaking-change period.

## Required Outcomes

1. Separate product model from process plan.
2. Replace sales-option category/value semantics with reusable option-set/option-value.
3. Define field library, field-scheme versions, and `SALES`/`TECH`/`SYSTEM` ownership.
4. Define process plan and immutable process-plan versions.
5. Define canonical calculation input and generic decomposition output.
6. Define order version, technical version, calculation snapshot, technical release package, and production release version.
7. Make `beforeSalesOrder` depend on `engineering-core-ready`.
8. Plan destructive migration for current masterdata tables, API, pages, and tests.
9. Register first golden samples: `9CM 标准单开` and `9CM 对开/分格拼接`.
10. Complete multi-role pre-review; no runtime before an explicit `Allow Implementation` decision.

## Reverse Review

- Reject product model as process plan.
- Reject sales options as technical-field storage.
- Reject generic CRUD for version/release objects.
- Reject fixed main-leaf, secondary-leaf, grid, splice, or segment columns.
- Preserve formula/DXF extension interfaces without rewriting order or technical models.

## Boundary

No sales-order, production, formula, calculation-engine, or DXF runtime. No Java, Vue, SQL, route, API client, permission, database, graph, release, or deployment change.
