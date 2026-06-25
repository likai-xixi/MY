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
- Repair the first pushed `governance` CI failure by making the committed frontend route scan source set match clean GitHub Actions checkout.
- Repair the second pushed `governance` CI failure by preventing CI npm install steps from generating untracked lockfiles in clean checkout.

## Changed Files

- `.github/workflows/ci.yml`
- `tools/governance-checker-utils.js`
- `tools/ci-coverage-declaration-checker.js`
- `tools/verification-provenance-checker.js`
- `tests/governance-gates.test.js`
- `README.md`
- `.gitignore`
- `ai/context/current-context.md`
- `ai/context/current-context.json`
- `ai/changes/CR-20260625T112646Z-ci-backend-frontend-governance-checks/*`
- `memory/HANDOVER.md`
- `memory/PROJECT_STATE.md`
- `memory/TASKS.json`
- `memory/CHANGELOG.md`
- `ruoyi-ui/src/views/tool/build/*.vue`

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
- [ci] First pushed GitHub Actions run `28168635884` failed in `governance` / `npm run check` because `scan:frontend-routes:check` reported stale `ai/generated/frontend-routes.json`.
- [local] The stale generated route failure was traced to `.gitignore` ignoring `ruoyi-ui/src/views/tool/build/*.vue`, while generated route artifacts already referenced those RuoYi tool routes.
- [local] `.gitignore` now has a narrow exception for `ruoyi-ui/src/views/tool/build/*.vue`, and the pre-existing RuoYi tool build source files are tracked for clean CI checkout parity.
- [local] Frontend route scan and permission scan completed with no contract changes; no route, screen, API client, menu, auth string, or permission ownership is changed by this repair.
- [ci] Second pushed GitHub Actions run `28169688512` passed `scan:frontend-routes:check` but failed in `governance` / `npm run check` at `check:change-handoff` because root `npm install` created an untracked `package-lock.json`.
- [local] Workflow install commands now use `npm install --package-lock=false` and `npm --prefix ruoyi-ui install --package-lock=false`; these remain real installs and avoid lockfile writes while no lockfile exists.
- [local] Root and `ruoyi-ui` install commands completed with `--package-lock=false` and did not generate lockfiles.
- [local] Repair verification passed: `npm run scan:frontend-routes`, `npm run scan:frontend-routes:check`, `npm run check:ci-coverage-declaration`, `npm run check:verification-provenance`, `npm test`, `npm run check`, Maven compile, ruoyi-ui production build, and `git diff --check`.

## Verification

- [local] The workflow jobs are real command jobs: `governance`, `backend-compile`, and `frontend-build`.
- [local] CI coverage and provenance checkers passed against the updated workflow and docs.
- [local] Maven backend compile and ruoyi-ui production build passed locally.
- [local] `git diff --check` and forbidden-path audit passed after evidence updates.
- [ci] First pushed GitHub Actions run failed only in `governance`; `backend-compile` and `frontend-build` passed.
- [ci-planned] GitHub Actions workflow includes Node governance, Maven compile, ruoyi-ui build, and lockfile-free install commands; actual CI result for this repair is determined after push.
- [local] The repair is source-tracking only for pre-existing RuoYi tool files already present in generated governance artifacts.
- [local] Final local repair verification passed before committing the follow-up install-side-effect fix.

## Risks

- [inconclusive] Evidence freshness remains documented but not yet a blocking gate.
- [inconclusive] Migration gating remains non-blocking for sales-order.
- [inconclusive] Idempotency, state-machine, and contract-to-test gates remain future CRs.
- [inconclusive] Sales-order three contracts remain uncreated.
- [ci-planned] GitHub Actions workflow includes Node governance, Maven compile, ruoyi-ui build, and lockfile-free install commands; actual CI result is determined after push.

## Next Entry Point

Review CR-2, then use a separate publish step for commit/push and post-push GitHub Actions confirmation. Keep CR-3 high-risk semantic gates and CR-4 sales-order contracts separate.
