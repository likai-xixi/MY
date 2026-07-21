# Masterdata Runtime Contract Test Matrix

Current change: `R-12A destructive catalog-option migration`
Status: active verification contract. Historical R-10 evidence remains in its change records.

| Contract Area | R-10B Must Hold | Future Evidence |
|---|---|---|
| Scope | Runtime includes exactly seven retained catalog resources plus `option-set` and `option-value` | R-12A changed-files and ownership audit |
| Product data | Product category, series, and model are configurable catalog identities displayed as 产品大类、产品系列、产品型号. `product-model` does not own process or manufacturing rules. | API/UI/DB tests and semantic reverse audit |
| Material data | Material and accessory categories/records are configurable rows | API/UI/DB tests and DB validation |
| Reusable options | Option sets/values are configurable value-domain rows; `selectionMode` is SINGLE/MULTIPLE and values require `optionSetId` | API/UI/DB tests plus old-resource negative checks |
| Common fields | Every MVP object has backend-generated stable code, display name, status, sort order, and remark | DB/schema/API contract tests |
| Code generation | Create does not require caller code; backend generates `prefix + yyyyMM + 6 digit sequence`, ignores supplied create code, and does not derive code from Chinese names | R-10D masterdata runtime test |
| Code immutability | Edit keeps existing code even if payload includes a different code | R-10D masterdata runtime test |
| Product category hierarchy | Product category is rendered as a tree table, has maximum depth 3, rejects level 4, rejects self/descendant parent choices, and blocks deleting parents with children | R-10F masterdata runtime test |
| Delete safety | Referenced master data cannot be physically deleted | Service/API tests for reference-protected remove |
| Snapshot readiness | Future orders and technical results can snapshot code/name | Contract tests for API response fields and DB columns |
| Migration | V007 deterministically preserves 4 sets and 2 values, assigns four explicit SINGLE modes, drops old tables, and updates the menu in place | MySQL migration/validation and backup/restore evidence |
| Permission | view/add/edit/remove/export/status/publish boundary is preserved | permission scan, SQL menu/permission ownership, controller/UI checks |
| Ownership | API/UI/SQL/permission/test ownership is synchronized | registry, graph, generated scans, and changed-files audit |
| Exclusions | No field scheme, formula, technical template, sales order, inventory, BOM, production route, scanning/reporting, or drawing runtime | forbidden-path audit and grep/diff review |

## Historical R-10 Evidence

R-10 change records retain the evidence for the original masterdata runtime, code generation, tree behavior, and grouped menus. They are historical evidence and are not edited to erase old terminology.

## R-12A Required Closeout

R-12A must run focused Java/Node tests, Maven compile, Vue production build, executable MySQL migration and validation, real API/browser/menu/permission acceptance, old-surface reverse audit, and the active scaffold gates. `npm run check` alone is not business-runtime proof.

## Runtime Evidence Hook

`tests/masterdata-runtime.test.js` guards the exact current resource allowlist, OS/OV generation, option ownership/mode/delete/options rules, product-category tree/depth/cycle/delete protections, grouped menu labels/routes, frontend add/edit code behavior, old-surface absence, and explicit exclusions for field/process, sales-order, formula, production, and DXF runtime.
