# Session: R-11 Engineering Core Roadmap Rebaseline

## Task

`TASK-0002` - execute governance/rule-change `CR-20260720T115859Z-r-11-engineering-core-roadmap-rebaseline` without business runtime.

## Status

`verified`

## Goal

Separate product, process, option, field, calculation, version, and release semantics; make downstream sales-order work depend on an explicit engineering-core gate; and define the destructive migration from current masterdata.

## Changed Files

- Authoritative `ai/contracts/engineering-core.*` package plus supersession notes for conflicting R-09 concepts.
- R-11 five-role review and rule proposal.
- Business/governance/module roadmaps, phase gates, backlog, rule object, and focused checker/tests.
- Masterdata feature brief, current context, change evidence, and memory/handover.
- `changed-files.json` becomes authoritative after finalization.

## Commands

- [local] `npm run resume`
- [local] guarded `npm run context:build -- customer` failure, then `npm run context:build -- platform`
- [local] `npm run review:feature -- "功能预审：R-11 ..." --feature platform`
- [local] `node --test tests/engineering-core-roadmap.test.js` red then green 5/5
- [local] `npm run rule:preflight -- before-sales-order-phase-gate`
- [local] `npm run check:phase-gate`
- [local] `npm run check:roadmap`
- [local] `npm run check:rule-objects`
- [local] `npm run check:review`
- [local] focused three-file regression 48/48
- [local] `npm run finalize:change -- --summary "R-11 engineering-core roadmap rebaseline"`
- [local] `npm run check` 486/486
- [local] `npm run close:change`
- [local] `git diff --check` and exact scope/ledger audit
- [local] commit `5726bdb8d76cfdd64646ac8fbc16a7cc401d096e` with message `governance: rebaseline engineering core roadmap`
- [local] direct push to `origin/master`
- [ci] `scaffold-ci` run `29745362302` completed `success`; `governance`, `backend-tests`, and `frontend-build` all concluded `success`
- [local] clean-worktree `npm run check:after-push` returned `pass`

## Verification

- [local] Review decision contains `Allow Implementation` limited to governance/contracts and excludes every business runtime root.
- [local] Focused tests prove the aggregate gate dependency, sales-order blocking, roadmap item requirements, requested contract objects, current migration surfaces, both 9CM scenarios, and formula/DXF reverse assertion.
- [local] `engineeringCoreReady` and `beforeSalesOrder` remain blocked.
- [local] Exact audit covers 62 changed files with zero outside/forbidden roots and zero changed-file ledger mismatch.
- [ci] The published R-11 SHA is verified by real GitHub Actions run `29745362302`.
- [not-run] Runtime migration, API/browser/database execution, formula/calculation/DXF runtime, production, sales-order, and signed numeric golden fixtures.

## Risks

- The current R-10 runtime still displays product model as `工艺型号` and uses sales-option/generic CRUD semantics until R-12A executes the breaking cutover.
- Exact golden dimensions/materials/tolerances/results require business sign-off.
- Current hierarchy/reference concurrency protections must not be lost during bounded repository replacement.

## Next Entry Point

Complete and publish only `CR-20260720T131603Z-r-11-post-push-handover-sync`, verify a clean synchronized `master`, then stop. R-12A may start only after a separate explicit request, new change, and approved review. Do not start sales-order runtime.
