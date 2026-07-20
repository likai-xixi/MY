# Handover

## Summary

[local] Current change `CR-20260720T115859Z-r-11-engineering-core-roadmap-rebaseline` replaces the future architecture vocabulary without touching business runtime. The authoritative package is `ai/contracts/engineering-core.*`.

Product model and process plan/version are separate. Sales-option category/value is replaced in the target design by option-set/option-value. Field definitions have one `SALES`/`TECH`/`SYSTEM` owner and schemes have immutable versions. Calculation uses canonical input plus generic decomposition nodes. The trace chain is `OrderVersion -> TechnicalVersion -> CalculationSnapshot -> TechnicalReleasePackage -> ProductionReleaseVersion`.

## Review And Gate

- Review: `RV-20260720T120106Z-r-11-engineering-core-roadmap-rebaseline`.
- Decision: `Allow Implementation`, limited to R-11 governance/contract roots; business runtime is not approved.
- `engineeringCoreReady`: `blocked`.
- `engineering-core-ready`: incomplete.
- `beforeSalesOrder`: `blocked` and now requires `engineering-core-ready`.

## Migration And Golden Baseline

- The target migration is breaking: no old table/API/resource-key/label/data compatibility, alias, dual write, or mixed old/new runtime.
- The current nine masterdata tables, generic controller/DTO/mapper/API, four grouped pages, and exact-nine tests have explicit target decisions in `engineering-core.migration-plan.md`.
- First samples: `GS-9CM-SINGLE-001` (9CM 标准单开) and `GS-9CM-DOUBLE-GRID-SPLICE-001` (9CM 对开/分格拼接).
- Both share `PM-DOOR-9CM` and use different process plans.
- Numeric truth and executable fixtures remain `[not-run]` pending business sign-off.

## Impact

- Contracts and feature brief.
- R-11 review, change record, and rule proposal.
- Business/governance/module roadmaps, phase gate, backlog, and phase-gate rule object.
- Phase/roadmap checkers and focused governance tests.
- Current context, project state, tasks, changelog, session, and handover.
- No runtime graph update because no API, screen, route, permission, or database runtime changed.

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

## Commands

- [local] `npm run resume`
- [local] `npm run context:build -- platform`
- [local] R-11 review creation and `npm run check:review`
- [local] focused test red then green 5/5
- [local] explicit rule preflight
- [local] phase-gate, roadmap, and rule-object checks
- [local] focused three-file regression 48/48
- [local] full `npm run check` 486/486
- [local] finalization, closeout, `git diff --check`, and exact scope/ledger audit

## Verification

- [local] Contracts, review, gate dependency, blocker status, rule ownership, and focused tests are verified.
- [local] Full governance/regression check passes 486/486; exact scope audit reports 62 changed files, zero outside/forbidden roots, and zero ledger mismatch.
- [not-run] Java/Vue/SQL/API/browser/database, formula, calculation engine, DXF, production, sales-order, runtime migration, and signed golden execution.
- [not-run] No commit, push, release, or deployment was requested or performed.

## Traceability

| Contract | Runtime implementation | API/UI/graph state |
| --- | --- | --- |
| Product model/process plan | [not-run] R-12A/R-12C | No runtime or graph change |
| Option set/value | [not-run] R-12A | Current sales-option runtime remains until destructive cutover |
| Field/process versions | [not-run] R-12B/R-12C | Contract/backlog only |
| Calculation/release chain | [not-run] R-12D/R-12E | Contract/gate only |

## Risks

- Current R-10 runtime still contains the semantics R-11 plans to replace; this is why `engineering-core-ready` remains blocked.
- Preserve current masterdata hierarchy/reference/concurrency proofs during migration.

## Next Actions

- Finish R-11 evidence only, then stop. R-12A requires a new change and a review already committed at its base revision. Do not start sales-order runtime.
