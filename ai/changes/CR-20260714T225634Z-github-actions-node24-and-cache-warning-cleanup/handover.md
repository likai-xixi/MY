# Handover

## Summary

[ci] Follow-up governance cleanup for the two concrete annotations exposed by successful `master` run `29374274047`. GitHub Actions are upgraded to immutable Node 24-runtime release pins, and only the unused governance Maven cache is removed.

## Impact

- The project Node version remains 20; only the JavaScript runtime embedded in the GitHub Actions changes to Node 24.
- Governance retains Temurin JDK 17, root install/check/test, and all existing failure behavior.
- Backend tests retain Temurin JDK 17, Maven caching, and exact `ruoyi-business -am -Pintegration-test verify` coverage.
- Frontend install, tests, full moderate audit including dev dependencies, and production build remain unchanged.
- No business, dependency, lockfile, route, API, permission, database, SQL, graph, release, or deployment change.

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
- [not-run] `npm run finalize:change`
- [not-run] `npm run close:change`
- [not-run] `git diff --check`
- [ci-planned] GitHub Actions `scaffold-ci` after push

## Verification

- [local] TDD regression is green at 43/43 after failing on the old action pins.
- [local] CI declaration and immutable-action lint gates pass.
- [local] Official action metadata confirms all three selected pins use Node 24.
- [local] Full repository governance passes with 481/481 Node tests.
- [ci-planned] Remote CI confirmation remains before publish closeout.

## Risks

- Remote Actions must confirm all three jobs still pass and the two repaired annotations disappear.
- Existing stashes remain preserved and must not be applied, popped, or dropped.
- `beforeSalesOrder` remains blocked.

## Next Actions

- Run the full governance gate, finalize evidence, and close the change.
- Commit and push the follow-up, then inspect both run conclusion and annotations.
- Do not release or deploy.
