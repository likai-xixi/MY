# Technical Review Boundary Contract

Change: `R-11 engineering-core roadmap rebaseline`
Status: approved boundary; runtime not implemented.

## Responsibility

- Sales records and freezes customer/commercial intent in an `OrderVersion`.
- Technical work selects an exact `ProcessPlanVersion`, writes `TECH` fields, calculates, reviews, and freezes a `TechnicalVersion`.
- Calculation creates immutable `CalculationSnapshot` evidence.
- Approval/release creates a `TechnicalReleasePackage`.
- Production later consumes a `ProductionReleaseVersion` derived from that package.

Technical work may read `SALES` fields but does not overwrite the frozen order version. A changed customer requirement creates a new order version; a changed engineering decision creates a new technical version.

## Roadmap Rebaseline

1. R-11: architecture/contracts/roadmap/gate rebaseline only.
2. R-12A: destructive catalog and option-set migration.
3. R-12B: field library, ownership, scheme/version runtime.
4. R-12C: process plan/version and product applicability runtime.
5. R-12D: canonical calculation I/O, snapshot persistence, and signed golden runner.
6. R-12E: technical/production release artifact command boundaries.
7. `engineering-core-ready`: all required slices and both 9CM golden samples pass.
8. Sales-order runtime planning may begin only after `beforeSalesOrder`, which depends on `engineering-core-ready` plus its other business contracts.

Formula engines and DXF generation are later adapters. Their absence does not permit bypassing calculation/release interfaces, and adding them later must not rewrite order or technical-version models.

## R-11 Guard

No sales-order, technical-review, calculation-engine, production, formula, drawing, or DXF runtime is created in R-11.
