# Handover

## Summary

Current governance/ci rule-change: `CR-20260625T112646Z-ci-backend-frontend-governance-checks`.

## Impact

This CR adds baseline GitHub Actions CI with real Node governance, Maven backend compile, and ruoyi-ui production build jobs. It also hardens the governance checkers so documentation can only claim CI Maven/frontend coverage when the workflow contains real matching commands.

Follow-up CI repair: the first pushed Actions run failed in `governance` because `scan:frontend-routes:check` regenerated a different route scan on a clean Linux checkout. The root cause was `.gitignore` pattern `build/` ignoring the pre-existing `ruoyi-ui/src/views/tool/build/*.vue` source files that the committed generated route scan already referenced. This repair adds a narrow `.gitignore` exception and tracks those RuoYi tool source files; it does not relax the scanner or CI workflow.

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
- [local] `node --test tests/governance-gates.test.js` - passed with 15 tests during implementation.
- [local] `npm run finalize:change -- --summary "CI backend frontend governance checks" ...` - passed.
- [local] `npm test` - passed with 137 Node tests.
- [local] `npm run check:ci-coverage-declaration` - passed with no Maven/frontend missing warnings.
- [local] `npm run check:verification-provenance` - passed.
- [local] `npm run check` - passed with 137 Node tests; `check:config-safety` retained existing development/default configuration warnings only.
- [local] `mvn -pl ruoyi-admin -am -DskipTests compile` - passed with `BUILD SUCCESS` using the Maven path configured in `ai/rules/runtime-policy.json`.
- [local] `npm --prefix ruoyi-ui run build:prod` - passed; Vite transformed 2546 modules and built successfully.
- [local] `git diff --check` - passed.
- [local] forbidden-path audit - passed with `FORBIDDEN_PATH_AUDIT_OK`.
- [ci] First pushed GitHub Actions run `28168635884` failed in `governance` / `npm run check` at `scan:frontend-routes:check`.
- [local] `npm run scan:frontend-routes` confirmed no generated JSON diff after the tool/build source-tracking fix.
- [local] Frontend route scan completed with no contract changes; the repair does not add or change routes, screens, API clients, or UI graph content.
- [local] Permission scan completed with no contract changes; the repair does not add or change menus, auth strings, or permission ownership.
- [local] Repair verification passed: `npm run scan:frontend-routes`, `npm run scan:frontend-routes:check`, `npm run check:ci-coverage-declaration`, `npm run check:verification-provenance`, `npm test`, `npm run check`, Maven compile, ruoyi-ui production build, and `git diff --check`.

## Verification

- [local] Targeted governance tests passed with 16 tests after checker and workflow updates.
- [local] The workflow contains real jobs named `governance`, `backend-compile`, and `frontend-build`.
- [local] Full `npm run check`, Maven compile, and ruoyi-ui production build all passed locally for this CR.
- [ci] First pushed GitHub Actions run failed only in `governance`; `backend-compile` and `frontend-build` passed.
- [ci-planned] GitHub Actions workflow includes Node governance, Maven compile, and ruoyi-ui build; actual CI result for this repair is determined after push.
- [local] `git diff --check` and forbidden-path audit passed after evidence updates.
- [local] Frontend route and permission semantic surfaces have no contract changes; the fix makes clean checkout include source files already referenced by generated governance artifacts.
- [local] Final local repair verification passed before committing the follow-up fix.

## Risks

- [inconclusive] Evidence freshness remains documented but not yet a blocking gate.
- [inconclusive] Migration gating remains non-blocking for sales-order.
- [inconclusive] Idempotency, state-machine, and contract-to-test gates remain future CRs.
- [inconclusive] Sales-order three contracts remain uncreated.
- [ci-planned] Actual GitHub Actions result requires push-time CI confirmation.

## Next Actions

- Finish the final local verification ladder for CR-2.
- Review CR-2, then handle commit/push and post-push CI confirmation as a separate publish step.
- Keep CR-3 high-risk semantic framework and CR-4 sales-order contracts separate.
