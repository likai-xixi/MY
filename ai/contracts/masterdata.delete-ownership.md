# Masterdata Delete Ownership Contract

Feature ID: `masterdata`

## Runtime Delete Behavior

R-10B remove APIs use logical delete by setting `del_flag = '2'`.

## Future Reference Protection

When later orders, technical results, inventory, BOM, production, drawing, shipment, finance, or receipt data reference master data, physical deletion remains forbidden. Those downstream records must preserve code/name snapshots and must not depend only on mutable ids.

## Feature Removal Preconditions

A future feature removal must run deletion dry-run first and account for:

- backend controller, service, domain, mapper, and XML files
- frontend page and API client
- nine database tables
- SQL migrations and validation SQL
- RuoYi menu and permission rows
- feature/module registries
- API/UI/module graphs
- generated scans
- memory and handover files
