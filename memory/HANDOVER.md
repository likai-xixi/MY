# Handover

## Summary

[local] Active governance follow-up `CR-20260714T225634Z-github-actions-node24-and-cache-warning-cleanup` addresses the two non-blocking annotations exposed by successful `master` run `29374274047`. It upgrades checkout, setup-node, and setup-java to verified immutable Node 24-runtime release pins and removes only the unused governance Maven cache while preserving both JDK 17 setups and all CI commands.

## Impact

- The project continues to run Node 20; only the JavaScript runtime embedded in GitHub Actions moves to Node 24.
- Governance retains Temurin JDK 17 and root install/check/test; backend-tests retains JDK 17, Maven cache, and exact integration verification.
- Frontend install, tests, full moderate audit including dev dependencies, and production build remain unchanged.
- Business runtime, UI runtime, APIs, routes, permissions, SQL, database, graph, dependencies, lockfiles, release, and deployment are unchanged.
- `beforeSalesOrder` remains blocked, and both historical stashes remain preserved.

## Changed Files

- `.github/workflows/ci.yml`
- `ai/changes/CR-20260714T225634Z-github-actions-node24-and-cache-warning-cleanup/changed-files.json`
- `ai/changes/CR-20260714T225634Z-github-actions-node24-and-cache-warning-cleanup/handover.md`
- `ai/changes/CR-20260714T225634Z-github-actions-node24-and-cache-warning-cleanup/impact.json`
- `ai/changes/CR-20260714T225634Z-github-actions-node24-and-cache-warning-cleanup/plan.md`
- `ai/changes/CR-20260714T225634Z-github-actions-node24-and-cache-warning-cleanup/request.md`
- `ai/changes/CR-20260714T225634Z-github-actions-node24-and-cache-warning-cleanup/verification.md`
- `ai/changes/CURRENT_CHANGE.json`
- `ai/context/current-context.json`
- `ai/context/current-context.md`
- `ai/rule-proposals/2026-07-14-github-actions-node24-and-cache-warning-cleanup.json`
- `memory/CHANGELOG.md`
- `memory/HANDOVER.md`
- `memory/PROJECT_STATE.md`
- `memory/TASKS.json`
- `memory/sessions/2026-07-15-github-actions-node24-and-cache-warning-cleanup.md`
- `tests/ci-coverage-hardening.test.js`

## Commands

- [local] `npm run resume`
- [local] `npm run context:build -- platform`
- [local] `node --test tests/ci-coverage-hardening.test.js`
- [local] `npm run check:ci-coverage-declaration`
- [local] `npm run lint:codex`
- [local] `npm run check`
- [local] `npm run finalize:change`
- [local] `npm run close:change`
- [local] `git diff --check`
- [ci-planned] GitHub Actions `scaffold-ci` after the follow-up push

## Verification

- [ci] Source run `29374274047` passed all three jobs on `c083c9c`; its concrete warnings are the sole scope of this follow-up.
- [local] Official tag resolution and action metadata confirm checkout v5.0.1, setup-node v5.0.0, and setup-java v5.5.0 use Node 24 at the recorded immutable SHAs.
- [local] The focused workflow regression failed on the old workflow and passes 43/43 after the fix.
- [local] CI coverage declaration and immutable-action lint pass without weakening required commands.
- [local] Full local governance passes with 481/481 Node tests.
- [ci-planned] The follow-up remote Actions annotation audit remains before publish closure.

## Risks

- The workflow follow-up commit `89e63df` is pushed; the evidence-only correction and final remote annotation audit are pending.
- Remote Actions must prove the warning cleanup without regressions in any of the three jobs.
- Sales-order implementation remains blocked.

## Next Actions

- Commit and push the evidence-only correction to `master`, confirm all latest-head Actions jobs and annotations, then run the post-push check.
- Do not repeat implementation or broaden the current 17-path governance scope.
- Preserve `stash@{0}` and `stash@{1}`; do not release or deploy.

## Recovery Pointer

Read `AGENTS.md`, `ai/context/current-context.md`, this handover, and `ai/changes/CR-20260714T225634Z-github-actions-node24-and-cache-warning-cleanup/verification.md`. The two stashes are superseded historical snapshots and must not be applied, popped, or dropped during closeout.
