# Masterdata RuoYi API Contract

Feature ID: `masterdata`

## API Client

- `ruoyi-ui/src/api/masterdata.js`

## Resource Paths

The frontend uses `/business/masterdata/{resource}` where `{resource}` is one of:

- `product-category`
- `product-series`
- `product-model`
- `material-category`
- `material-item`
- `accessory-category`
- `accessory-item`
- `sales-option-category`
- `sales-option-value`

## Operations

- `GET /business/masterdata/{resource}/list`
- `GET /business/masterdata/{resource}/options`
- `GET /business/masterdata/{resource}/{id}`
- `POST /business/masterdata/{resource}`
- `PUT /business/masterdata/{resource}`
- `PUT /business/masterdata/{resource}/changeStatus`
- `DELETE /business/masterdata/{resource}/{ids}`
- `POST /business/masterdata/{resource}/export`

## Boundary

The API client does not call sales-order, field-scheme, formula, technical-decomposition, inventory, BOM, production, scan/report, drawing, shipment, finance, or receipt APIs.
