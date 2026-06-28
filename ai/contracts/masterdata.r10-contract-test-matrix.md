# Masterdata R-10 Contract Test Matrix

Change: `R-10A masterdata MVP contract package`
Status: contract/pre-review only. This matrix defines future R-10B evidence and does not claim runtime tests exist.

| Contract Area | R-10B Must Hold | Future Evidence |
|---|---|---|
| Scope | Runtime includes only the nine MVP master-data objects | R-10B changed-files and ownership audit |
| Product data | Product category, series, and model are configurable rows | API/UI/DB tests and seed-data audit |
| Material data | Material and accessory categories/records are configurable rows | API/UI/DB tests and DB validation |
| Sales options | Option categories/values are configurable rows, not enums | API/UI tests rejecting hard-coded arrays |
| Common fields | Every MVP object has backend-generated stable code, display name, status, sort order, and remark | DB/schema/API contract tests |
| Code generation | Create does not require caller code; backend generates `prefix + yyyyMM + 6 digit sequence`, ignores supplied create code, and does not derive code from Chinese names | R-10D masterdata runtime test |
| Code immutability | Edit keeps existing code even if payload includes a different code | R-10D masterdata runtime test |
| Product category hierarchy | Product category is rendered as a tree table, has maximum depth 3, rejects level 4, rejects self/descendant parent choices, and blocks deleting parents with children | R-10F masterdata runtime test |
| Delete safety | Referenced master data cannot be physically deleted | Service/API tests for reference-protected remove |
| Snapshot readiness | Future orders and technical results can snapshot code/name | Contract tests for API response fields and DB columns |
| Migration | SQL is executable MySQL in R-10B, with validation evidence | MySQL migration/validation run or equivalent verified gate |
| Permission | view/add/edit/remove/export/status/publish boundary is preserved | permission scan, SQL menu/permission ownership, controller/UI checks |
| Ownership | API/UI/SQL/permission/test ownership is synchronized | registry, graph, generated scans, and changed-files audit |
| Exclusions | No field scheme, formula, technical template, sales order, inventory, BOM, production route, scanning/reporting, or drawing runtime | forbidden-path audit and grep/diff review |

## R-10A Current Evidence

R-10A creates only contracts, the R-10A change record, current-context handoff, and memory updates. Runtime tests, SQL execution, browser validation, Maven compile, and frontend build are not required because no runtime file is created.

## R-10B Required Closeout

R-10B must run the active scaffold gates plus runtime-specific evidence created by the implementation. `npm run check` alone is not business-runtime proof.

## R-10B Runtime Evidence Hook

`tests/masterdata-runtime.test.js` now guards the R-10B object list, SQL ownership, API/client surface, permission boundary, R-10D backend code generation, R-10F product-category tree/depth/cycle/delete protections, frontend add/edit code behavior, bounded retry, and explicit exclusions for sales-order, field-scheme, formula, and technical-decomposition runtime.
