# Verification

Status: [local] verified for CR-2 governance/ci scope.

## Commands

- [local] `npm run resume` - passed during startup and confirmed active P0 baseline before this CR was created.
- [local] `npm run start:change -- --mode rule-change "ci backend frontend governance checks"` - passed and created this CR.
- [local] `npm run context:build -- customer` - passed and regenerated `ai/context/current-context.*` for this CR.
- [local] `node --test tests/governance-gates.test.js` - passed with 15 tests during implementation.
- [local] `npm run finalize:change -- --summary "CI backend frontend governance checks" ...` - passed and refreshed `changed-files.json`.
- [local] `npm test` - passed with 137 Node tests after adding scoped current-CR boundary/component exceptions and regenerating current context.
- [local] `npm run check:ci-coverage-declaration` - passed with no Maven/frontend missing warnings.
- [local] `npm run check:verification-provenance` - passed.
- [local] `npm run check` - passed with 137 Node tests; `check:config-safety` retained existing development/default configuration warnings only.
- [local] `mvn -pl ruoyi-admin -am -DskipTests compile` - passed with `BUILD SUCCESS` using the Maven path configured in `ai/rules/runtime-policy.json`.
- [local] `npm --prefix ruoyi-ui run build:prod` - passed; Vite transformed 2546 modules and built successfully.
- [local] `git diff --check` - passed.
- [local] forbidden-path audit - passed with `FORBIDDEN_PATH_AUDIT_OK`.

## Evidence

- [local] `.github/workflows/ci.yml` now defines `governance`, `backend-compile`, and `frontend-build` jobs with real commands, not echo-only placeholders.
- [local] `tools/ci-coverage-declaration-checker.js` recognizes actual workflow `run:` commands for Node governance, Maven compile, and ruoyi-ui build.
- [local] `tools/verification-provenance-checker.js` accepts `[ci-planned]` as planned CI execution without treating it as passed CI evidence.
- [local] `tests/governance-gates.test.js` covers real workflow command detection, working-directory frontend build detection, echo-only false positives, local Maven evidence, missing CI Maven/frontend claims, `[ci-planned]`, and CR ids containing `ci`.
- [local] Current-CR boundary and component exceptions are scoped to pre-existing RuoYi system/tool baseline findings; no customer runtime or sales-order implementation paths are changed.
- [ci-planned] GitHub Actions workflow includes Node governance, Maven compile, and ruoyi-ui build; actual CI result is determined after push.
