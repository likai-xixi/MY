# Plan

Mode: `rule-change`
Feature: `platform`

1. Create a separate R-04 timestamp change record with allowed and forbidden edit roots.
2. Add `docs/runtime-verification-boundary.md` with the local governance, runtime checker, production safety, CI, release verification, and runtime acceptance split.
3. Update README, production readiness docs, and high-risk semantic governance docs without changing any gate semantics.
4. Update `ai/registry/modules.json` description so it is clearly a business-feature ownership registry, not a complete inherited RuoYi module list.
5. Sync `memory/HANDOVER.md`, `memory/PROJECT_STATE.md`, `memory/TASKS.json`, `memory/CHANGELOG.md`, and current context to the R-04 boundary.
6. Record verification evidence without running `npm run verify:release` for this batch; this change does not modify the release script and local plain `mvn` is known to be unavailable.
7. Run the required verification commands: `npm run resume`, `npm run check:runtime`, `npm run check:high-risk-governance`, `npm test`, `npm run check`, and `git diff --check`.
