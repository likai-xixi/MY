# Project State

## Current Goal

Prepare and execute R-12A as an independent breaking masterdata migration without crossing into later engineering-core or sales-order runtime.

## Status

R-11 is published and CI-verified. R-12A review is approved, but implementation is paused before business code because its review package must first be present in a committed base and the user has forbidden automatic commits.

## Current Scope

- Product catalog: 产品大类、产品系列、产品型号.
- Option catalog target: `option-set` / `option-value` with `SINGLE` or `MULTIPLE`.
- Migration: deterministic Strategy A on the inspected development database.
- Forbidden: field/process/formula/order/production/DXF/customer-fund runtime and governance tooling changes.

## Active Task

`TASK-MASTERDATA-R12A` in `memory/TASKS.json`.

## Latest Session

`memory/sessions/2026-07-20-r-12a-pre-review.md`.

## Phase Gates

- `engineeringCoreReady`: `blocked`.
- `beforeSalesOrder`: `blocked`.

## Next Actions

- Wait for user authority for a review-only commit.
- If authorized, establish the review commit as implementation base, implement R-12A, and run the complete migration/API/browser/rollback/reverse-audit matrix.

## Last Verification

R-12A pre-review: `check:review`, `check:file-weight`, and `git diff --check` passed. All runtime and closeout verification remains `[not-run]`.
