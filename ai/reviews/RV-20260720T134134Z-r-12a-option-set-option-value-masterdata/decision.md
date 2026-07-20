# Decision

Decision: Allow Implementation

## Approved Slice

R-12A may implement only:

1. The current product-catalog semantic correction from `工艺型号` to `产品型号`, keeping `product-category`, `product-series`, and `product-model` product-only.
2. The destructive replacement of `sales-option-category/value` with reusable `option-set/value` in the masterdata runtime.
3. Deterministic Strategy A for the inspected `my_ry_vue_runtime` data: `4 -> 4` sets, `2 -> 2` values, explicit four-row `SINGLE` mapping, preserved ids/fields/audit/delete state, then removal of old tables.
4. The bounded Java/Mapper/API/Vue/menu/permission-evidence/test/contract/registry/graph/scan/memory changes and real MySQL/API/browser/rollback/reverse-audit evidence required by this review.

## Frozen Contracts

- Generic `/business/masterdata/{resource}` CRUD may remain only for the nine approved catalog keys.
- `option-set.selectionMode` is required and exactly `SINGLE | MULTIPLE`.
- `option-value.optionSetId` is required; do not reuse the old sales-category API meaning.
- New codes use `OS` and `OV`; migrated old codes are preserved data only.
- New page/menu is `选项配置` at `/masterdata/option-config`; the old route/menu/component is absent without redirect.
- Option-set disable is non-cascading. New-business option results exclude values owned by disabled sets.
- A set with any non-deleted value, including disabled values, cannot be deleted.
- Product/material/accessory tables and existing safety invariants remain.

## Explicitly Not Approved

No field-definition/schema, process-plan/scheme, applicability binding, formula/calculation, sales-order, tech-order, BOM, production, DXF, customer-fund, delivery, finance, governance-rule, checker, script, workflow, package, skill, profile, commit, push, deploy, or release work.

`engineeringCoreReady` and `beforeSalesOrder` remain `blocked`.

## Execution Gate

This design approval does not waive the repository anti-self-approval rule. The review package must first exist in a user-authorized committed base revision, then the implementation impact must use that base and bind this review id. Until that prerequisite commit is authorized, business implementation remains blocked even though the five-role decision is `Allow Implementation`.
