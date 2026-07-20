# Product Review

## Outcome

Product scope recommends `Allow Implementation` for the bounded R-12A slice, subject to the repository authorization and evidence conditions below.

## Users And Value

- Masterdata operators see truthful catalog language: `产品大类 -> 产品系列 -> 产品型号`; `product-model` no longer appears to mean a craft/process plan.
- Administrators maintain reusable `选项集/选项值` rather than sales-specific categories.
- Future sales and engineering work receives stable product and option identities without prematurely introducing field, process, calculation, or order runtime.
- Existing hierarchy, reference, status, code, and deletion safeguards remain familiar through the breaking vocabulary change.

## MVP In Scope

1. Preserve the three product-catalog identities and relationships:
   - `product-category` displays as `产品大类`.
   - `product-series` displays as `产品系列`.
   - `product-model` displays as `产品型号`.
   - Current effective facts must remove `工艺型号` and any process/craft interpretation from product-model behavior, contracts, pages, menus, and tests.
2. Destructively replace `sales-option-category/value` with `option-set/value` across Java, Vue, API contracts, MySQL tables, menu/page ownership, tests, registry, graphs, scans, and current documentation.
3. An option set is one reusable selectable dimension with `SINGLE` or `MULTIPLE` cardinality. An option value belongs to exactly one option set.
4. Preserve backend-generated immutable codes, product-category depth/cycle/concurrency protections, product-model category/series consistency, deterministic locks, logical deletion, non-cascading status, exact affected-row checks, and masterdata permissions.

## Non-goals

- No field-definition/schema/version, process-plan/scheme/version, product-process applicability, formula/calculation engine, sales-order, technical order, BOM, production, DXF, drawing, delivery, finance, or customer-fund runtime.
- No product-family-specific fields, branches, enums, or example-driven schema.
- No compatibility aliases, dual writes, compatibility views, old routes, or mixed runtime.
- No claim that `engineeringCoreReady` or `beforeSalesOrder` becomes ready.
- No governance-rule, checker, workflow, package, skill, or profile change.

## Acceptance Criteria

### Database

- Choose one recorded strategy after live inventory, capture a recoverable pre-cutover backup, execute the migration and validation SQL, and prove the old tables are absent.
- Prove option membership, same-set code uniqueness, lifecycle and delete protection, with zero orphans or duplicate codes.
- Product-model rows must be classified; process-like or ambiguous rows must not be silently treated as products.
- Rollback restores the whole database backup and matching code revision; mixed old/new rollback is forbidden.

### API

- Exercise create, list, detail, edit, options, status, export, logical delete, and negative-reference cases.
- Prove generated/immutable codes, required trimmed names, option membership, exact-row behavior, disabled-child delete blocking, and authorization denial.
- Prove the old resource keys are rejected and material/accessory behavior still works.

### Browser

- Prove `产品大类 / 产品系列 / 产品型号`, with no current `工艺型号` wording.
- Prove `选项配置` with option-set/value, `SINGLE/MULTIPLE`, membership, ordering, add/edit, read-only code, status, and protected delete.
- Prove the old menu, labels, and route are absent and regress product tree, material, accessory, and customer basics.

Static tests, Maven compile, Vue build, and `npm run check` support but do not replace MySQL/API/browser acceptance.

## Scope Risks And Conditions

- A label-only rename is insufficient; negative old-surface checks are mandatory.
- Technical fields inside option sets, applicability/process bindings, or shared-CRUD expansion into versioning/approval/calculation are out of scope.
- The shared generic CRUD layer may remain only with regression evidence for unaffected masterdata resources.
- Bind this review to the change, keep the review base aligned to `09dce9dbd3d008afb517a0099c5a381a0298b19c`, and commit the approved review before any business implementation because the repository checker rejects same-range self-approval.

## Product Decision

Product scope: Go under the conditions above. Repository implementation authorization remains blocked until all five role reviews, the final decision, review binding, and committed-review base requirement are satisfied.
