# Handover

## Summary

R-09 configurable modeling contracts were reconciled as contract-only work. `origin/master` remains the structural source of truth with `masterdata.*`, `rule.*`, and `tech.*` contract files; the backed-up f959 `r09-*` files were used only as a content reference.

## Impact

This change strengthens contract and closeout evidence only. It updates the R-09 contract package for configurable product/category/series/model, material/accessory, sales option, sales configuration process, field library and field scheme, option scheme, snapshot/versioning, formula/rule, technical decomposition, part template, calculation snapshot, and R-10 through R-17 roadmap-boundary clauses.

## Key Decision

The future ERP must not hard-code `门`, `门匾`, `栅栏`, `护栏`, `钣金件`, `异形件`, `工程定制`, `单开`, `对开`, `子母`, `连体子母`, `玻璃拼接`, `整拼`, `铝卡`, `型材`, `发光字`, `铁艺栅栏`, `钣金折弯`, `拉手`, `锁具`, or `铰链` as fixed runtime models. They are configurable product, option, process, field, rule, template, or material data examples.

## Reconciled Content

- Strengthened product/category/series/model contracts as user-maintained configuration data.
- Strengthened sales-option and sales-configuration-process contracts, including no Java enum, Vue fixed option, SQL fixed business model, API branch, package script, or tools special case.
- Added field scheme rules into the approved files without creating `masterdata.field-scheme.md`.
- Added order and technical snapshot requirements for product, process, field scheme, field values, field labels, options, formulas, rules, templates, and generated parts.
- Added formula/rule examples and old-system concept mapping for process parameters, lower-stop relations, glass rules, flower-bias/offset rules, keywords, operators, formula variables, templates, and calculation snapshots.
- Added technical split, part list, part fields, and R-10 through R-17 roadmap boundary.

## Boundary

- No `r09-*` contract files were created.
- No sales-order runtime was created.
- No Java service/controller/mapper/domain was created or modified.
- No Vue page or API client was created or modified.
- No SQL migration was created.
- No customer runtime was changed.
- No idempotency runtime was changed.
- No security config was changed.
- No `package.json`, `tools/`, or `.github/workflows` file was changed.

## Verification

- [local] `npm run resume`, JSON parse audit, `R09_CONTRACT_AUDIT_OK count=19`, `SALES_ORDER_RUNTIME_ABSENT_OK`, and `FORBIDDEN_RUNTIME_DIFF_ABSENT_OK` passed.
- [local] `npm run context:build -- customer` passed and restored generated current-context idempotence.
- [local] `npm run check` passed end to end; final `npm test` passed 233/233.
- [local] `git diff --check` passed.
- [not-run] Runtime API/browser/DB/Maven/frontend-build acceptance is intentionally out of scope because no runtime code changed.

## Risks

- [local] f959 had useful clauses, but its `r09-*` file structure was intentionally not adopted.
- [local] The current-CR component and boundary exception files preserve exact inherited RuoYi baseline exceptions only; no checker, Vue source, router source, or runtime file was changed.
- [local] `beforeSalesOrder` remains blocked; sales-order runtime still requires later approved contracts and review.

## Next Actions

After R-09 local gates pass and this change is accepted, R-10A product/material/sales-option master data MVP may be opened as a separate change. This reconcile does not start R-10A.
