# Masterdata UI Ownership Contract

Feature ID: `masterdata`

## Owned Screen

- Route: `/masterdata`
- File: `ruoyi-ui/src/views/masterdata/index.vue`

## UI Scope

The masterdata screens provide grouped maintenance for exactly nine resources. Product configuration displays `product-category`, `product-series`, and `product-model` as 产品大类、产品系列、产品型号. Option configuration uses `option-set` and `option-value`; old sales-option resource keys and routes are unavailable. R-10J's self-developed category tree-select behavior remains unchanged.

- product category
- product series
- product model
- material category
- material item
- accessory category
- accessory item
- option set
- option value

## Required UI Capabilities

- search by code/name/status and relevant parent/category/series
- list
- add without a required code input; backend generates the code
- edit with code displayed read-only
- status change
- logical delete
- export
- option-set `selectionMode` maintenance with exactly SINGLE/单选 and MULTIPLE/多选
- option-value ownership through required `optionSetId`

## Product Category Tree Table

产品大类 uses the existing `product-category` list API data with `parentId` to render a tree table. The parent-category column is hidden because the tree itself expresses hierarchy. The visible columns remain code, name, sort order, status, remark, create time, and actions.

产品大类 add/edit parent selection filters out the current row and descendants, and blocks selections that would exceed the three-level hierarchy limit.

## Self-Developed Category Tree Select Rule

For self-developed business modules, any field named 分类、上级分类、所属分类, or 父级分类 must render as a tree select when the target category resource is explicitly marked with hierarchy capability by `treeEnabled`, `parentEnabled`, or `treeSelectEnabled`.

- The tree-select decision is resource-config driven. Existing non-empty `parentId` rows may be used to build the tree data, but they must not be the primary reason the UI switches between select and tree select.
- Tree selects default collapsed.
- The UI must not use `default-expand-all` for tree selects.
- The UI must not configure default all-expanded keys for tree selects.
- Tree-select labels display code plus name.
- Tree selects must allow both parent and child nodes to be selected unless an explicit business rule disables that node.
- A tree node must not become disabled merely because it has `children`.
- Parent-category selection must reject the current row, child rows, and descendants.
- When a resource declares a maximum depth, the frontend prompt and backend validation must both remain in place.
- The rule applies to self-developed business modules only. It does not change RuoYi native platform features such as system management, system departments, or system dictionaries.

Current masterdata behavior:

- 产品大类的上级分类 uses tree select because `product-category` is hierarchical.
- 产品系列的所属产品大类 uses tree select because its target `product-category` is hierarchical.
- 产品型号的所属产品大类 uses tree select because its target `product-category` is hierarchical.
- 原材料档案的物料分类、配件档案的配件分类, and 选项值的所属选项集 remain normal selects because those targets do not enable hierarchy.

Material wording:

- `material-item` is displayed as 原材料档案.
- 原材料档案 only maintains base materials and must not maintain order-specific cutting dimensions.
- Order-specific material usage is generated later by BOM, cut-list detail, or technical calculation.
- Every order's sheet dimensions or profile lengths must not be created as 原材料档案 rows.
- Current 原材料档案 fields stay simple: 名称、所属分类、规格、单位、排序、状态、备注.
- 规格 means the material's own specification, such as thickness, cross-section, or whole-sheet specification; it is not an order cutting size.

## Boundary

The UI must not hard-code product-family or option examples as branches. Opening mode, color, handle, lock, hinge, glass, surface treatment, and packaging are reusable option-set/value data, not product category hierarchy prompts. This screen does not implement sales-order, field-definition/schema, process-scheme, formula, technical-decomposition, inventory, BOM, cut-list detail, technical calculation output, production, DXF, scan/report, drawing, shipment, finance, or receipt flows.
