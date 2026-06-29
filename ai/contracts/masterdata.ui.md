# Masterdata UI Ownership Contract

Feature ID: `masterdata`

## Owned Screen

- Route: `/masterdata`
- File: `ruoyi-ui/src/views/masterdata/index.vue`

## UI Scope

The screen provides grouped maintenance for the nine R-10B resources only. R-10I adjusts display labels only: `product-category` is shown as 产品大类 and `product-model` is shown as 工艺型号. Internal resource keys, API paths, and database table names remain unchanged.

- product category
- product series
- product model
- material category
- material item
- accessory category
- accessory item
- sales option category
- sales option value

## Required UI Capabilities

- search by code/name/status and relevant parent/category/series
- list
- add without a required code input; backend generates the code
- edit with code displayed read-only
- status change
- logical delete
- export

## Product Category Tree Table

产品大类 uses the existing `product-category` list API data with `parentId` to render a tree table. The parent-category column is hidden because the tree itself expresses hierarchy. The visible columns remain code, name, sort order, status, remark, create time, and actions.

产品大类 add/edit parent selection filters out the current row and descendants, and blocks selections that would exceed the three-level hierarchy limit.

## Boundary

The UI must not hard-code product-family examples or sales-option examples as branches. Opening mode, color, handle, lock, hinge, glass, surface treatment, and packaging are not product category hierarchy prompts; those concepts may appear only as later sales option configuration rows. This screen does not implement sales-order, field-scheme, formula, technical-decomposition, inventory, BOM, production, scan/report, drawing, shipment, finance, or receipt flows.
