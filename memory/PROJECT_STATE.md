# Project State

## Current Goal

Close out the real R-12A publication state without hiding its failed dependency-security CI or crossing into R-12B/runtime work.

## Status

R-11 remains published and CI-verified. R-12A review-only commit `f28e3d12358bdc35ac1782fd50be7850f937bc1b` and implementation commit `9cb1f59d89949330cfe796ae2db25728d356038c` are published on `origin/master`. Implementation CI run `29792754518` completed `failure` because `frontend-build` rejected newly disclosed high-severity `GHSA-3jxr-9vmj-r5cp` in transitive `brace-expansion@2.1.1`; R-12A is not CI-green or release-successful.

## Current Scope

- Product catalog: 产品大类、产品系列、产品型号.
- Option catalog target: `option-set` / `option-value` with `SINGLE` or `MULTIPLE`.
- Migration: deterministic Strategy A on the inspected development database.
- Publication: review and implementation source commits are remote and immutable; local, tracking, and remote refs aligned before the evidence-only sync.
- CI: governance and backend-tests passed; frontend-build failed before production build at the mandatory dependency audit.
- Forbidden: dependency repair in this sync, review-decision changes, field/process/formula/order/production/DXF/customer-fund runtime, and R-12B work.

## Active Task

`TASK-0012` in `memory/TASKS.json`.

## Latest Session

`memory/sessions/2026-07-21-r-12a-post-push.md`.

## Phase Gates

- `engineeringCoreReady`: `blocked`.
- `beforeSalesOrder`: `blocked`.

## Next Actions

- Publish the evidence-only post-push handover sync and inspect its distinct CI result.
- Open a separate frontend dependency-security baseline repair only with explicit authority; do not start R-12B.

## Last Verification

R-12A local evidence remains green: focused Node 39/39, Java unit 65/65, MySQL integration 2/2, UI 7/7, Maven package, Vue production build, Strategy A migration/validation, API/browser acceptance, and rollback rehearsal. Remote run `29792754518` is red only at the newly published dependency advisory; clean-worktree `npm run check:after-push` passed.
