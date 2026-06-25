# Verification

Status: verified

## Commands

- `npm run resume`
- `node --check scripts/context-build.js`
- `node --check scripts/review-feature.js`
- `node --check tools/roadmap-checker.js`
- `node --check tools/phase-gate-checker.js`
- `node --check tools/refactor-debt-checker.js`
- `node --check tools/context-pack-checker.js`
- `node --check tools/read-budget-checker.js`
- `node --check tools/doc-size-checker.js`
- `node --check tools/file-weight-checker.js`
- `node --check tools/review-checker.js`
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
- `npm run check`
- `npm test`
- `git diff --check`
- forbidden-path audit over `git diff --name-only` plus untracked files

## Evidence

- `npm run resume` passed and reported current change context before edits.
- The governance change record was created first as `CR-20260624T152423Z-governance-sales-order-handoff-gate`.
- `npm run rule:propose -- governance-sales-order-handoff-gate ...` passed and created `ai/rule-proposals/2026-06-24-governance-sales-order-handoff-gate.json`.
- All new `scripts/*` and `tools/*` files listed above passed `node --check`.
- `npm run context:build -- customer` passed and generated `ai/context/current-context.md` plus `ai/context/current-context.json`.
- The first `npm run check:phase-gate` run failed because governance documentation paths containing `sales-order` were incorrectly treated as sales-order implementation; `tools/phase-gate-checker.js` was fixed to only block real implementation roots, and the rerun passed.
- `npm run check:roadmap`, `check:phase-gate`, `check:refactor-debt`, `check:context-pack`, `check:read-budget`, `check:doc-size`, `check:file-weight`, and `check:review` all passed after the fix.
- `node --test tests/governance-sales-order-handoff-gate.test.js` passed with 7 tests.
- Follow-up M1 gap closure: `package.json` wires `check:review` to `node tools/review-checker.js --require-allow`, and `tools/review-checker.js` now applies that requirement context-aware: governance/rule-change, docs-only, context-only, review-only, and memory-only changes are not forced to include `Allow Implementation` when no business implementation path changed.
- Follow-up L1 gap closure: `tools/phase-gate-checker.js` now detects sales-order implementation attempts under real implementation roots using normalized naming variants such as `sales-order`, `salesOrder`, `sales_order`, and `sales/order`, while continuing not to block governance docs like `ai/roadmap/module-evolution/sales-order.md`.
- `node --check tools/phase-gate-checker.js` passed after the naming-variant hardening.
- `node --check tools/review-checker.js` passed after the default package-script hardening.
- `npm run check:review` passed and executed the context-aware `node tools/review-checker.js --require-allow`.
- `npm run check:phase-gate` passed after the sales-order implementation matcher hardening.
- `node --test tests/governance-sales-order-handoff-gate.test.js` passed with 12 tests after adding context-aware M1 coverage and L1 naming-variant coverage.
- `npm run scan:all` passed across backend routes, frontend routes, API clients, DB schema, permissions, components, and ownership sync.
- `npm run finalize:change -- --summary "新增销售订单前治理接手机制"` passed.
- Follow-up `npm run scan:all` passed after M1/L1 hardening.
- Follow-up forbidden-path audit returned `FORBIDDEN_PATH_AUDIT_OK`.
- `npm run check` passed after M1/L1 hardening, including context-aware `check:review --require-allow`, `check:phase-gate`, and 114 Node tests.
- Standalone `npm test` passed with 114 Node tests.
- `git diff --check` passed.
- No customer-management business path was intentionally edited.
- No sales-order implementation path was intentionally added.
- No database business table structure was changed.
- Push preflight on 2026-06-25 exposed a real governance checker defect: after the local commit, clean-worktree `check:file-weight` fell back to `changed-files.json`, tried to read directory entries such as `ai/context`, `ai/roadmap`, `ai/rule-proposals`, `docs`, and `memory/sessions`, and failed with `EISDIR`.
- `tools/file-weight-checker.js` now stats each changed path before reading, skips missing deleted paths, reports invalid/non-regular paths clearly, and skips directory entries without crashing.
- `scripts/finalize-change.js` now filters existing directory paths out of generated `changed-files.json`, preventing future finalize runs from writing directory entries.
- `changed-files.json` was corrected to remove existing directory entries and include the real governance file `scripts/finalize-change.js`.
- `node --test tests/governance-sales-order-handoff-gate.test.js` passed with 16 tests after adding file-weight directory/deleted/overweight regression coverage.
- `npm run check:file-weight` passed after the EISDIR fix.
- `npm run context:build -- customer` passed after expanding `impact.allowedEditRoots` for `scripts/finalize-change.js` and refreshed `ai/context/current-context.*`.
- Pre-amend `npm run check` passed after the EISDIR fix, including `check:file-weight`, `check:change`, and 118 Node tests.
- Pre-amend standalone `npm test` passed with 118 Node tests.
- Pre-amend `git diff --check` passed.
- Pre-amend business implementation path audit returned `BUSINESS_IMPL_AUDIT_OK`.
