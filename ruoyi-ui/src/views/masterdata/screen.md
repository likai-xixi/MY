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
- 物料配置 shows only 物料分类 and 原材料档案.
- 原材料档案 only maintains base materials. It does not maintain order-specific cutting dimensions.
- Order-specific material usage is generated later by BOM, cut-list detail, or technical calculation; every order's sheet dimensions or profile lengths must not become 原材料档案 rows.
- 原材料档案的规格 means the material's own specification, such as thickness, cross-section, or whole-sheet specification, not order cutting size.
- 配件配置 shows only accessory category and accessory item.
- 销售选项配置 shows only sales option category and sales option value.
- R-10J tree-select switching is explicit-resource-config driven. Category targets marked with `treeEnabled`, `parentEnabled`, or `treeSelectEnabled` render as default-collapsed tree selects with code plus name labels.
- Tree selects allow parent and child nodes to be selected; nodes are not disabled merely because they have `children`.
- 产品大类的上级分类、产品系列的所属产品大类, and 工艺型号的所属产品大类 use tree select because `product-category` is hierarchical.
- 原材料档案、配件档案, and 销售选项值 can continue normal category selects while their target category resources do not enable hierarchy.
- Add dialog: no required code input.
- Edit dialog: code is displayed read-only.
- List/search may continue to show and filter by code.
- 产品大类 list renders through the existing product-category tree table from `parentId`, hides the parent column, and keeps code/name/status search.
- 产品大类 parent selection blocks self, descendants, and any selection that would exceed three levels.

## Boundary

The screen provides only basic master-data maintenance for the nine R-10B resources and does not implement sales-order, field-scheme, formula, technical-decomposition, inventory, BOM, cut-list detail, technical calculation output, production, DXF, scan/report, drawing, shipment, finance, or receipt flows.
