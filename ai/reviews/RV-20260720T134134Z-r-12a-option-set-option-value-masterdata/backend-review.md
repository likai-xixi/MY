# Backend And Database Review

## Decision

Backend/DB recommends conditional `Allow Implementation`, with runtime still NO-GO until this approved review is committed in the base revision and bound to the implementation impact.

## Current Truth

- The enum, schema, mapper, tests, and menu still own the old sales-option keys/tables and `SOC/SOV` generation.
- `MasterDataRecord` has neither `selectionMode` nor `optionSetId`.
- The generic service already supplies transactional CRUD, immutable generated codes, deterministic locks, hierarchy/reference validation, logical-delete protection, and exact affected-row checks.
- The live MySQL 8 `my_ry_vue_runtime` inventory contains four old category rows, two old value rows, and two product-model rows. These are development acceptance/test identities; no inbound database foreign keys were found.

## Approved Strategy A

Preserve every id, code, name, status, sort order, delete flag, audit field, timestamp, and remark. Explicitly map all four old categories to `selection_mode = 'SINGLE'`. Preserve historical `SOC/SOV` row codes as immutable data but generate only `OSyyyyMMnnnnnn` / `OVyyyyMMnnnnnn` for new records.

Target constraints:

- `masterdata_option_set.selection_mode` is `NOT NULL` and accepts only `SINGLE` or `MULTIPLE`.
- `masterdata_option_value.option_set_id` is `NOT NULL` with a restrictive FK to the option set.
- Option-set code remains unique; option-value code is unique within `(option_set_id, option_value_code)`.
- Reconcile `4 -> 4` and `2 -> 2` plus field equality before dropping the old child and parent tables.
- Update the existing menu row to `option-config` / `masterdata/option-config` / `MasterdataOptionConfig` / `选项配置` so role-menu identity is preserved.
- Keep generic permissions; add no old or option-specific aliases.
- Do not modify historical V005/V006. Add and register V007 plus executable validation SQL.

## Required Runtime Changes

### Domain/resource

- Replace `SALES_OPTION_CATEGORY/VALUE` with `OPTION_SET/VALUE` and reject old path values.
- Add `selectionMode` and `optionSetId` with resource-capability normalization so unrelated resources never persist option fields.
- Change product-model current display/error semantics to `产品型号` only.

### Service

- Require exact `SINGLE` or `MULTIPLE` on option-set create/update.
- Require and lock an existing, non-deleted set on option-value create/update.
- Block option-set logical delete while any non-deleted value refers to it, including disabled values.
- Let option-set status change remain non-cascading; `option-value/options` must exclude values whose parent set is disabled.
- Preserve code immutability, deterministic locks, exact affected-row checks, product hierarchy, and series/model consistency.

### Mapper/XML

- Map/query/insert/update `selection_mode` and `option_set_id` only for the owning resources.
- Add enabled-option query behavior and explicit option-set child-reference counts.
- Keep logical-delete filtering and enum-controlled identifiers.

## Validation And Tests

- SQL proves new tables/columns/check/FK/indexes, valid modes, zero orphans/duplicates, exact migrated counts, old table absence, new menu singularity, old menu absence, and all retained product/material/accessory invariants.
- Unit tests cover mode validation, required/missing set, delete/reference behavior, disabled-set options filtering, OS/OV generation, old-key rejection, resource field normalization, and preserved hierarchy/locking/row-count behavior.
- MySQL integration tests cover FK/composite uniqueness, migration reconciliation, old-table absence, parent/value races, and preserved category concurrency.
- API acceptance must use restricted principals; static annotations are insufficient. The application connection must prove `SELECT DATABASE() = my_ry_vue_runtime`.

## Rollback And Build Risks

- Capture and checksum a full backup, then rehearse restore into an isolated database with the prior code SHA.
- Enum changes affect switch statements, ordinal lock order, fake mappers, fixtures, and integration setup.
- MyBatis bindings can compile yet fail at runtime, so real API/MySQL proof is mandatory.
- Ordered migration is V005 -> V006 -> V007; do not replay superseded baselines after cutover.

Backend/DB final verdict: Strategy A and the bounded code changes are acceptable only after the review-base gate is resolved; no repository files were modified by the independent reviewer.
