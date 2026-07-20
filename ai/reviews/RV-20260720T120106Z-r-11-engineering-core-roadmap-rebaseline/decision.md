# Decision

Decision: Allow Implementation

## Approved Meaning

Implementation is allowed only for the R-11 governance, architecture contracts, roadmap, phase-gate checker/tests, review evidence, and memory/handover roots listed in this review. This decision does not approve business runtime.

## Mandatory Architecture

- Product model and process plan/version are separate identities.
- Sales options become option-set/option-value and do not own technical fields.
- Field definitions have exactly one owner: `SALES`, `TECH`, or `SYSTEM`; published field-scheme versions are immutable.
- Calculation uses one versioned input document and one generic decomposition output graph.
- Order version, technical version, calculation snapshot, technical release package, and production release version are distinct traceable artifacts.
- Generic CRUD cannot publish, approve, calculate, release, supersede, revoke, or mutate historical versions.
- Main leaf, secondary leaf, grids, splices, and segments are data-driven node roles, not fixed columns.
- Formula and DXF remain adapter boundaries with no R-11 runtime.

## Runtime Boundary

No Java, Vue, SQL, route, API client, permission, database, sales-order, production, formula, calculation-engine, or DXF runtime file may be created or edited in this change. Any later runtime batch requires its own change record and a review package already committed at that batch's base revision.

## Gate Decision

`engineering-core-ready` remains incomplete after R-11 because no runtime migration or executable golden sample has run. `beforeSalesOrder` must depend on it and remain blocked.
