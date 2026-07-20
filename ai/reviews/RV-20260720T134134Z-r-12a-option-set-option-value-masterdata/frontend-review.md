# Frontend Review

## Decision

Frontend recommends conditional `Allow Implementation`; runtime remains NO-GO until review approval/binding and the user-authorized committed-review base exist.

## Current Findings

- The 899-line shared page currently labels product-model as `工艺型号` and hard-codes the old sales-option resources/group.
- `sales-option-config.vue`, menu SQL, UI graph, docs, and tests expose the old route and wording.
- The transport-only generic API helper can remain if the backend enum accepts only current keys.
- Current tests explicitly require the old nine-resource vocabulary and must be replaced, not merely appended.
- Existing relation failures can look empty and some edit/status affordances need exact permission/read-only behavior during the split.

## Approved Information Architecture

- Keep product/material/accessory through the existing shared page and thin wrappers.
- Product configuration displays `产品大类`, `产品系列`, and `产品型号`.
- Create bounded `option-config.vue` at `/masterdata/option-config`, menu `选项配置`, route `MasterdataOptionConfig`, tabs `选项集` and `选项值`.
- Delete `sales-option-config.vue`; the old menu/path/component/route name must be absent with no redirect.

## Option UI Contract

Option set search/list/form owns code, name, exact `SINGLE/MULTIPLE` selection mode, status, sort order, remark, create time, and actions. Create defaults mode to `SINGLE`; edit shows code read-only.

Option value search/list/form owns code, name, required `optionSetId`, status, sort order, remark, create time, and actions. The set selector shows code plus name. Existing values must keep displaying their owner even after the set is disabled, while new-business options omit disabled sets/values.

- New codes display `OS`/`OV`; migrated legacy codes may remain visible and immutable but are never newly generated.
- Deterministic order is sort order plus stable id/code.
- Status confirmations roll back UI state on failure and do not cascade.
- Delete protection errors must remain visible; batch failures cannot be swallowed.
- Create/update errors keep the dialog open and preserve input.

## Product Tree And Regression

Preserve maximum depth three, default collapse, matched-ancestor expansion, add-child parent-path expansion only, self/descendant/depth rejection, L1/L2/L3 visual hierarchy, category tree selects, series/model filtering, child/reference delete protection, and non-cascading status. Preserve material/accessory labels/fields/CRUD and do not touch customer files.

## States And Permissions

- Separate list/relation/detail/submit/status/delete busy states and prevent duplicate actions.
- Show empty only after a successful zero-row response; show inline error with retry for failures.
- Prevent stale responses after tab changes and show success only after accepted mutation plus refreshed data.
- Require exact query/add/edit/remove/export/status capabilities. List-only users must not receive edit affordances; users without status permission see a read-only status tag.
- Browser permission checks complement backend denial and never replace it.

## Split Decision

Do not add option-specific branches to the shared page. Extract option behavior into `option-config.vue` now and record a split plan. Reuse existing Element Plus/global controls; no shared component catalog change is needed unless a genuinely reusable component is created.

## Required Evidence

- Focused tests for exact vocabulary, modes, option ownership, routes/menu/component, sorting, status failure rollback, explicit page states, permissions, old-surface absence, product tree preservation, material/accessory regression, and forbidden-runtime absence.
- Vue production build plus real browser acceptance after MySQL/API migration: fresh login/router reload, new route works, old route absent, product wording correct, option CRUD/status/delete/modes/codes work, full and limited roles behave correctly, and product/material/accessory/customer basics regress.

Frontend final verdict: conditionally acceptable after the committed review-base gate; no repository files were modified by the independent reviewer.
