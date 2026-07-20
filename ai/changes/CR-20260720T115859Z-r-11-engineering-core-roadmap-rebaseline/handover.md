# Handover

## Summary

[local] R-11 rebaselines the engineering-core architecture and governance without business runtime. Product model, process plan/version, option sets/values, field ownership/scheme versions, canonical calculation I/O, immutable version/release artifacts, destructive migration, and the first two 9CM golden scenarios now have one authoritative contract package.

## Impact

- Replaces conflicting future-state R-09 concepts with the authoritative `engineering-core.*` contract package.
- Adds an aggregate blocked `engineeringCoreReady` gate and makes `beforeSalesOrder` require incomplete `engineering-core-ready`.
- Updates the phase/roadmap checkers, phase-gate rule object, business/governance/module roadmaps, focused tests, feature brief, and resumable evidence.
- Changes no runtime API, UI, graph, route, permission, database, Java, Vue, SQL, formula, DXF, sales-order, or production surface.

## Decision

Review `RV-20260720T120106Z-r-11-engineering-core-roadmap-rebaseline` contains `Decision: Allow Implementation`, limited to governance/contract roots. It does not approve Java, Vue, SQL, API, route, permission, database, sales-order, production, formula, calculation-engine, or DXF runtime.

## Gate State

- `engineeringCoreReady`: `blocked`.
- `engineering-core-ready`: `required`/incomplete.
- `beforeSalesOrder`: `blocked` and now requires `engineering-core-ready`.
- R-11 is contract-ready only.

## Traceability

| Future contract | Backend/runtime | API/catalog | Frontend/UI | Registry/graph |
| --- | --- | --- | --- | --- |
| Product model vs process plan | [not-run] R-12A/R-12C bounded repositories | [not-run] explicit catalog/process commands | [not-run] separate product/process pages | Rule object/roadmap updated; runtime graph unchanged |
| Option set/value | [not-run] replaces sales-option generic resource | [not-run] bounded option APIs | [not-run] option catalog | Runtime feature/API/UI graph unchanged |
| Field scheme versions | [not-run] R-12B | [not-run] draft/publish commands | [not-run] owner-aware field workspace | Backlog and contracts only |
| Calculation and releases | [not-run] R-12D/R-12E | [not-run] calculate/approve/release commands | [not-run] technical/release workspaces | Phase gate and rule object updated; no runtime graph |

## Changed Files

- `ai/changes/CR-20260720T115859Z-r-11-engineering-core-roadmap-rebaseline/changed-files.json`
- `ai/changes/CR-20260720T115859Z-r-11-engineering-core-roadmap-rebaseline/handover.md`
- `ai/changes/CR-20260720T115859Z-r-11-engineering-core-roadmap-rebaseline/impact.json`
- `ai/changes/CR-20260720T115859Z-r-11-engineering-core-roadmap-rebaseline/plan.md`
- `ai/changes/CR-20260720T115859Z-r-11-engineering-core-roadmap-rebaseline/request.md`
- `ai/changes/CR-20260720T115859Z-r-11-engineering-core-roadmap-rebaseline/rule-preflight.md`
- `ai/changes/CR-20260720T115859Z-r-11-engineering-core-roadmap-rebaseline/verification.md`
- `ai/changes/CURRENT_CHANGE.json`
- `ai/context/current-context.json`
- `ai/context/current-context.md`
- `ai/contracts/engineering-core.calculation-io.md`
- `ai/contracts/engineering-core.contract-test-matrix.md`
- `ai/contracts/engineering-core.domain.md`
- `ai/contracts/engineering-core.golden-samples.md`
- `ai/contracts/engineering-core.index.md`
- `ai/contracts/engineering-core.migration-plan.md`
- `ai/contracts/engineering-core.version-release.md`
- `ai/contracts/masterdata.contract-test-matrix.md`
- `ai/contracts/masterdata.field-library.md`
- `ai/contracts/masterdata.migration-plan.md`
- `ai/contracts/masterdata.option-schema.md`
- `ai/contracts/masterdata.process.md`
- `ai/contracts/masterdata.product.md`
- `ai/contracts/masterdata.sales-option.md`
- `ai/contracts/masterdata.snapshot-versioning.md`
- `ai/contracts/rule.formula-group.md`
- `ai/contracts/rule.formula-variable.md`
- `ai/contracts/rule.glass-rule.md`
- `ai/contracts/rule.offset-rule.md`
- `ai/contracts/rule.process-calculation.md`
- `ai/contracts/tech-review.boundary.md`
- `ai/contracts/tech.calculation-snapshot.md`
- `ai/contracts/tech.decomposition-template.md`
- `ai/contracts/tech.part-template.md`
- `ai/registry/rule-objects.json`
- `ai/reviews/RV-20260720T120106Z-r-11-engineering-core-roadmap-rebaseline/architecture-review.md`
- `ai/reviews/RV-20260720T120106Z-r-11-engineering-core-roadmap-rebaseline/backend-review.md`
- `ai/reviews/RV-20260720T120106Z-r-11-engineering-core-roadmap-rebaseline/context.md`
- `ai/reviews/RV-20260720T120106Z-r-11-engineering-core-roadmap-rebaseline/decision.md`
- `ai/reviews/RV-20260720T120106Z-r-11-engineering-core-roadmap-rebaseline/frontend-review.md`
- `ai/reviews/RV-20260720T120106Z-r-11-engineering-core-roadmap-rebaseline/product-review.md`
- `ai/reviews/RV-20260720T120106Z-r-11-engineering-core-roadmap-rebaseline/qa-review.md`
- `ai/reviews/RV-20260720T120106Z-r-11-engineering-core-roadmap-rebaseline/request.md`
- `ai/reviews/RV-20260720T120106Z-r-11-engineering-core-roadmap-rebaseline/review.json`
- `ai/reviews/RV-20260720T120106Z-r-11-engineering-core-roadmap-rebaseline/risk-register.md`
- `ai/roadmap/BUSINESS_ROADMAP.md`
- `ai/roadmap/GOVERNANCE_ROADMAP.md`
- `ai/roadmap/enhancement-backlog.json`
- `ai/roadmap/module-evolution/engineering-core.md`
- `ai/roadmap/module-evolution/production.md`
- `ai/roadmap/module-evolution/sales-order.md`
- `ai/roadmap/phase-gates.json`
- `ai/rule-proposals/2026-07-20-r-11-engineering-core-roadmap-rebaseline.json`
- `features/masterdata.md`
- `memory/CHANGELOG.md`
- `memory/HANDOVER.md`
- `memory/PROJECT_STATE.md`
- `memory/TASKS.json`
- `memory/sessions/2026-07-20-r-11-engineering-core-roadmap-rebaseline.md`
- `tests/engineering-core-roadmap.test.js`
- `tools/phase-gate-checker.js`
- `tools/roadmap-checker.js`

## Verification

- [local] Focused R-11 tests pass 5/5.
- [local] Phase-gate, roadmap, rule-object, review, and rule-preflight checks pass.
- [local] Focused three-file regression passes 48/48 and full `npm run check` passes 486/486.
- [local] Finalization, closeout, `git diff --check`, and exact scope audit pass; 62 changed files, zero outside/forbidden roots, and zero changed-file ledger mismatch.
- [not-run] Runtime migration and signed golden execution are deferred.

## Commands

- [local] `npm run resume`
- [local] `npm run context:build -- platform`
- [local] `node --test tests/engineering-core-roadmap.test.js`
- [local] focused three-file Node test bundle
- [local] `npm run rule:preflight -- before-sales-order-phase-gate`
- [local] phase-gate, roadmap, rule-object, and review checks
- [local] `npm run finalize:change -- --summary "R-11 engineering-core roadmap rebaseline"`
- [local] `npm run check` (486/486)
- [local] `npm run close:change`
- [local] `git diff --check`
- [local] exact allowed/forbidden root and changed-file ledger audit

## Published Evidence

- [local] Commit `5726bdb8d76cfdd64646ac8fbc16a7cc401d096e`: `governance: rebaseline engineering core roadmap`.
- [local] Direct push to `origin/master` succeeded.
- [ci] GitHub Actions workflow `scaffold-ci`, run `29745362302`, head SHA `5726bdb8d76cfdd64646ac8fbc16a7cc401d096e`, overall conclusion `success`.
- [ci] `governance` job `88361869178`: `success`.
- [ci] `backend-tests` job `88361869291`: `success`; this is the current workflow's backend Maven verification job.
- [ci] `frontend-build` job `88361869182`: `success`.
- [local] Clean-worktree `npm run check:after-push`: `pass`.
- [local] Publication evidence synchronized by `CR-20260720T131603Z-r-11-post-push-handover-sync`.

## Risks

- Current R-10 runtime still uses the old product-model display alias, sales-option resources, and generic CRUD until R-12A executes the destructive cutover.
- Numerical golden truth still requires business sign-off.
- Later migration must preserve current hierarchy/reference/concurrency protections.

## Next Actions

R-11 is published and its real CI evidence is synchronized. Stop here. R-12A may start only after a separate explicit request, new change record, and approved review at that change's base revision. Do not start sales-order runtime.
