# Verification

Status: [local] verified for CR-2 governance/ci scope.

## Commands

- [local] `npm run resume` - passed during startup and confirmed active P0 baseline before this CR was created.
- [local] `npm run start:change -- --mode rule-change "ci backend frontend governance checks"` - passed and created this CR.
- [local] `npm run context:build -- customer` - passed and regenerated `ai/context/current-context.*` for this CR.
- [local] `node --test tests/governance-gates.test.js` - passed with 16 tests during implementation.
- [local] `npm run finalize:change -- --summary "CI backend frontend governance checks" ...` - passed and refreshed `changed-files.json`.
- [local] `npm test` - passed with 137 Node tests after adding scoped current-CR boundary/component exceptions and regenerating current context.
- [local] `npm run check:ci-coverage-declaration` - passed with no Maven/frontend missing warnings.
- [local] `npm run check:verification-provenance` - passed.
- [local] `npm run check` - passed with 137 Node tests; `check:config-safety` retained existing development/default configuration warnings only.
- [local] `mvn -pl ruoyi-admin -am -DskipTests compile` - passed with `BUILD SUCCESS` using the Maven path configured in `ai/rules/runtime-policy.json`.
- [local] `npm --prefix ruoyi-ui run build:prod` - passed; Vite transformed 2546 modules and built successfully.
- [local] `git diff --check` - passed.
- [local] forbidden-path audit - passed with `FORBIDDEN_PATH_AUDIT_OK`.
- [ci] First pushed GitHub Actions run `28168635884` failed in `governance` / `npm run check` because `scan:frontend-routes:check` reported `ai/generated/frontend-routes.json is out of date`.
- [local] Root cause analysis found `.gitignore` pattern `build/` ignored `ruoyi-ui/src/views/tool/build/`, while the committed generated route scan and UI graph already referenced those RuoYi tool routes.
- [local] Fix keeps the scanner gate unchanged and tracks the pre-existing `ruoyi-ui/src/views/tool/build/*.vue` route source files by adding a narrow `.gitignore` exception.
- [local] Frontend route scan completed with no contract changes; `npm run scan:frontend-routes` produced no `ai/generated/frontend-routes.json` diff and `npm run scan:frontend-routes:check` passed.
- [local] Permission scan completed with no contract changes; `npm run check` reached `scan:permissions:check` successfully for this repair.
- [ci] Second pushed GitHub Actions run `28169688512` passed `scan:frontend-routes:check` but failed in `governance` / `npm run check` at `check:change-handoff` because root `npm install` generated an untracked `package-lock.json` in the clean runner checkout.
- [local] Install side-effect fix keeps real dependency installation and changes CI install commands to `npm install --package-lock=false` and `npm --prefix ruoyi-ui install --package-lock=false`, because neither root nor `ruoyi-ui` currently has a lockfile to use with `npm ci`.
- [local] `npm install --package-lock=false` and `npm --prefix ruoyi-ui install --package-lock=false` both completed without generating `package-lock.json` or `ruoyi-ui/package-lock.json`.
- [ci] Third pushed GitHub Actions run `28170129447` passed `scan:frontend-routes:check`, `check:change-handoff`, `backend-compile`, and `frontend-build`, but failed in `governance` / `npm run check` at `check:runtime` because `mvn` was unavailable in the Node-only governance job.
- [local] Governance job now sets up Java 17 before Node so `npm run check` can run the existing runtime checker without skipping or relaxing it.
- [local] `npm run context:build -- customer` - passed after the repair and refreshed `ai/context/current-context.*`.
- [local] `npm test` - passed with 137 Node tests after the repair.
- [local] `npm run check` - passed after the repair; `scan:frontend-routes:check`, `scan:permissions:check`, `check:change-handoff`, and 137 Node tests all passed.
- [local] `mvn -pl ruoyi-admin -am -DskipTests compile` - passed with `BUILD SUCCESS` after the repair.
- [local] `npm --prefix ruoyi-ui run build:prod` - passed after the repair.
- [local] `git diff --check` - passed after the install side-effect fix.

## Evidence

- [local] `.github/workflows/ci.yml` now defines `governance`, `backend-compile`, and `frontend-build` jobs with real commands, not echo-only placeholders.
- [local] `tools/ci-coverage-declaration-checker.js` recognizes actual workflow `run:` commands for Node governance, Maven compile, and ruoyi-ui build.
- [local] `tools/verification-provenance-checker.js` accepts `[ci-planned]` as planned CI execution without treating it as passed CI evidence.
- [local] `tests/governance-gates.test.js` covers real workflow command detection, working-directory frontend build detection, echo-only false positives, local Maven evidence, missing CI Maven/frontend claims, `[ci-planned]`, and CR ids containing `ci`.
- [local] Current-CR boundary and component exceptions are scoped to pre-existing RuoYi system/tool baseline findings; no customer runtime or sales-order implementation paths are changed.
- [local] `npm run scan:frontend-routes` produced no JSON diff after the source-tracking fix, confirming the generated route scan already matched the intended RuoYi tool routes.
- [local] The repair does not add or change routes, menus, permissions, API clients, or UI contracts; it only makes already-referenced RuoYi tool route source files present in clean checkout.
- [ci-planned] GitHub Actions workflow includes Node governance with Java/Maven available for `check:runtime`, Maven compile, ruoyi-ui build, and lockfile-free install commands; actual CI result for this fix is determined after push.
