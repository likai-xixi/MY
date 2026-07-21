# Project State

## Current Goal

Prepare and execute R-12A as an independent breaking masterdata migration without crossing into later engineering-core or sales-order runtime.

## Status

R-11 is published and CI-verified. R-12A review was committed as immutable baseline `f28e3d12358bdc35ac1782fd50be7850f937bc1b`; the approved catalog/option implementation and local runtime acceptance are complete and remain uncommitted.

## Current Scope

- Product catalog: 产品大类、产品系列、产品型号.
- Option catalog target: `option-set` / `option-value` with `SINGLE` or `MULTIPLE`.
- Migration: deterministic Strategy A on the inspected development database.
- Forbidden: field/process/formula/order/production/DXF/customer-fund runtime and governance tooling changes.

## Active Task

`TASK-MASTERDATA-R12A` in `memory/TASKS.json`.

## Latest Session

`memory/sessions/2026-07-21-r-12a-runtime.md`.

## Phase Gates

- `engineeringCoreReady`: `blocked`.
- `beforeSalesOrder`: `blocked`.

## Next Actions

- User reviews the uncommitted R-12A implementation and evidence.
- Commit and push the implementation only after explicit user instruction; do not start R-12B.

## Last Verification

R-12A local evidence: focused Node 39/39, Java unit 65/65, MySQL integration 2/2, UI 7/7, Maven package, Vue production build, Strategy A migration/validation, API/browser acceptance, and rollback rehearsal passed. Full governance closeout is recorded in the active change verification.
