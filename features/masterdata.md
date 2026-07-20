# Feature Brief: 主数据配置

## Identity

- ID: `masterdata`
- Name: 主数据配置
- Current runtime baseline: R-10B through R-10J
- Future architecture authority: R-11 `ai/contracts/engineering-core.*`

## Current Runtime Truth

The active runtime still exposes nine resources through `/business/masterdata/{resource}` and one shared CRUD implementation:

- product category, series, and model
- material category/item
- accessory category/item
- sales option category/value

It owns nine `masterdata_*` tables, the generic `MasterDataResource`/`MasterDataRecord` backend, four grouped menu wrappers, product-category hierarchy/reference/concurrency protections, generated stable codes, logical delete, and the current masterdata tests.

This as-is truth remains valid until the R-11 destructive migration is executed. It is not the approved future model.

## R-11 Future Outcome

- Product model is a product identity and is never a process/craft plan.
- Process plan and immutable process-plan versions are separate engineering objects.
- Sales option category/value is replaced by reusable option-set/option-value semantics.
- Field definitions have exactly one owner: `SALES`, `TECH`, or `SYSTEM`.
- Field schemes have immutable published versions.
- Calculation exchanges canonical input/output documents and produces a generic decomposition node graph.
- Order version, technical version, calculation snapshot, technical release package, and production release version are distinct artifacts.
- Formula and DXF remain adapters behind those contracts and do not change order/technical schemas.

## Breaking Migration

The future runtime replaces old table/API/resource/page/test semantics without compatibility aliases or dual writes. Development reset is the default. In particular:

- Remove the `工艺型号` display alias; `product-model` means `产品型号`.
- Classify ambiguous current product-model rows before import; process-like rows are not auto-migrated as products.
- Drop sales-option category/value semantics and rebuild them as option sets/values.
- Retire the generic nine-resource controller/DTO/mapper/page after explicit bounded replacements are green.
- Preserve equivalent product hierarchy, reference locking, concurrency, exact-row-count, and validation evidence.

The executable sequence and exact current-surface matrix live in `ai/contracts/engineering-core.migration-plan.md`.

## Golden Baseline

The first two scenarios are:

- `GS-9CM-SINGLE-001` — 9CM 标准单开
- `GS-9CM-DOUBLE-GRID-SPLICE-001` — 9CM 对开/分格拼接

Both use product model `PM-DOOR-9CM` and different process plans. Numerical inputs/expected results require later business sign-off and are `[not-run]` in R-11.

## Non-goals In R-11

- No sales-order, production, formula, calculation-engine, DXF, or drawing runtime.
- No Java, Vue, SQL, API client, route, permission, graph, or runtime test change.
- No old API/table/name/data compatibility.
- No fixed main-leaf, secondary-leaf, grid, splice, or segment database columns.

## Phase Gate

`engineering-core-ready` remains incomplete until the destructive runtime slices and both signed golden samples pass. `beforeSalesOrder` depends on it and remains blocked.

## Acceptance Criteria

- The R-11 contract index is authoritative over conflicting future-state R-09 concepts while current R-10 ownership docs remain truthful as-is evidence.
- Product model and process plan/version are separate identities; both 9CM scenarios share one product model and use different process plans.
- Option sets/values do not own technical fields; every field definition has one `SALES`, `TECH`, or `SYSTEM` owner.
- Calculation and release contracts use generic documents/nodes plus immutable versions/hashes, without fixed leaf/segment columns or generic release CRUD.
- `engineeringCoreReady` and `beforeSalesOrder` remain blocked until their required runtime/golden evidence is complete.
- R-11 changes no Java, Vue, SQL, API client, route, permission, graph, formula, DXF, sales-order, or production runtime.

## Verification

- R-11: contract/review/roadmap/phase-gate tests plus `npm run check`.
- Future runtime: bounded unit/integration/UI/migration/golden evidence; `npm run check` alone is not runtime proof.
