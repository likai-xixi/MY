# Project State

## Current Goal

Complete the local CI-FIX-01 dependency-security repair without overstating R-12A release status or entering R-12B.

## Status

R-11 remains published and CI-verified. R-12A source remains published, but remote runs `29792754518` and `29794081328` are red at the required frontend dependency audit. [local] CI-FIX-01 now resolves `brace-expansion@2.1.2`, passes the full local frontend/backend regression set, and is bound to independent review-only commit `6a9bfd57548160d85e28776f415b5883b6d92836`. [not-run] The fix has not been pushed or tested by GitHub Actions.

## Current Scope

- Dependency fix: `brace-expansion 2.1.1 -> 2.1.2` through existing `minimatch:^2.0.2` ranges.
- Regression: platform lockfile test covers `GHSA-3jxr-9vmj-r5cp` / `CVE-2026-13149` affected release lines.
- No direct manifest, parent version, override, CI workflow, R-12A business/review, Java/Vue business source, migration, route, permission, API, SQL, graph, registry, roadmap, or phase-gate change.

## Active Task

`TASK-0002` in `memory/TASKS.json`; R-12A task `TASK-0012` remains blocked on remote CI closure.

## Latest Session

`memory/sessions/2026-07-21-ci-fix-01.md`.

## Phase Gates

- `engineeringCoreReady`: `blocked`.
- `beforeSalesOrder`: `blocked`.

## Next Actions

- Finish the local implementation commit and stop before push.
- After explicit push authorization, push both CI-FIX-01 commits, inspect the real three-job workflow, and record post-push evidence.
- Do not claim R-12A release success or begin R-12B until that remote run is fully green.

## Last Verification

[local] Clean install/audit 0, platform dependency 5/5, UI 7/7, production build 2602 modules, R-12A Node 39/39, Java 65/65 including masterdata 28/28, MySQL integration 2/2, scans, review/phase/CI-declaration gates, and scope/diff audits pass. Complete `npm run check` passes every gate with 491/491 root Node tests; embedded and explicit close checks pass.
