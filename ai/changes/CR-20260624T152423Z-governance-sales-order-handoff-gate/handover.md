# Handover

## Summary

Current change record: `ai/changes/CR-20260624T152423Z-governance-sales-order-handoff-gate`.

This governance/rule-change batch adds the sales-order-before handoff mechanism. It creates roadmap and phase-gate artifacts, compact current-context generation, multi-role review scaffolding, real checker scripts, package-script wiring, tests, and memory/session documentation.

Follow-up review-gap closure in this same change record hardens the M1/L1 findings: `npm run check` now reaches context-aware `check:review` with `--require-allow`, and `check:phase-gate` blocks sales-order implementation naming variants under real implementation roots.

Push-preflight follow-up fixed a governance checker defect in this same local, unpushed commit: clean-worktree `check:file-weight` no longer crashes with `EISDIR` when historical `changed-files.json` data contains directory entries.

No sales-order module was implemented. No customer-management business code was modified. No database business table structure was changed.

## Impact

The changed surface is governance-only:

- `AGENTS.md` and `README.md` now document `功能讨论`, `功能预审`, `current-context`, `Allow Implementation`, and business/governance separation rules.
- `ai/roadmap/**` defines the governance/business roadmap, `beforeSalesOrder`, deferred items with reasons, known refactor debt, default review approval enforcement, and phase-gate naming-variant coverage.
- `ai/context/**` provides focused feature context and generated current-context files.
- `scripts/context-build.js` generates deterministic current context.
- `scripts/review-feature.js` generates structured non-empty review packages.
- `tools/*checker.js` adds real gates for review, doc size, context pack, read budget, file weight, roadmap, phase gate, and refactor debt. The phase gate recognizes canonical and common sales-order naming variants only under implementation roots. `file-weight-checker` now stats changed paths before reading and checks only real files.
- `scripts/finalize-change.js` prevents generated `changed-files.json` records from containing existing directories, while preserving real file paths and missing deleted-file paths.
- `package.json` wires the new check scripts into `npm run check`, with `check:review` requiring `Allow Implementation` only when the current change touches business implementation paths.
- `tests/governance-sales-order-handoff-gate.test.js` covers package wiring, AGENTS wording, roadmap/debt/gate structure, context idempotency, review-checker failures, context-aware no-harm cases, business implementation review failures and approval, checker execution, sales-order implementation blocking, and naming-variant blocking without blocking governance docs.
- Memory and session files record that future sales-order work must pass `beforeSalesOrder` and multi-role pre-review first.

## Changed Files

See `changed-files.json` for the complete list. Key files include:

- `AGENTS.md`
- `README.md`
- `package.json`
- `docs/multi-role-review-workflow.md`
- `ai/roadmap/**`
- `ai/context/**`
- `ai/rule-proposals/2026-06-24-governance-sales-order-handoff-gate.json`
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
- `memory/PROJECT_STATE.md`
- `memory/HANDOVER.md`
- `memory/CHANGELOG.md`
- `memory/TASKS.json`
- `memory/sessions/2026-06-24-governance-sales-order-handoff-gate.md`

## Commands

- `npm run resume`
- `npm run rule:propose -- governance-sales-order-handoff-gate --reason ...`
- `node --check scripts/context-build.js`
- `node --check scripts/review-feature.js`
- `node --check tools/*.js` for every new checker
- `npm run context:build -- customer`
- `npm run check:roadmap`
- `npm run check:phase-gate`
- `npm run check:refactor-debt`
- `npm run check:context-pack`
- `npm run check:read-budget`
- `npm run check:doc-size`
- `npm run check:file-weight`
- `npm run check:review`
- `node --test tests/governance-sales-order-handoff-gate.test.js`
- `npm run scan:all`
- `npm run finalize:change -- --summary "新增销售订单前治理接手机制"`

## Verification

Pre-final verification passed: syntax checks, targeted governance checkers, targeted 12-test Node test, `scan:all`, `context:build`, and `finalize:change` all passed.

One expected implementation detail was fixed during verification: `check:phase-gate` initially treated governance docs named `sales-order.md` as sales-order implementation. The checker now blocks only real implementation roots such as `ruoyi-business/.../salesorder` and `ruoyi-ui/src/views/sales-order`.

Follow-up M1/L1 verification passed: `npm run check:review` executes context-aware `node tools/review-checker.js --require-allow`, and `npm run check:phase-gate` passes after adding sales-order naming-variant coverage.

Final verification passed:

- `npm run check` passed after M1/L1 hardening, including the new governance gates and 114 Node tests.
- Standalone `npm test` passed with 114 Node tests.
- `git diff --check` passed.
- Forbidden-path audit returned `FORBIDDEN_PATH_AUDIT_OK`.
- Push-preflight EISDIR regression verification passed: `npm run check:file-weight` now passes, and `node --test tests/governance-sales-order-handoff-gate.test.js` passes with 16 tests covering directory entries, missing deleted files, continued real-file checking, and overweight real-file rejection.
- Pre-amend verification after the file-weight fix passed: `npm run context:build -- customer`, `npm run check` with 118 Node tests, standalone `npm test` with 118 Node tests, `git diff --check`, and business implementation path audit.

## Risks

- The `beforeSalesOrder` gate is intentionally still blocked for business implementation until snapshot, state-machine, and fund-boundary contracts are completed.
- `review:feature` creates review packages but does not itself approve implementation; reviewers must intentionally add `Allow Implementation`, and the default full check now fails business implementation changes without an approved review.
- The new gates are governance checks, not runtime proof that future sales-order business behavior is correct.

## Next Actions

- Do not commit or push unless the user explicitly asks.
- Future sales-order implementation must first pass `beforeSalesOrder` and multi-role pre-review.
