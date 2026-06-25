# Session: CI Backend Frontend Governance Checks

## Task

`TASK-0002` / platform governance - Implement `CR-20260625T112646Z-ci-backend-frontend-governance-checks`.

## Status

`in_progress` - GitHub Actions baseline CI and checker regression coverage are implemented and locally verified for CR-2.

## Goal

- Add real GitHub Actions jobs for Node governance, backend Maven compile, and ruoyi-ui production build.
- Make CI coverage declarations depend on real workflow `run:` commands, not broad text labels.
- Add `[ci-planned]` provenance for workflow coverage that will run in GitHub Actions after push, without treating it as passed CI evidence.
- Keep the change governance-only: no customer runtime code, no sales-order code, and no business DDL.

## Changed Files

- `.github/workflows/ci.yml`
- `tools/governance-checker-utils.js`
- `tools/ci-coverage-declaration-checker.js`
- `tools/verification-provenance-checker.js`
- `tests/governance-gates.test.js`
- `README.md`
- `ai/context/current-context.md`
- `ai/context/current-context.json`
- `ai/changes/CR-20260625T112646Z-ci-backend-frontend-governance-checks/*`
- `memory/HANDOVER.md`
- `memory/PROJECT_STATE.md`
- `memory/TASKS.json`
- `memory/CHANGELOG.md`

## Commands

- [local] `npm run resume` - passed.
- [local] `npm run start:change -- --mode rule-change "ci backend frontend governance checks"` - passed and created this CR.
- [local] `npm run context:build -- customer` - passed and regenerated current context for this CR.
- [local] `node --test tests/governance-gates.test.js` - passed with 16 tests during implementation.
- [local] `npm test` - passed with 137 Node tests.
- [local] `npm run check:ci-coverage-declaration` - passed with no Maven/frontend missing warnings.
- [local] `npm run check:verification-provenance` - passed.
- [local] `npm run check` - passed with 137 Node tests; `check:config-safety` retained existing development/default configuration warnings only.
- [local] `mvn -pl ruoyi-admin -am -DskipTests compile` - passed with `BUILD SUCCESS` using the Maven path configured in `ai/rules/runtime-policy.json`.
- [local] `npm --prefix ruoyi-ui run build:prod` - passed; Vite transformed 2546 modules and built successfully.
- [local] `git diff --check` - passed.
- [local] forbidden-path audit - passed with `FORBIDDEN_PATH_AUDIT_OK`.

## Verification

- [local] The workflow jobs are real command jobs: `governance`, `backend-compile`, and `frontend-build`.
- [local] CI coverage and provenance checkers passed against the updated workflow and docs.
- [local] Maven backend compile and ruoyi-ui production build passed locally.
- [local] `git diff --check` and forbidden-path audit passed after evidence updates.
- [ci-planned] GitHub Actions workflow includes Node governance, Maven compile, and ruoyi-ui build; actual CI result is determined after push.

## Risks

- [inconclusive] Evidence freshness remains documented but not yet a blocking gate.
- [inconclusive] Migration gating remains non-blocking for sales-order.
- [inconclusive] Idempotency, state-machine, and contract-to-test gates remain future CRs.
- [inconclusive] Sales-order three contracts remain uncreated.
- [ci-planned] GitHub Actions workflow includes Node governance, Maven compile, and ruoyi-ui build; actual CI result is determined after push.

## Next Entry Point

Review CR-2, then use a separate publish step for commit/push and post-push GitHub Actions confirmation. Keep CR-3 high-risk semantic gates and CR-4 sales-order contracts separate.
