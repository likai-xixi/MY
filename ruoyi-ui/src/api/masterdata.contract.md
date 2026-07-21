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
- `option-set`
- `option-value`

Display labels may differ from resource keys. The frontend displays `product-category`, `product-series`, and `product-model` as 产品大类, 产品系列, and 产品型号. It displays the option resources as 选项集 and 选项值.

The removed legacy option resource keys are rejected. There is no alias, redirect, fallback reader, or dual write.

## Operations

- `GET /business/masterdata/{resource}/list`
- `GET /business/masterdata/{resource}/options`
- `GET /business/masterdata/{resource}/{id}`
- `POST /business/masterdata/{resource}`
- `PUT /business/masterdata/{resource}`
- `PUT /business/masterdata/{resource}/changeStatus`
- `DELETE /business/masterdata/{resource}/{ids}`
- `POST /business/masterdata/{resource}/export`

## Code Rule

- `POST /business/masterdata/{resource}` does not require caller-supplied code.
- If create payload contains `itemCode`, the backend ignores it and generates `prefix + yyyyMM + 6 digit monthly sequence`.
- `PUT /business/masterdata/{resource}` keeps the existing code immutable.
- New option-set and option-value codes use `OS` and `OV`. Preserved migrated codes remain immutable historical data.

## Option Contract

- `option-set.selectionMode` is required and accepts exactly `SINGLE` or `MULTIPLE`.
- `option-value.optionSetId` is required and identifies its owning set; it never reuses `categoryId`.
- Lists are ordered by `sortOrder` and then stable id/code.
- Disabling a set does not cascade to values.
- Deleting a set is rejected while any non-deleted value exists, including disabled values.
- `option-value/options` excludes values owned by a disabled set. Maintenance list/detail may still show those existing values.

## R-10F Product Category Hierarchy

- `product-category` rows use `parentId` to render a tree table in the masterdata page.
- `product-category` create/edit is limited to maximum depth 3 and rejects self/descendant parent choices.
- `product-category` delete is rejected while active child categories exist.

## Boundary

The API client does not call sales-order, field-scheme, formula, technical-decomposition, inventory, BOM, production, scan/report, drawing, shipment, finance, or receipt APIs.
