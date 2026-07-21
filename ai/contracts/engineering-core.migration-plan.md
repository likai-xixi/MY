# Engineering Core Destructive Migration Plan

Change: `R-11 engineering-core roadmap rebaseline`
Status: approved staged plan; R-12A catalog/option cutover executed, later field/process/calculation/release slices not implemented.

## Policy

The project is pre-release. The target runtime must replace old APIs, tables, resource keys, names, and pages without aliases, dual writes, compatibility views, or old-data readers. R-12A selected deterministic Strategy A for the catalog/option slice. Later approved slices must declare their own explicit reset or migration strategy; no compatibility guarantee is created.

## Current Surface Inventory

### Tables

| Current table | Target decision |
| --- | --- |
| `masterdata_product_category` | Rebuild/retain semantics under explicit product-catalog ownership; preserve hierarchy invariants |
| `masterdata_product_series` | Rebuild/retain semantics under product-catalog ownership |
| `masterdata_product_model` | Rebuild with product-only semantics; rows representing craft/process are not auto-migrated |
| `masterdata_material_category` | Move to explicit material-catalog ownership |
| `masterdata_material_item` | Move to explicit material-catalog ownership; keep base-material meaning |
| `masterdata_accessory_category` | Move to explicit accessory/material-catalog ownership |
| `masterdata_accessory_item` | Move to explicit accessory/material-catalog ownership |
| `masterdata_sales_option_category` | Dropped by R-12A; replaced with `masterdata_option_set` |
| `masterdata_sales_option_value` | Dropped by R-12A; replaced with `masterdata_option_value` |

Future runtime also introduces explicit stores for field definitions, field schemes/versions/items, process plans/versions/applicability, calculation snapshots, technical release packages, and production release versions. Exact DDL is deferred to approved runtime CRs.

### API And Backend

R-12A retained the bounded generic `/business/masterdata/{resource}` catalog controller/service/mapper for exactly nine catalog resources. It does not accept field, process, formula, approval, version, or release lifecycle behavior and may be retired only by a later approved bounded replacement.

- Product/material/accessory/option catalogs receive explicit bounded resource contracts.
- Field and process drafts receive explicit APIs with publish commands.
- Calculation, approval, technical release, and production release receive command APIs.
- `product-model` now means catalog product identity only. No `sales-option-category` or `sales-option-value` alias remains after R-12A.
- Strong reference locking, hierarchy validation, exact affected-row checks, and MySQL concurrency tests must be preserved or replaced by equivalent proofs.

### Pages And Menus

R-12A kept four bounded catalog groups and introduced the dedicated option configuration page. Later approved runtime may further separate:

1. Product catalog.
2. Material/accessory catalog.
3. Option sets.
4. Field library and scheme versions. `[not implemented]`
5. Process plans and versions. `[not implemented]`

Technical review/release and production release are workflow workspaces, not additional generic masterdata tabs. The label `工艺型号` is removed; product identity is displayed as `产品型号`.

### Tests

Retire or split `tests/masterdata-runtime.test.js` assertions that require exactly nine generic resources, old table names, old option resource keys, old grouped menus, or the unchanged generic API.

Replace them with focused suites for:

- product catalog hierarchy/reference/concurrency
- option set/value/cardinality/applicability
- field ownership and immutable scheme publication
- product/process-plan separation and process publication
- calculation I/O schema and traceability
- version/release command and immutability rules
- migration absence of old resources/tables/routes/labels
- the two signed 9CM golden fixtures

`MasterDataServiceTest` and `MasterDataReferenceMySqlIT` are replaced or renamed only when equivalent bounded tests are green. Do not discard their concurrency coverage during the reset.

## Cutover Sequence

1. Freeze catalog writes and capture schema/data/export evidence. `[R-12A complete]`
2. Confirm current `product_model` rows are catalog product identities; do not infer process plans. `[R-12A complete]`
3. Map all four inventoried sales-option categories to reusable option sets. `[R-12A complete]`
4. Stop old runtime and take a recoverable whole-database backup. `[R-12A complete]`
5. Remove old sales-option menu/resource/API paths and drop only its two old tables. `[R-12A complete]`
6. Create `masterdata_option_set/value` with approved constraints. `[R-12A complete]`
7. Import the explicit 4/2 mapping without field/process inference. `[R-12A complete]`
8. Run schema, ownership, hierarchy/reference, negative-old-surface, API/browser, and rollback validation. `[R-12A complete]`
9. Start only the new catalog write paths; no dual-write interval. `[R-12A complete]`

Field/process/calculation/release and signed golden-sample steps remain separate future changes.

## Rollback

Before release, rollback means restore the complete pre-cutover database backup and matching code revision. Partial table rollback or mixed old/new code is forbidden. After production release, a separate executable migration/rollback policy is required; this development reset plan no longer applies.

## R-12A Execution Boundary

R-12A executed only product-catalog semantics and option-set/value migration. It created no field-definition, field-schema, process-scheme, sales-order, formula, calculation snapshot, BOM, production, DXF, workstation, mobile, or customer-fund runtime. `engineeringCoreReady` and `beforeSalesOrder` remain blocked.
