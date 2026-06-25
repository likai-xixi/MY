# Handover

## Summary

Current change record: `ai/changes/CR-20260624T152423Z-governance-sales-order-handoff-gate`.

This is a governance/rule-change batch for the sales-order-before handoff mechanism. It does not implement sales order, does not modify customer-management business code, and does not change database business table structure.

The follow-up M1/L1 review gaps are closed inside the same change record: `npm run check` now reaches context-aware `check:review` with `--require-allow`, and `check:phase-gate` blocks canonical plus common sales-order naming variants under real implementation roots without blocking governance docs.

The push-preflight `check:file-weight` EISDIR defect is also fixed inside the same local, unpushed governance commit: directory entries in historical `changed-files.json` data are no longer read as files, and future `finalize:change` output filters existing directories out of `changed-files.json`.

Future sales-order work must pass `beforeSalesOrder` and multi-role pre-review before creating any sales-order controller, service, mapper, Vue page, API client, SQL table, route, or permission.

## Impact

Governance-only surfaces changed:

- Current-context generation: `scripts/context-build.js`, `ai/context/current-context.*`, and `ai/context/features/*.md`.
- Review precheck: `docs/multi-role-review-workflow.md`, `scripts/review-feature.js`, `tools/review-checker.js`, and `package.json` default context-aware `check:review --require-allow` wiring.
- Roadmap/gates/debt: `ai/roadmap/**`, `tools/roadmap-checker.js`, `tools/phase-gate-checker.js`, and `tools/refactor-debt-checker.js`; phase-gate matching covers `sales-order`, `salesOrder`, `sales_order`, and `sales/order` implementation naming variants.
- Context/document/file-weight gates: `tools/doc-size-checker.js`, `tools/context-pack-checker.js`, `tools/read-budget-checker.js`, and `tools/file-weight-checker.js`.
- Finalize changed-file hygiene: `scripts/finalize-change.js` now keeps generated `changed-files.json` file-oriented by excluding existing directories.
- Package and instruction wiring: `package.json`, `AGENTS.md`, `README.md`.
- Regression coverage: `tests/governance-sales-order-handoff-gate.test.js`, including file-weight directory, deleted-file, and overweight-real-file cases.

Customer business code and sales-order implementation roots are untouched by design.

## Changed Files

- See `ai/changes/CR-20260624T152423Z-governance-sales-order-handoff-gate/changed-files.json`.
- Key surfaces: `AGENTS.md`, `README.md`, `package.json`, `ai/roadmap/**`, `ai/context/**`, `scripts/context-build.js`, `scripts/review-feature.js`, `tools/*checker.js`, `tests/governance-sales-order-handoff-gate.test.js`, and memory handoff files.

## Commands

- `npm run resume`
- `npm run scan:all`
- `npm run context:build -- customer`
- `npm run finalize:change -- --summary "新增销售订单前治理接手机制"`
- `npm run check:review`
- `npm run check:phase-gate`
- `npm run check`
- `npm test`
- `git diff --check`
- Push-preflight EISDIR fix: `npm run check:file-weight`

## Verification

Passed before final gate:

- `npm run resume`
- `npm run context:build -- customer`
- `npm run check:roadmap`
- `npm run check:phase-gate`
- `npm run check:refactor-debt`
- `npm run check:context-pack`
- `npm run check:read-budget`
- `npm run check:doc-size`
- `npm run check:file-weight`
- `npm run check:review`
- `node --test tests/governance-sales-order-handoff-gate.test.js` with 12 tests after M1/L1 hardening
- `npm run scan:all`
- `npm run finalize:change -- --summary "新增销售订单前治理接手机制"`

Final verification passed:

- `npm run check` passed after M1/L1 hardening, including the new governance gates and 114 Node tests.
- Standalone `npm test` passed with 114 Node tests.
- `git diff --check` passed.
- Forbidden-path audit returned `FORBIDDEN_PATH_AUDIT_OK`.
- Push-preflight EISDIR regression passed: `npm run check:file-weight` passed, and `node --test tests/governance-sales-order-handoff-gate.test.js` passed with 16 tests after adding file-weight changed-files coverage.
- Pre-amend verification after the file-weight fix passed: `npm run context:build -- customer`, `npm run check` with 118 Node tests, standalone `npm test` with 118 Node tests, `git diff --check`, and business implementation path audit.

## Risks

- `beforeSalesOrder` is not ready for business implementation because snapshot, state-machine, and fund-boundary contracts remain required.
- Governance checks do not replace future runtime/API/UI acceptance tests for sales order.
- Do not bulk-read all historical `ai/changes`, `ai/reviews`, feature files, or source code in a new window; start with `ai/context/current-context.md`.

## Next Actions

- Keep this batch uncommitted/unpushed unless the user explicitly asks to publish it.
- Future sales-order implementation must first pass `beforeSalesOrder` and multi-role pre-review.
