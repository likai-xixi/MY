# Handover

## Summary

Current change record: `ai/changes/CR-20260626T004832Z-governance-runtime-verification-boundary`.

R-04 governance/runtime verification boundary clarification documents the split between local governance checks, runtime checker detection, production safety gates, CI jobs, release verification, and manual/runtime acceptance.

The repository remains at the Java Web/RuoYi/customer stage. V2 is still expected to become a Java Web ERP main system plus Windows workstation client plus mobile H5/mini-program, but this change does not implement those runtime surfaces.

## Impact

Current change `CR-20260626T004832Z-governance-runtime-verification-boundary` affects governance documentation, the business-feature module registry description, current-context handoff, task memory, and this change record.

`npm run check` is now documented as governance consistency plus Node structural tests. It is not production readiness, runtime business correctness, database migration safety, browser acceptance, money-flow idempotency, or complete high-risk semantic coverage.

`check:runtime` is documented as detection by default: it does not execute Maven/Vite build commands unless `--execute` is used or policy enables execution. `scaffold-ci` is documented as governance/backend-compile/frontend-build coverage, not manual business acceptance.

No customer runtime code, sales-order runtime code, production safety config, customer fund model code, migration/idempotency registry, database business table structure, package scripts, tools, or tests were modified. `beforeSalesOrder` remains blocked.

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
- [local] `npm run context:build -- customer`
- [local] `npm run check:runtime`
- [local] `npm run check:high-risk-governance`
- [local] `npm test`
- [local] `npm run check`
- [local] `git diff --check`

## Verification

[local] Required R-04 checks are recorded in `ai/changes/CR-20260626T004832Z-governance-runtime-verification-boundary/verification.md`: `npm run check:runtime`, `npm run check:high-risk-governance`, `npm test`, `npm run check`, and `git diff --check`.

[not-run] `npm run verify:release` is intentionally not required for this documentation/governance boundary batch. Plain `mvn` is known to be unavailable on the local PATH; do not claim release verification passed until `npm run verify:release` itself passes.

## Risks

- Governance checks are now documented more honestly, but they still do not replace runtime acceptance.
- High-risk semantic governance remains a framework baseline until executable evidence manifests, idempotency evidence, complete migration coverage, and browser/manual acceptance are added for each high-risk business domain.
- The module registry remains a business-feature ownership registry and does not enumerate every inherited RuoYi platform/system/monitor/tool module.

## Next Actions

- R-05 candidate: salesman candidate hardening.
- R-06 candidate: executable customer migration baseline.
