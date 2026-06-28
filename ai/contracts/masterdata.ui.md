# Masterdata UI Ownership Contract

Feature ID: `masterdata`

## Owned Screen

- Route: `/masterdata`
- File: `ruoyi-ui/src/views/masterdata/index.vue`

## UI Scope

The screen provides tabbed maintenance for the nine R-10B resources only:

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
- add
- edit
- status change
- logical delete
- export

## Boundary

The UI must not hard-code product-family examples or sales-option examples as branches. Those concepts may appear only as configurable rows entered by users or later seed data. This screen does not implement sales-order, field-scheme, formula, technical-decomposition, inventory, BOM, production, scan/report, drawing, shipment, finance, or receipt flows.
