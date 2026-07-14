# Session: GitHub Actions Node 24 and cache warning cleanup

## Task

`TASK-0002` - close governance change `CR-20260714T225634Z-github-actions-node24-and-cache-warning-cleanup`, then commit, push, and confirm remote CI annotations without release or deployment.

## Status

`verified`

## Goal

Remove the deprecated Node.js 20 action-runtime annotations and the unused governance Maven-cache annotation exposed by successful run `29374274047` without weakening any root, backend, or frontend CI coverage.

## Changed Files

- Workflow action pins and governance cache input, the focused CI regression, the rule proposal, current context, change record, and memory evidence.
- `changed-files.json` is the authoritative final path list after finalization.

## Commands

- `[local] npm run resume`
- `[local] npm run context:build -- platform`
- `[local] node --test tests/ci-coverage-hardening.test.js`
- `[local] npm run check:ci-coverage-declaration`
- `[local] npm run lint:codex`
- `[local] npm run finalize:change`
- `[local] npm run check`
- `[not-run] npm run close:change`
- `[not-run] git diff --check`
- `[ci-planned] GitHub Actions scaffold-ci after push`

## Verification

- [ci] Source run `29374274047` passed all three jobs on commit `c083c9cbdbdbb033c75b957a95f76df59f2b683f` and exposed the two annotations in scope.
- [local] Official release tags resolve checkout v5.0.1, setup-node v5.0.0, and setup-java v5.5.0 to the recorded immutable SHAs; their official `action.yml` files declare Node 24.
- [local] The focused repository-workflow regression failed before implementation and passes 43/43 after implementation.
- [local] CI coverage declaration and immutable-action lint pass.
- [local] Project `node-version: 20`, both Temurin JDK 17 setups, every CI command, and backend Maven caching remain unchanged; only governance `cache: maven` is removed.
- [local] The first two full checks correctly exposed incomplete session/provenance evidence; after repair, the complete gate passes 481/481.

## Risks

- The follow-up remote run must prove all three jobs remain successful and both repaired annotation classes disappear.
- Both existing stashes must remain untouched; `beforeSalesOrder` remains blocked.

## Next Entry Point

Rerun the full repository gate, finalize and close the evidence, audit exact staging, commit/push `master`, inspect the new Actions run and annotations, run the post-push check, and do not release or deploy.
