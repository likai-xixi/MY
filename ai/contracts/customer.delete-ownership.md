# 客户管理 Delete Ownership Contract

Feature ID: `customer`

## Deletion Preconditions

- Run deletion dry-run before applying removal.
- Stop deletion if any external module still depends on this feature's API, UI, database, permission, component, or internal code.
- Delete only files registered under feature ownership or adapter-generated ownership paths.

## Must Be Listed Before Removal

- Backend: controller, service, service impl, mapper, domain objects, mapper XML, `ruoyi-business` Maven module wiring.
- Frontend: `/customer` page, `ruoyi-ui/src/api/customer.js`, customer screen contract docs.
- Data: all nine customer-owned tables, SQL ownership file, public customer seed rows, menu and permission rows.
- Graph and memory: API graph, UI graph, module graph, API catalog, feature registry, module registry, DB registry, permission registry, memory and handover.

## Removal Rule

Removal can only be applied after `删除功能预分析：客户管理` identifies no external dependencies from sales order, shipment, finance, settlement, or reporting modules. Until those modules exist and are analyzed, normal business deletion is customer stop/logical delete, not physical removal.

## Verification

- `npm run feature:remove -- <feature> --dry-run`
- `npm run feature:remove -- <feature> --apply --confirm <feature>`
- `npm run check:orphan -- <feature>`
- `npm run check`
