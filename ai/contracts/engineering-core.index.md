# Engineering Core Contract Index

Change: `R-11 engineering-core roadmap rebaseline`
Status: approved architecture contract; runtime not implemented.

## Authority

This R-11 package is the future-state authority for product configuration, engineering calculation, and release semantics. Current R-10 runtime ownership files (`masterdata.api.md`, `masterdata.db.md`, `masterdata.ui.md`, and `masterdata.permission.md`) remain truthful descriptions of the as-is runtime only until the destructive migration is executed.

When an older R-09 concept conflicts with this package, R-11 wins. In particular:

- `ProductModel` is not a process/craft plan.
- Sales options are `OptionSet` and `OptionValue`; they are not a technical-field system.
- Published versions, snapshots, and release objects are not generic CRUD resources.
- Main leaf, secondary leaf, grid, splice, and segment are decomposition-node data, not fixed database columns.

## Contract Set

- `engineering-core.domain.md`: identities, ownership, relationships, and invariants.
- `engineering-core.calculation-io.md`: unified calculation input and generic decomposition output.
- `engineering-core.version-release.md`: order/technical/calculation/release trace chain and lifecycle commands.
- `engineering-core.migration-plan.md`: breaking migration from the current nine-resource masterdata runtime.
- `engineering-core.golden-samples.md`: the first two 9CM golden scenarios and fixture requirements.
- `engineering-core.contract-test-matrix.md`: positive, negative, migration, and reverse-review evidence.

## Bounded Contexts

| Context | Owns | Does not own |
| --- | --- | --- |
| Product catalog | Category, series, product model identity | Process recipe, formula, release |
| Option catalog | Reusable selectable sets and values | Technical derived fields |
| Field catalog | Field definition, ownership, scheme/version | Customer-choice value catalog |
| Engineering plan | Process plan and immutable versions | Production route execution |
| Calculation | Versioned input/output documents and trace | Order editing, DXF rendering |
| Technical release | Approved technical bundle | Shop dispatch state |
| Production release | Factory-consumable released version | Mutable technical design |

## Readiness Meaning

R-11 makes the architecture contract-ready, not runtime-ready. `engineering-core-ready` remains incomplete until later changes have:

1. Executed the destructive masterdata migration.
2. Implemented field definitions/schemes and process-plan versions.
3. Implemented immutable version/release persistence and command APIs.
4. Implemented the calculation I/O boundary without requiring formula or DXF engines.
5. Passed both signed 9CM golden fixtures.
6. Proved the five reverse-review checks in the contract-test matrix.

`beforeSalesOrder` depends on `engineering-core-ready` and therefore remains blocked after R-11.

## R-11 Non-goals

- No Java, Vue, SQL, API client, route, permission, graph, runtime test, formula engine, DXF generator, sales-order, production, or deployment change.
- No old API/table/name compatibility.
- No claim that executable golden results exist.
