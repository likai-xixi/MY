# Masterdata API Ownership Contract

Feature ID: `masterdata`

## Owned API Base

- `/business/masterdata`

## Owned Resource Values

- `product-category`
- `product-series`
- `product-model`
- `material-category`
- `material-item`
- `accessory-category`
- `accessory-item`
- `sales-option-category`
- `sales-option-value`

## Owned Endpoints

- `GET /business/masterdata/{resource}/list`
- `GET /business/masterdata/{resource}/options`
- `GET /business/masterdata/{resource}/{id}`
- `POST /business/masterdata/{resource}`
- `PUT /business/masterdata/{resource}`
- `PUT /business/masterdata/{resource}/changeStatus`
- `DELETE /business/masterdata/{resource}/{ids}`
- `POST /business/masterdata/{resource}/export`

## Runtime Rules

- `itemCode` is the stable business reference and is saved trimmed and uppercased.
- `itemName` is the display name and is saved trimmed.
- Empty code/name and duplicate code are rejected.
- Code is immutable after creation.
- Remove is logical delete.
- Publish permission is reserved; full publish/version flow is deferred.

## Explicit Exclusions

This API contract does not own sales-order, field-scheme, formula, technical-decomposition, inventory, BOM, production, scan/report, drawing, shipment, finance, or receipt APIs.
