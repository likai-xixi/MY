# Engineering Core Destructive Migration Plan

Change: `R-11 engineering-core roadmap rebaseline`
Status: approved plan only; no migration executed.

## Policy

The project is pre-release. The target runtime must replace old APIs, tables, resource keys, names, and pages without aliases, dual writes, compatibility views, or old-data readers. Development database reset is the default path. Export/classify/remap is optional evidence for useful development records, not a compatibility guarantee.

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
| `masterdata_sales_option_category` | Drop; replace with `option_set` semantics |
| `masterdata_sales_option_value` | Drop; replace with `option_value` semantics |

Future runtime also introduces explicit stores for field definitions, field schemes/versions/items, process plans/versions/applicability, calculation snapshots, technical release packages, and production release versions. Exact DDL is deferred to approved runtime CRs.

### API And Backend

Current `/business/masterdata/{resource}` and `MasterDataResource`/`MasterDataRecord`/generic mapper are retired after bounded replacements are complete.

- Product/material/accessory/option catalogs receive explicit bounded resource contracts.
- Field and process drafts receive explicit APIs with publish commands.
- Calculation, approval, technical release, and production release receive command APIs.
- No old resource aliases for `product-model`, `sales-option-category`, or `sales-option-value` remain after cutover.
- Strong reference locking, hierarchy validation, exact affected-row checks, and MySQL concurrency tests must be preserved or replaced by equivalent proofs.

### Pages And Menus

Retire the shared nine-resource mega-page and four thin group wrappers after target pages exist. Target navigation separates:

1. Product catalog.
2. Material/accessory catalog.
3. Option sets.
4. Field library and scheme versions.
5. Process plans and versions.

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

1. Freeze current masterdata writes and capture schema/data/export evidence.
2. Classify `product_model` rows as true product models, process-plan candidates, ambiguous, or discardable.
3. Classify sales-option categories as reusable option sets or reject them as technical/system fields.
4. Stop old backend/frontend; take a recoverable database backup even though compatibility is not required.
5. Drop old menus, permissions, endpoints, code paths, tests, and the nine old tables in the approved runtime migration.
6. Create the target bounded schemas and seed only approved/catalog and golden-reference data.
7. Import explicitly approved mappings; never infer product/process or field ownership from labels alone.
8. Run schema, ownership, hierarchy/reference, lifecycle, negative-old-surface, and golden-sample validation.
9. Start only the new write paths; no dual-write interval.

## Rollback

Before release, rollback means restore the complete pre-cutover database backup and matching code revision. Partial table rollback or mixed old/new code is forbidden. After production release, a separate executable migration/rollback policy is required; this development reset plan no longer applies.

## R-11 Boundary

R-11 creates no SQL, Java, Vue, route, permission, API client, or runtime test. All cutover steps are `[not-run]`.
