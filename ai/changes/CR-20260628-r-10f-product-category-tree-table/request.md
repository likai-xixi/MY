# Request

Execute R-10F: masterdata product category tree table and hierarchy constraints.

## Scope

- Masterdata only.
- Product category only.
- Replace the product category flat table presentation with a tree table.
- Keep product category search by code, name, and status.
- Keep list columns for code, name, sort order, status, remark, create time, and actions.
- Hide the parent-category column in the product category tree table because hierarchy is expressed by the tree.
- Keep product series, product model, material, accessory, sales option category, and sales option value behavior unchanged.

## Product Category Hierarchy Rule

- Maximum depth is 3.
- Level 1 examples: door, lintel, fence.
- Level 2 examples: courtyard door, entry door, guardrail.
- Level 3 examples: glass-spliced door, full-spliced door, aluminum-card door, profile door.
- Level 4 is forbidden.
- Opening mode, color, handle, lock, hinge, glass, surface treatment, and packaging are sales options and must not be guided into product category.

## Runtime Requirements

- Backend must enforce maximum depth 3 on create and edit.
- Backend must reject self-parenting.
- Backend must reject setting a descendant as parent.
- Backend must reject deletion when a product category has child categories.
- Frontend parent selection must filter out the current category and descendants on edit.
- Frontend parent selection must block choices that would exceed depth 3.
- Status changes remain non-cascading for now; handover should record the deferred cascade strategy.

## Hard Boundaries

- Do not enter R-11.
- Do not create sales-order runtime.
- Do not create field-scheme runtime.
- Do not create formula runtime.
- Do not create technical-decomposition runtime.
- Do not create inventory, BOM, production, scan, drawing, shipment, finance, or receipt runtime.
- Do not modify customer runtime.
- Do not modify idempotency runtime.
- Do not modify security configuration.
- Do not modify package.json, tools, workflow, or GitHub Actions.
- Do not force push.

## Intake Evidence

- [local] `npm run resume` passed before R-10F file creation.
- [local] `git status --short --branch` returned clean `## master...origin/master`.
- [local] `git -c http.proxy= -c https.proxy= fetch origin master` passed.
- [local] `git rev-parse HEAD origin/master FETCH_HEAD` confirmed all three refs at `5aae158add92f76433f0b1574d61e6977085bf82`.
- [local] `Select-String` confirmed `beforeSalesOrder.status` is `blocked`.
- [local] `npm run check:phase-gate` passed.
- [local] `npm run impact -- masterdata --mode update --json` passed with no blockers.
