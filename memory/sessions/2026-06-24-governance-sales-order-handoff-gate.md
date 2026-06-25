# Session: Governance Sales-Order Handoff Gate

## Task

`TASK-0002 / platform` - Implement `CR-20260624T152423Z-governance-sales-order-handoff-gate` as a governance/rule-change batch for the sales-order-before handoff mechanism.

## Status

`verified` - Governance artifacts, scripts, tools, package wiring, tests, memory, `scan:all`, `context:build`, `finalize:change`, `npm run check`, standalone `npm test`, and `git diff --check` passed. Follow-up M1/L1 review gaps were closed inside this same change record. Push-preflight `check:file-weight` EISDIR regression was fixed in the same local, unpushed commit.

## Goal

Create a bounded sales-order-before handoff mechanism without implementing sales order, touching customer-management business code, or changing database business table structure.

## Changed Files

- `AGENTS.md`
- `README.md`
- `package.json`
- `docs/multi-role-review-workflow.md`
- `ai/roadmap/**`
- `ai/context/**`
- `scripts/context-build.js`
- `scripts/finalize-change.js`
- `scripts/review-feature.js`
- `tools/doc-size-checker.js`
- `tools/context-pack-checker.js`
- `tools/read-budget-checker.js`
- `tools/file-weight-checker.js`
- `tools/roadmap-checker.js`
- `tools/phase-gate-checker.js`
- `tools/refactor-debt-checker.js`
- `tools/review-checker.js`
- `tests/governance-sales-order-handoff-gate.test.js`
- `memory/HANDOVER.md`
- `memory/PROJECT_STATE.md`
- `memory/TASKS.json`
- `memory/CHANGELOG.md`

## Commands

- `npm run resume`
- `npm run rule:propose -- governance-sales-order-handoff-gate --reason ...`
- `npm run context:build -- customer`
- `npm run scan:all`
- `npm run finalize:change -- --summary "..."`
- `node --test tests/governance-sales-order-handoff-gate.test.js`
- `npm run check:review`
- `npm run check:phase-gate`
- `npm run check:file-weight`
- `npm run check`
- `npm test`
- `git diff --check`

## Verification

Targeted syntax checks for new scripts/tools passed. New checker commands passed after narrowing `phase-gate-checker` to real sales-order implementation roots. Follow-up hardening changed default `check:review` to require `Allow Implementation` context-aware only for business implementation paths and expanded phase-gate sales-order implementation matching to common naming variants under implementation roots. `node --test tests/governance-sales-order-handoff-gate.test.js` passed with 12 tests. `npm run check:review` and `npm run check:phase-gate` passed. `npm run scan:all`, `npm run context:build -- customer`, and `npm run finalize:change -- --summary "..."` passed. Final `npm run check` passed with 114 Node tests, standalone `npm test` passed with 114 Node tests, `git diff --check` passed, and forbidden-path audit returned `FORBIDDEN_PATH_AUDIT_OK`.

Push-preflight follow-up: `npm run check` initially failed at `check:file-weight` because clean-worktree fallback read `changed-files.json`, which still contained directory entries (`ai/context`, `ai/roadmap`, `ai/rule-proposals`, `docs`, `memory/sessions`). `tools/file-weight-checker.js` now stats paths before reading, skips directories and missing deleted files safely, and still detects overweight real files. `scripts/finalize-change.js` now filters existing directories out of generated `changed-files.json`. `node --test tests/governance-sales-order-handoff-gate.test.js` passed with 16 tests, and `npm run check:file-weight` passed after the fix.

Pre-amend verification after the file-weight fix passed: `npm run context:build -- customer`, `npm run check` with 118 Node tests, standalone `npm test` with 118 Node tests, `git diff --check`, and business implementation path audit.

## Risks

- `beforeSalesOrder` intentionally remains blocked for business implementation until snapshot, state-machine, and fund-boundary contracts are complete.
- Governance gates do not replace future runtime API/UI/DB validation for sales order.
- Review generation does not approve implementation; reviewers must intentionally add `Allow Implementation`, and default `npm run check` now fails business implementation changes without an approved review.

## Next Entry Point

Run `npm run resume`, read `ai/context/current-context.md`, read `memory/HANDOVER.md`, and keep this governance batch unpushed unless the user explicitly asks. Future sales-order implementation must first pass `beforeSalesOrder` and multi-role pre-review.
