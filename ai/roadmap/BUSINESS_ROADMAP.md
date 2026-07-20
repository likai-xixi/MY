# Business Roadmap

## Direction

The roadmap separates commercial intent, engineering decisions, calculation evidence, technical release, and factory release. Downstream modules consume immutable versions instead of mutable customer or masterdata rows.

## Phase Order

1. Customer management stabilization.
2. R-11 engineering-core architecture/contract rebaseline.
3. R-12A destructive product/option/material catalog migration.
4. R-12B field library, ownership, and scheme-version runtime.
5. R-12C process plan/version and product-applicability runtime.
6. R-12D canonical calculation I/O, snapshot persistence, and signed golden runner.
7. R-12E technical/production release artifact command boundaries.
8. `engineering-core-ready` only after every required slice and both 9CM golden samples pass.
9. Sales order, only after `beforeSalesOrder` passes.
10. Delivery and finance after sales-order states/snapshots/fund boundaries are stable.
11. Production execution after technical and production release policy is implemented.

Formula engines and DXF generation are later adapters. The core interfaces must be stable before them, but R-11 does not implement either adapter.

## Engineering-Core Entry Criteria

Each R-12 runtime slice requires its own change record, a review package already committed at the slice's base revision, explicit runtime edit roots, executable tests, and migration/rollback evidence.

## Sales-Order Entry Criteria

Sales-order work may start only after:

- `engineering-core-ready` is complete and `engineeringCoreReady` is ready.
- Multi-role review explicitly allows the sales-order runtime roots from a committed base review.
- Current-context, document/read-budget, roadmap, phase-gate, and refactor-debt checks pass.
- Sales-order snapshot, state-machine, and fund-boundary contracts are approved.
- `beforeSalesOrder` is ready.

## Boundary Notes

- Product model is not process plan.
- Sales-order versions capture customer/commercial intent; technical versions capture engineering decisions.
- Production consumes a production release version derived from a technical release package.
- Formula and DXF integrations cannot require new fields on order or technical-version headers.
