# Handover

## Summary

Current governance/ci rule-change: `CR-20260625T112646Z-ci-backend-frontend-governance-checks`.

Current change record: `ai/changes/CR-20260625T112646Z-ci-backend-frontend-governance-checks`.

## Impact

This CR adds baseline GitHub Actions CI with real Node governance, Maven backend compile, and ruoyi-ui production build jobs. It also hardens CI coverage and verification provenance checkers so docs can distinguish `[local]`, `[ci-planned]`, and real `[ci]` evidence.

Follow-up CI repair: the first pushed Actions run failed in `governance` because `scan:frontend-routes:check` produced a different route scan on a clean Linux checkout. The cause was `.gitignore` pattern `build/` ignoring pre-existing `ruoyi-ui/src/views/tool/build/*.vue` RuoYi tool source files that the committed generated route scan already referenced. The repair tracks those source files through a narrow `.gitignore` exception without relaxing scanner or CI gates.

Second follow-up CI repair: the next pushed Actions run passed `scan:frontend-routes:check` but failed in `check:change-handoff` because root `npm install` generated an untracked `package-lock.json` in the clean runner checkout. The workflow now uses `npm install --package-lock=false` for root and `npm --prefix ruoyi-ui install --package-lock=false` for the frontend because neither package has a committed lockfile for `npm ci`.

Third follow-up CI repair: the next pushed Actions run passed the route scan, handoff integrity gate, backend compile, and frontend build, but `governance` failed at `check:runtime` because `mvn` was unavailable in the Node-only job. The governance job now sets up Java 17 before Node so `npm run check` can run the existing runtime checker without skipping it.

Fourth follow-up CI repair: after Java setup, `governance` still failed at `check:runtime` because the runtime policy points Maven to a Windows-local `mvn.cmd` path. The runtime checker now tries the configured path first and then falls back to the standard command name such as `mvn`, while still failing if neither command is runnable.

No customer runtime Java, Vue, mapper XML, API client, business SQL, customer business rule, sales-order implementation, or business database table structure is part of this change.

## Changed Files

- `.github/workflows/ci.yml`
- `.gitignore`
- `README.md`
- `ai/changes/CR-20260625T112646Z-ci-backend-frontend-governance-checks/boundary-exception.md`
- `ai/changes/CR-20260625T112646Z-ci-backend-frontend-governance-checks/changed-files.json`
- `ai/changes/CR-20260625T112646Z-ci-backend-frontend-governance-checks/component-exception.md`
- `ai/changes/CR-20260625T112646Z-ci-backend-frontend-governance-checks/handover.md`
- `ai/changes/CR-20260625T112646Z-ci-backend-frontend-governance-checks/impact.json`
- `ai/changes/CR-20260625T112646Z-ci-backend-frontend-governance-checks/plan.md`
- `ai/changes/CR-20260625T112646Z-ci-backend-frontend-governance-checks/request.md`
- `ai/changes/CR-20260625T112646Z-ci-backend-frontend-governance-checks/verification.md`
- `ai/changes/CURRENT_CHANGE.json`
- `ai/context/current-context.json`
- `ai/context/current-context.md`
- `memory/CHANGELOG.md`
- `memory/HANDOVER.md`
- `memory/PROJECT_STATE.md`
- `memory/TASKS.json`
- `memory/sessions/2026-06-25-ci-backend-frontend-governance-checks.md`
- `ruoyi-ui/src/views/tool/build/CodeTypeDialog.vue`
- `ruoyi-ui/src/views/tool/build/DraggableItem.vue`
- `ruoyi-ui/src/views/tool/build/IconsDialog.vue`
- `ruoyi-ui/src/views/tool/build/RightPanel.vue`
- `ruoyi-ui/src/views/tool/build/TreeNodeDialog.vue`
- `ruoyi-ui/src/views/tool/build/index.vue`
- `tests/governance-gates.test.js`
- `tools/ci-coverage-declaration-checker.js`
- `tools/governance-checker-utils.js`
- `tools/verification-provenance-checker.js`

## Commands

- [local] `npm run resume` - passed.
- [local] `npm run start:change -- --mode rule-change "ci backend frontend governance checks"` - passed.
- [local] `npm run context:build -- customer` - passed.
- [local] `node --test tests/governance-gates.test.js` - passed with 16 tests during implementation.
- [local] `npm run finalize:change -- --summary "CI backend frontend governance checks" ...` - passed.
- [local] `npm test` - passed with 138 Node tests.
- [local] `npm run check:ci-coverage-declaration` - passed with no Maven/frontend missing warnings.
- [local] `npm run check:verification-provenance` - passed.
- [local] `npm run check` - passed with 138 Node tests; `check:config-safety` retained existing development/default configuration warnings only.
- [local] `mvn -pl ruoyi-admin -am -DskipTests compile` - passed with `BUILD SUCCESS` using the Maven path configured in `ai/rules/runtime-policy.json`.
- [local] `npm --prefix ruoyi-ui run build:prod` - passed; Vite transformed 2546 modules and built successfully.
- [local] `git diff --check` - passed.
- [local] forbidden-path audit - passed with `FORBIDDEN_PATH_AUDIT_OK`.
- [ci] First pushed GitHub Actions run `28168635884` failed in `governance` / `npm run check` at `scan:frontend-routes:check`; `backend-compile` and `frontend-build` passed.
- [local] `npm run scan:frontend-routes` produced no JSON diff after the tool/build source-tracking fix.
- [local] Frontend route scan completed with no contract changes; this repair does not add or change routes, screens, API clients, or UI graph content.
- [local] Permission scan completed with no contract changes; this repair does not add or change menus, auth strings, or permission ownership.
- [ci] Second pushed GitHub Actions run `28169688512` passed `scan:frontend-routes:check` but failed in `governance` / `npm run check` at `check:change-handoff` due root `npm install` creating an untracked `package-lock.json`.
- [local] Workflow install commands now use `--package-lock=false` while still running real npm installs.
- [local] Root and `ruoyi-ui` install commands completed with `--package-lock=false` and did not generate lockfiles.
- [ci] Third pushed GitHub Actions run `28170129447` passed route scan, handoff integrity, backend compile, and frontend build, then failed in `governance` / `npm run check` at `check:runtime` because `mvn` was unavailable.
- [local] Governance job now sets up Java 17 before Node so the existing runtime checker can find Maven during `npm run check`.
- [ci] Fourth pushed GitHub Actions run `28170484346` still failed at `check:runtime` because `ai/rules/runtime-policy.json` configured a Windows-local Maven path.
- [local] Runtime checker now falls back from an unavailable configured Maven path to `mvn`, with test coverage in `tests/runtime-checker.test.js`.
- [local] Repair verification passed: `npm run scan:frontend-routes`, `npm run scan:frontend-routes:check`, `npm run check:ci-coverage-declaration`, `npm run check:verification-provenance`, `npm test`, `npm run check`, Maven compile, ruoyi-ui production build, and `git diff --check`.

## Verification

- [local] Targeted governance tests passed with 16 tests after workflow/checker updates.
- [local] Workflow jobs are real command jobs: `governance`, `backend-compile`, and `frontend-build`.
- [local] Full `npm run check`, Maven compile, and ruoyi-ui production build all passed locally for this CR.
- [ci] First pushed GitHub Actions run failed only in `governance`; `backend-compile` and `frontend-build` passed.
- [ci-planned] GitHub Actions workflow includes Node governance with Java/Maven available for `check:runtime`, Maven compile, ruoyi-ui build, lockfile-free install commands, and runtime checker fallback from local Maven path to `mvn`; actual CI result for this repair is determined after push.
- [local] Final `git diff --check` and forbidden-path audit passed after evidence updates.
- [local] Frontend route and permission semantic surfaces have no contract changes; the fix makes clean checkout include source files already referenced by generated governance artifacts.
- [local] Final local repair verification passed before committing the follow-up install-side-effect fix.

## Risks

- [inconclusive] Evidence freshness remains documented but not yet a blocking gate.
- [inconclusive] Migration gating remains non-blocking for sales-order.
- [inconclusive] Idempotency, state-machine, and contract-to-test gates remain future CRs.
- [inconclusive] Sales-order three contracts remain uncreated.
- [ci-planned] Actual GitHub Actions result requires push-time CI confirmation.

## Next Actions

- Review CR-2, then handle commit/push and post-push CI confirmation as a separate publish step.
- Keep CR-3 high-risk semantic framework and CR-4 sales-order contracts separate.
