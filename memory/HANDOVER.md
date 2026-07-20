# Handover

## Summary

[local] Current evidence-only change `CR-20260720T131603Z-r-11-post-push-handover-sync` records the completed publication of `CR-20260720T115859Z-r-11-engineering-core-roadmap-rebaseline` without touching business runtime. The authoritative package remains `ai/contracts/engineering-core.*`.

Product model and process plan/version are separate. Sales-option category/value is replaced in the target design by option-set/option-value. Field definitions have one `SALES`/`TECH`/`SYSTEM` owner and schemes have immutable versions. Calculation uses canonical input plus generic decomposition nodes. The trace chain is `OrderVersion -> TechnicalVersion -> CalculationSnapshot -> TechnicalReleasePackage -> ProductionReleaseVersion`.

## Review And Gate

- Review: `RV-20260720T120106Z-r-11-engineering-core-roadmap-rebaseline`.
- Decision: `Allow Implementation`, limited to R-11 governance/contract roots; business runtime is not approved.
- `engineeringCoreReady`: `blocked`.
- `engineering-core-ready`: incomplete.
- `beforeSalesOrder`: `blocked` and now requires `engineering-core-ready`.

## Published Evidence

- [local] R-11 commit `5726bdb8d76cfdd64646ac8fbc16a7cc401d096e`: `governance: rebaseline engineering core roadmap`.
- [local] Direct push to `origin/master` succeeded.
- [ci] GitHub Actions workflow `scaffold-ci`, run `29745362302`, completed with overall `success` for head SHA `5726bdb8d76cfdd64646ac8fbc16a7cc401d096e`.
- [ci] `governance` job `88361869178`: `success`.
- [ci] `backend-tests` job `88361869291`: `success`; this is the current workflow's backend Maven verification job.
- [ci] `frontend-build` job `88361869182`: `success`.
- [local] Clean-worktree `npm run check:after-push`: `pass`.

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

- `ai/changes/CR-20260720T115859Z-r-11-engineering-core-roadmap-rebaseline/handover.md`
- `ai/changes/CR-20260720T115859Z-r-11-engineering-core-roadmap-rebaseline/verification.md`
- `ai/changes/CR-20260720T131603Z-r-11-post-push-handover-sync/changed-files.json`
- `ai/changes/CR-20260720T131603Z-r-11-post-push-handover-sync/handover.md`
- `ai/changes/CR-20260720T131603Z-r-11-post-push-handover-sync/impact.json`
- `ai/changes/CR-20260720T131603Z-r-11-post-push-handover-sync/plan.md`
- `ai/changes/CR-20260720T131603Z-r-11-post-push-handover-sync/request.md`
- `ai/changes/CR-20260720T131603Z-r-11-post-push-handover-sync/verification.md`
- `ai/changes/CURRENT_CHANGE.json`
- `ai/context/current-context.json`
- `ai/context/current-context.md`
- `memory/CHANGELOG.md`
- `memory/HANDOVER.md`
- `memory/PROJECT_STATE.md`
- `memory/TASKS.json`
- `memory/sessions/2026-07-20-r-11-engineering-core-roadmap-rebaseline.md`

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
- [local] R-11 commit and direct push to `origin/master`
- [ci] `gh run view 29745362302` confirmed the real successful workflow and all three job conclusions
- [local] clean-worktree `npm run check:after-push` passed
- [local] evidence-only sync full check 486/486, closeout, diff, and exact 16-file governance-only audit passed

## Verification

- [local] Contracts, review, gate dependency, blocker status, rule ownership, and focused tests are verified.
- [local] Full governance/regression check passes 486/486; exact scope audit reports 62 changed files, zero outside/forbidden roots, and zero ledger mismatch.
- [ci] Published R-11 SHA `5726bdb8d76cfdd64646ac8fbc16a7cc401d096e` passed `scaffold-ci` run `29745362302`; governance, backend-tests, and frontend-build all succeeded.
- [local] `CR-20260720T131603Z-r-11-post-push-handover-sync` passes the full governance gate with zero forbidden/runtime path changes.
- [not-run] Java/Vue/SQL/API/browser/database, formula, calculation engine, DXF, production, sales-order, runtime migration, and signed golden execution.
- [not-run] No release deployment or business runtime rollout was requested or performed.

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

- Finish and publish only the evidence sync `CR-20260720T131603Z-r-11-post-push-handover-sync`, prove local/remote alignment and a clean worktree, then stop. R-12A requires a separate explicit request, new change, and approved review. Do not start sales-order runtime.
