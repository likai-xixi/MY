# 主数据配置 Screen Contract

## Route

`/masterdata`

Grouped menu routes:

- `/masterdata/product-config`
- `/masterdata/material-config`
- `/masterdata/accessory-config`
- `/masterdata/sales-option-config`

## States

- loading
- empty
- success
- error

## API Usage

- `/business/masterdata/{resource}/list`
- `/business/masterdata/{resource}/options`
- `/business/masterdata/{resource}/{id}`
- `/business/masterdata/{resource}`
- `/business/masterdata/{resource}/changeStatus`
- `/business/masterdata/{resource}/{ids}`
- `/business/masterdata/{resource}/export`

## Code Behavior

- Four thin route wrappers reuse `index.vue`; the active resource tabs are filtered by group.
- 产品配置 shows only 产品大类, 产品系列, and 工艺型号. Internal resource keys remain `product-category`, `product-series`, and `product-model`.
- 物料配置 shows only material category and material item.
- 配件配置 shows only accessory category and accessory item.
- 销售选项配置 shows only sales option category and sales option value.
- Add dialog: no required code input.
- Edit dialog: code is displayed read-only.
- List/search may continue to show and filter by code.
- 产品大类 list renders through the existing product-category tree table from `parentId`, hides the parent column, and keeps code/name/status search.
- 产品大类 parent selection blocks self, descendants, and any selection that would exceed three levels.

## Boundary

The screen provides only basic master-data maintenance for the nine R-10B resources and does not implement sales-order, field-scheme, formula, technical-decomposition, inventory, BOM, production, scan/report, drawing, shipment, finance, or receipt flows.
