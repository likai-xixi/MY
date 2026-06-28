# Current Context

Current feature: `customer`
Current change: `CR-20260628-r-10d-masterdata-code-autogeneration`
Repository: RuoYi + Vue3 + Codex Auto Dev OS
Profile: adapter `ruoyi`, locked `true`

## Allowed Edit Roots

- `ai/changes/CR-20260628-r-10d-masterdata-code-autogeneration`
- `ai/changes/CURRENT_CHANGE.json`
- `ai/contracts/masterdata.api.md`
- `ai/contracts/masterdata.db.md`
- `ai/contracts/masterdata.ui.md`
- `ai/contracts/masterdata.permission.md`
- `ai/contracts/masterdata.delete-ownership.md`
- `ai/contracts/masterdata.r10-contract-test-matrix.md`
- `ai/contracts/masterdata.r10-implementation-boundary.md`
- `ai/generated`
- `ai/context/features/masterdata.md`
- `ai/context/current-context.json`
- `ai/context/current-context.md`
- `ai/registry/features.json`
- `ai/registry/migration-registry.json`
- `ai/registry/modules.json`
- `ai/registry/feature-id-dictionary.json`
- `features/masterdata.md`
- `graph/api-graph.json`
- `graph/module-graph.json`
- `graph/render-graph.mmd`
- `graph/ui-graph.json`
- `memory/API_CATALOG.md`
- `memory/CHANGELOG.md`
- `memory/HANDOVER.md`
- `memory/MODULE_MAP.md`
- `memory/PROJECT_STATE.md`
- `memory/TASKS.json`
- `ruoyi-admin/src/main/java/com/ruoyi/web/controller/business/masterdata`
- `ruoyi-business/src/main/java/com/ruoyi/business/common/code`
- `ruoyi-business/src/main/java/com/ruoyi/business/masterdata`
- `ruoyi-business/src/main/resources/mapper/masterdata`
- `ruoyi-ui/src/api/masterdata.contract.md`
- `ruoyi-ui/src/api/masterdata.js`
- `ruoyi-ui/src/views/masterdata`
- `sql/masterdata.ownership.md`
- `sql/migrations/V20260628_005_masterdata_r10_schema.sql`
- `sql/migrations/V20260628_006_masterdata_r10_menu_permission.sql`
- `sql/validation/masterdata_runtime_validation.sql`
- `tests/masterdata-runtime.test.js`

## Forbidden Edit Roots

- `ruoyi-business/src/main/java/com/ruoyi/business/customer`
- `ruoyi-business/src/main/java/com/ruoyi/business/idempotency`
- `ruoyi-business/src/main/java/com/ruoyi/business/salesorder`
- `ruoyi-business/src/main/java/com/ruoyi/business/sales-order`
- `ruoyi-admin/src/main/java/com/ruoyi/web/controller/business/customer`
- `ruoyi-admin/src/main/java/com/ruoyi/web/controller/business/salesorder`
- `ruoyi-admin/src/main/java/com/ruoyi/web/controller/business/sales-order`
- `ruoyi-ui/src/views/customer`
- `ruoyi-ui/src/views/sales-order`
- `ruoyi-ui/src/views/salesorder`
- `ruoyi-ui/src/api/customer.js`
- `ruoyi-ui/src/api/sales-order.js`
- `ruoyi-ui/src/api/salesorder.js`
- `sql/customer.ownership.md`
- `sql/sales-order.ownership.md`
- `package.json`
- `tools`
- `scripts`
- `.github/workflows`
- `ruoyi-admin/src/main/resources/application.yml`
- `ruoyi-admin/src/main/resources/application-druid.yml`
- `ruoyi-admin/src/main/resources/application-prod.yml`
- `ruoyi-framework`
- `ruoyi-common`

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
- `ai/changes/CR-20260628-r-10d-masterdata-code-autogeneration/impact.json` - Current change allowed and forbidden edit roots.
- `ai/changes/CR-20260628-r-10d-masterdata-code-autogeneration/plan.md` - Current change execution plan.
- `ai/changes/CR-20260628-r-10d-masterdata-code-autogeneration/verification.md` - Current change verification evidence.

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

## Planned Verification Commands

- `npm run scan:all`
- `npm run finalize:change`
- `node --test tests/masterdata-runtime.test.js`
- `npm run check`
- `git diff --check`
- `mvn -pl ruoyi-admin -am -DskipTests compile`
- `npm --prefix ruoyi-ui run build:prod`

## Next Steps

- Keep this change governance-only.
- Before sales-order implementation, run review:feature and require decision.md to explicitly contain Allow Implementation.
- Complete snapshot, state-machine, and fund-boundary contracts before creating sales-order code or tables.
