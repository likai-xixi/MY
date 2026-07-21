# Feature Brief: 主数据配置

## Identity

- ID: `masterdata`
- Name: 主数据配置
- Current runtime baseline: R-12A catalog/option migration
- Architecture authority: R-11 `ai/contracts/engineering-core.*`

## Current Runtime Truth

The active runtime exposes exactly nine resources through `/business/masterdata/{resource}` and one bounded shared catalog CRUD implementation:

- product category, series, and model
- material category/item
- accessory category/item
- reusable option set/value

It owns nine `masterdata_*` tables, the generic `MasterDataResource`/`MasterDataRecord` catalog backend, four grouped menu wrappers, product-category hierarchy/reference/concurrency protections, generated stable codes, logical delete, and the current masterdata tests.

Product model means the sales/catalog product identity only. Option sets/values are reusable value domains only. Field, process, formula, BOM, production, and DXF behavior are outside this runtime.

## R-11 Boundary

- Product model is a product identity and is never a process/craft plan.
- Process plan and immutable process-plan versions are separate engineering objects.
- Reusable option-set/option-value semantics are the current R-12A catalog runtime.
- Field definitions have exactly one owner: `SALES`, `TECH`, or `SYSTEM`.
- Field schemes have immutable published versions.
- Calculation exchanges canonical input/output documents and produces a generic decomposition node graph.
- Order version, technical version, calculation snapshot, technical release package, and production release version are distinct artifacts.
- Formula and DXF remain adapters behind those contracts and do not change order/technical schemas.

## R-12A Breaking Migration

R-12A replaces old table/API/resource/page/test semantics without compatibility aliases or dual writes. Strategy A deterministically preserves the inspected development rows. In particular:

- Remove the `工艺型号` display alias; `product-model` means `产品型号`.
- The inspected product-model rows remain product identities; process-like rows would be rejected rather than auto-migrated.
- Drop old sales-option category/value semantics and replace them with option sets/values.
- Keep the generic catalog CRUD only for the exact nine-resource allowlist; it does not accept lifecycle, field, process, calculation, or release commands.
- Preserve equivalent product hierarchy, reference locking, concurrency, exact-row-count, and validation evidence.

The executable R-12A migration is `sql/migrations/V20260720_007_masterdata_option_set_breaking_migration.sql`; validation lives in the two approved masterdata validation scripts.

## Golden Baseline

The first two scenarios are:

- `GS-9CM-SINGLE-001` — 9CM 标准单开
- `GS-9CM-DOUBLE-GRID-SPLICE-001` — 9CM 对开/分格拼接

Both use product model `PM-DOOR-9CM` and different process plans. Numerical inputs/expected results require later business sign-off and are `[not-run]` in R-11.

## R-12A Non-goals

- No sales-order, production, formula, calculation-engine, DXF, or drawing runtime.
- No old API/table/name/data compatibility.
- No field-definition/schema, process-scheme, sales-order, technical-order, formula, calculation snapshot, BOM, production, DXF, workstation, or mobile runtime.
- No customer-fund runtime change.
- No fixed main-leaf, secondary-leaf, grid, splice, or segment database columns.

## Phase Gate

`engineering-core-ready` remains incomplete until the destructive runtime slices and both signed golden samples pass. `beforeSalesOrder` depends on it and remains blocked.

## Acceptance Criteria

- Product model is a catalog identity and is displayed only as `产品型号`; no process-plan behavior is present.
- Option sets/values are reusable value domains, enforce required ownership and same-set unique codes, and do not own field/process metadata.
- The old sales-option API, resource keys, tables, menu, permission aliases, and compatibility paths are absent.
- Product hierarchy/reference/code-generation behavior and material/accessory catalog behavior remain covered by focused and live regression evidence.
- `engineeringCoreReady` and `beforeSalesOrder` remain blocked until later approved runtime and golden evidence are complete.

## Verification

- R-12A: focused Node/Java tests, Maven compile, Vue build, MySQL migration/validation, API/browser/menu/permission acceptance, reverse audit, and governance closeout.
- `npm run check` alone is not runtime proof.
