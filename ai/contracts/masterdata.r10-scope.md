# Masterdata R-10 MVP Scope Contract

Change: `R-10A masterdata MVP contract package`
Status: contract/pre-review only. This file defines the minimum scope for the later R-10B runtime implementation and creates no Java, Vue, API client, SQL migration, permission SQL, route, menu, mapper, service, controller, domain, or test runtime artifact.

## Purpose

R-10B must create only the smallest maintainable master-data base needed before configurable sales ordering, technical decomposition, production, inventory, and finance work can be opened.

## R-10B MVP Objects

R-10B may implement only these master-data maintenance objects:

1. Product category
2. Product series
3. Product model
4. Material category
5. Material record
6. Accessory category
7. Accessory record
8. Sales option category
9. Sales option value

## Product Data Is Configuration

- `门`, `门匾`, `栅栏`, `护栏`, `钣金件`, `异形件`, and `工程定制` are user-configured product/category/model data examples.
- `庭院门`, `入户门`, `玻璃拼接门`, `整拼门`, `铝卡门`, and `型材门` are user-configured category/series/model data examples.
- None of those names may become a hard-coded Java model, Java enum, Vue branch, route family, SQL table family, scanner rule, or permission family.
- Preset data may be delivered later as seed/configuration records, but preset data remains editable configuration data.

## Sales Option Data Is Configuration

- `单开`, `对开`, `子母`, `连体子母`, `颜色`, `拉手`, `锁具`, `铰链`, `玻璃`, `表面处理`, `包装方式`, and `材料体系` are sales-option configuration data.
- Those values must not be compiled into Java enums, Vue fixed option arrays, SQL fixed business models, product-specific routes, or scanner exceptions.
- Product models may later restrict available options only through data-driven configuration; R-10B does not implement that restriction engine.

## Required Common Fields

Each R-10B object must have at least:

- stable code
- display name
- status
- sort order
- remark

Runtime implementation may add audit fields, tenant/dept fields if the active RuoYi profile requires them, parent/level fields for categories, unit/spec fields for material/accessory records, and publish/version fields when needed by the R-10B permission boundary.

## Delete And Archive Rule

- Master data that has never been referenced may be physically removed only if R-10B explicitly proves the no-reference condition.
- Master data already referenced by later orders, technical results, inventory, BOM, production, drawing, or finance data must not be physically deleted.
- Referenced master data must be disabled, archived, or unpublished while retaining stable code and historical display data.

## Snapshot Rule

- Future orders and technical results must save master-data code/name snapshots.
- Order and technical result records must not rely only on mutable database ids or current names.
- Snapshot content must include product category/series/model code and name, material/accessory code and name, sales option category/value code and name, plus version/publish metadata when R-10B introduces it.

## Explicit Non-goals For R-10B

R-10B must not implement:

- field library, field scheme, or field-scheme binding
- formula variables, formula groups, or process calculation rules
- sales configuration process runtime
- glass rules, offset rules, or any calculation-rule engine
- technical decomposition templates or part templates
- sales order runtime
- customer runtime changes
- inventory deduction, BOM, production route, scanning/reporting, drawing tasks, shipment, finance, or receipt flows
- executable SQL in R-10A

## R-10A Pre-review Decision

R-10A approves only the master-data MVP contract package for later R-10B implementation. R-10B must open a separate runtime change record, register API/UI/SQL/permission/test ownership, and run the required gates before any runtime file is created.
