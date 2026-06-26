# Handover

## Summary

R-04 governance/runtime verification boundary clarification documents what the repository's local governance gate, runtime checker, production safety checks, CI scaffold, release verification entry, and manual/runtime acceptance do and do not prove.

## Impact

This change adds `docs/runtime-verification-boundary.md`, tightens README/production/high-risk documentation, updates the business-feature module registry description, regenerates current context for the active R-04 change, and syncs memory/handover/task/changelog files.

It does not change the semantics of `npm run check`, does not weaken any gate, and does not remove Maven/Vite/production safety/release verification expectations.

No customer runtime code, sales-order runtime code, production safety config, customer fund model, migration/idempotency registry, database business table structure, package scripts, tools, or tests were modified.

## Changed Files

- `README.md`
- `docs/high-risk-semantic-governance.md`
- `docs/runtime-verification-boundary.md`
- `docs/production-readiness.md`
- `ai/registry/modules.json`
- `ai/context/current-context.md`
- `ai/context/current-context.json`
- `memory/HANDOVER.md`
- `memory/PROJECT_STATE.md`
- `memory/CHANGELOG.md`
- `memory/TASKS.json`
- `ai/changes/CR-20260626T004832Z-governance-runtime-verification-boundary/*`
- `ai/changes/CURRENT_CHANGE.json`

## Commands

- [local] `npm run resume`
- [local] `npm run start:change -- --mode rule-change governance-runtime-verification-boundary`
- [local] `npm run context:build -- customer`
- [local] `npm run check:runtime`
- [local] `npm run check:high-risk-governance`
- [local] `npm test`
- [local] `npm run check`
- [local] `git diff --check`

## Verification

[local] `npm run check:runtime`, `npm run check:high-risk-governance`, final `npm test` with 185/185 Node tests, `npm run check`, and `git diff --check` passed.

[local] The first full `npm test` attempt timed out and the next run exposed current-CR governance record gaps. Those were fixed by adding scoped RuoYi baseline exception notes, regenerating current context, and updating handover verification wording; no tools/tests/business runtime files were changed.

[not-run] `npm run verify:release` was not run for this R-04 batch. Plain `mvn` is known to be unavailable on this local PATH, and release verification must not be claimed as passed until `npm run verify:release` itself passes.

## Risks

- This change clarifies verification boundaries; it does not add Java/Spring service tests, MySQL migration tests, MySQL row-lock/concurrency tests, browser smoke tests, or manual business acceptance.
- CR-3 high-risk governance remains a framework baseline, not complete executable evidence for every high-risk business domain.
- `ai/registry/modules.json` remains a business-feature ownership registry, not a complete inherited RuoYi platform/system/monitor/tool module catalog.

## Next Actions

- R-05 candidate: salesman candidate hardening.
- R-06 candidate: executable customer migration baseline.
