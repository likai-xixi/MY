# Project State

## Current Goal

Complete the authorized local CI-FIX-01 Immutable advisory repair while preserving the existing dependency-security commits, R-12A boundaries, and blocked phase gates.

## Status

R-11 remains published and CI-verified. R-12A source remains published, but remote runs `29792754518` and `29794081328` remain failures. [local] The earlier CI-FIX commit resolves `brace-expansion@2.1.2`; the new independently reviewed and locally closed extension resolves `immutable@5.1.8` under review-only base `4ac76926239e3300196c6a548024686ee8440e3d`. [not-run] Neither dependency implementation has current remote CI evidence.

## Current Scope

- Dependency fix: `immutable 5.1.6 -> 5.1.8` through unchanged `sass-embedded@1.97.2` and its existing `immutable:^5.0.2` range.
- Regression: platform lockfile coverage rejects both 2026 advisory-affected release lines.
- No direct manifest, parent version, override, CI workflow, R-12A business/review, Java/Vue business source, migration, route, permission, API, SQL, graph, registry, roadmap, or phase-gate change.

## Active Task

`TASK-0002` in `memory/TASKS.json`; R-12A task `TASK-0012` remains blocked on remote CI closure.

## Latest Session

`memory/sessions/2026-07-22-ci-fix-01-immutable.md`.

## Phase Gates

- `engineeringCoreReady`: `blocked`.
- `beforeSalesOrder`: `blocked`.

## Next Actions

- Stop before push and wait for explicit authorization for the complete dependency-security commit stack.
- Do not claim R-12A release success or begin R-12B.

## Last Verification

[local] Clean install/audit 0, platform dependency 5/5, UI 7/7, production build 2602 modules, R-12A Node 39/39, Java 65/65 including masterdata 28/28, MySQL integration 2/2, scans, review/phase/CI-declaration gates, and diff checks pass. Complete `npm run check` passes every gate with 491/491 root Node tests; embedded close passes.
