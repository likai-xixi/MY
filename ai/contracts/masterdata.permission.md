# Masterdata Permission Contract

Feature ID: `masterdata`

## Owned Permission Codes

- `business:masterdata:list`
- `business:masterdata:query`
- `business:masterdata:add`
- `business:masterdata:edit`
- `business:masterdata:remove`
- `business:masterdata:export`
- `business:masterdata:status`
- `business:masterdata:publish`

## Boundary Rules

- List/query, add, edit, remove, export, status, and publish boundaries are explicit.
- R-10B implements basic status change and logical delete.
- `business:masterdata:publish` is reserved for the later publish/version workflow; ordinary edit permission must not be treated as publish permission.
- Permission names must stay generic to masterdata and must not encode product-family or option-value examples.

## Explicit Exclusions

This contract does not create sales-order, field-scheme, formula, technical-decomposition, inventory, BOM, production, scan/report, drawing, shipment, finance, or receipt permissions.
