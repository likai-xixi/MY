# Masterdata Migration Plan Contract

Status: executed R-12A deterministic migration contract, bounded by `engineering-core.migration-plan.md`.

The approved direction is a pre-release destructive migration with no old API, table, resource-key, label, permission alias, compatibility view, dual read/write, or forwarding compatibility.

R-12A uses Strategy A against the inventoried development database:

- preserve all four old option-category rows and both old option-value rows with ids, codes, names, status, sort, logical-delete and audit fields unchanged;
- map category id to `option_set_id` and assign explicit `selection_mode='SINGLE'` to all four sets;
- map each value to required `option_set_id`;
- reconcile `4 -> 4` and `2 -> 2`, zero orphans, zero same-set duplicate codes, and full field equality before dropping old tables;
- update the existing menu row in place so role-menu identity is preserved;
- restore only by complete pre-cutover database backup plus matching pre-cutover code revision.

Executable files are `sql/migrations/V20260720_007_masterdata_option_set_breaking_migration.sql`, `sql/validation/masterdata_option_set_validation.sql`, and the shared masterdata runtime validation.

## Execution Evidence

- `[runtime-local]` The migration completed on `my_ry_vue_runtime`: four old category rows became four option sets, two old value rows became two option values, and all four sets use `SINGLE`.
- `[runtime-local]` Both old tables, the old menu/route, and old permission aliases are absent; orphan and duplicate-code counts are zero.
- `[runtime-local]` One dirty-data condition was explicit: the reserved deleted hierarchy mutex sentinel was absent. The migration inserted only that reserved row after conflict checks (`0 -> 1`); business data was unchanged and shared validation passed.
- `[runtime-local]` Whole-state rollback was rehearsed by restoring the pre-cutover backup with review-base code and calling both old APIs successfully.
- `[runtime-local]` The final runtime database was restored from the post-migration/pre-fixture backup and revalidated at `4 / 2 / 4 SINGLE`.
