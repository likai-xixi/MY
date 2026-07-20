# R-12A Migration Strategy

Decision: Strategy A - deterministic data migration.

## Read-only Inventory

- Source: local MySQL 8 container `mj-mysql`, database `my_ry_vue_runtime`.
- Base code: `09dce9dbd3d008afb517a0099c5a381a0298b19c`.
- `masterdata_sales_option_category`: 4 rows.
  - Three logically deleted R-10C acceptance rows.
  - One active development row named `测试`.
- `masterdata_sales_option_value`: 2 rows.
  - One logically deleted R-10C acceptance row.
  - One active development row named `测试`.
- `masterdata_product_model`: 2 rows.
  - One logically deleted R-10C product-model acceptance row.
  - One active development product identity named `测试`.
- No inspected product-model row represents a process/craft plan; no row is ambiguous for this development database.

## Deterministic Mapping

- Preserve every source id, code, name, status, sort order, logical-delete flag, audit field, timestamp, and remark.
- Map old category ids to `option_set_id` and old value `category_id` to `option_set_id`.
- Set `selection_mode = 'SINGLE'` for all four migrated sets because the source schema has no cardinality field. This is an explicit migration transform affecting four rows, not a silent repair.
- Preserve migrated `SOC`/`SOV` codes as immutable historical row identities; generate only `OS`/`OV` for new records.
- Reconcile set count `4 -> 4`, value count `2 -> 2`, every mapped field, zero orphan values, and zero same-set duplicate value codes before dropping the old tables.

## Cutover And Rollback

- Stop writers and capture a checksum-backed full database backup before V007.
- Execute V007 without force/continue-on-error, run the validation SQL, start only the new code path, and prove old API/menu/route/table absence.
- Rollback is whole-state only: stop the new runtime, restore the full pre-cutover database backup, and use the matching pre-cutover code revision.
- Partial old-table recreation, mixed old/new code, compatibility views, and dual reads/writes are forbidden.

Migration execution, validation, backup checksum, and restore rehearsal remain `[not-run]` until the review-only base commit is authorized and implementation begins.
