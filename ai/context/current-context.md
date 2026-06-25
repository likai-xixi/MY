# Current Context

Current feature: `customer`
Current change: `CR-20260624T152423Z-governance-sales-order-handoff-gate`
Repository: RuoYi + Vue3 + Codex Auto Dev OS
Profile: adapter `ruoyi`, locked `true`

## Allowed Edit Roots

- `AGENTS.md`
- `README.md`
- `package.json`
- `docs`
- `ai/roadmap`
- `ai/context`
- `ai/reviews`
- `ai/changes`
- `ai/rule-proposals`
- `memory/PROJECT_STATE.md`
- `memory/HANDOVER.md`
- `memory/CHANGELOG.md`
- `memory/TASKS.json`
- `memory/sessions`
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
- `tests`

## Forbidden Edit Roots

- `ruoyi-business/src/main/java/com/ruoyi/business/customer`
- `ruoyi-admin/src/main/java/com/ruoyi/web/controller/business/customer`
- `ruoyi-business/src/main/resources/mapper/customer`
- `ruoyi-ui/src/views/customer`
- `ruoyi-ui/src/api/customer.js`
- `sql/customer.ownership.md`
- `ruoyi-business/src/main/java/com/ruoyi/business/salesorder`
- `ruoyi-ui/src/views/sales-order`

## Must Read Files

- `AGENTS.md` - Top-level workflow and boundary contract.
- `ai/context/current-context.md` - Compact current handoff for new Codex windows.
- `memory/HANDOVER.md` - Latest project handoff and verification boundary.
- `ai/project-profile.json` - Locked adapter and profile-rule state.
- `package.json` - Available workflow and check scripts.
- `ai/registry/features.json` - Feature ownership and active customer context.
- `ai/registry/modules.json` - Module ownership roots.
- `ai/context/features/customer.md` - Focused context for customer.
- `ai/roadmap/phase-gates.json` - beforeSalesOrder gate state.
- `ai/roadmap/refactor-debt.json` - Known debt affecting sales-order handoff.
- `ai/roadmap/enhancement-backlog.json` - Governance backlog and required/deferred evidence.
- `ai/changes/CR-20260624T152423Z-governance-sales-order-handoff-gate/impact.json` - Current change allowed and forbidden edit roots.
- `ai/changes/CR-20260624T152423Z-governance-sales-order-handoff-gate/plan.md` - Current change execution plan.
- `ai/changes/CR-20260624T152423Z-governance-sales-order-handoff-gate/verification.md` - Current change verification evidence.

## Must Not Break

- Do not implement sales-order in this governance change.
- Do not modify customer-management business code in governance/rule-change work.
- Do not change database business table structure in this governance change.
- Do not loosen existing governance gates or profile lock.

## Roadmap Blockers

- multi-role-review: in-progress - Run review:feature for the sales-order proposal and record the decision before implementation.
- current-context: in-progress - Run npm run context:build -- customer before sales-order planning.
- context-pack: in-progress - Keep current-context deterministic and below the line/read-budget thresholds.
- doc-size: in-progress - Split or summarize oversized governance docs instead of appending indefinitely.
- read-budget: in-progress - Add extra must-read files only with a written reason.
- file-weight: in-progress - Before touching heavy files, add a split plan or weight exception to the change record.
- roadmap-check: in-progress - Keep backlog item evidence and futureAction fields non-empty.
- phase-gate-check: in-progress - Mark beforeSalesOrder ready only after required items are completed.
- refactor-debt-check: in-progress - Resolve or explicitly accept debt before dependent sales-order behavior is implemented.
- snapshot-contract: required - Draft snapshot contract in the sales-order pre-review batch.
- state-machine-contract: required - Draft state-machine contract in the sales-order pre-review batch.
- fund-boundary-contract: required - Draft fund-boundary contract before order fund behavior.

## beforeSalesOrder Gate

Status: `blocked`

Required:
- multi-role-review
- current-context
- doc-size
- read-budget
- context-pack
- file-weight
- roadmap-check
- phase-gate-check
- refactor-debt-check
- snapshot-contract
- state-machine-contract
- fund-boundary-contract

Deferred:
- code-index: Can wait until the current-context package and sales-order contract scope are stable.
- context-select: Dependency-closure selection should be added after the first compact context workflow is proven.
- feature-coverage: Deep feature coverage checks need approved sales-order contract files first.
- module-dependencies: Dependency matrix visualization is deferred until sales-order/delivery/finance boundaries exist.
- api-integration-test: Requires approved API contracts and runtime fixtures.
- ui-smoke-test: Requires approved UI screens and browser acceptance path.
- github-actions: CI is deferred to avoid fake echo-success automation before local gates are stable.

## Refactor Debt Summary

- customer-contact-address-reinsert: open - beforeSalesOrder remains blocked until the snapshot contract defines required customer/contact/address snapshot fields.
- customer-put-full-update: open - Current-context and sales-order review must call out the full-update boundary.
- database-direction-mysql: open - Roadmap and context files must keep MySQL as the default database assumption.
- change-salesman-mode-residue: open - Sales-order review must not depend on unclear owner-change semantics.
- reserved-fund-adjust-permission: open - Fund-boundary contract must distinguish deposit entry, deduction, refund, adjustment, and reversal responsibilities.

## Verification Commands

- `npm run resume`
- `npm run scan:all`
- `npm run context:build -- customer`
- `npm run finalize:change -- --summary "新增销售订单前治理接手机制"`
- `npm run check`
- `npm test`
- `git diff --check`

## Next Steps

- Keep this change governance-only.
- Before sales-order implementation, run review:feature and require decision.md to explicitly contain Allow Implementation.
- Complete snapshot, state-machine, and fund-boundary contracts before creating sales-order code or tables.
