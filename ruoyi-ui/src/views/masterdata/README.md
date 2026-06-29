# 主数据配置 RuoYi Frontend Ownership

Feature ID: `masterdata`

This folder owns the R-10B masterdata maintenance page and the grouped menu wrappers that reuse it.

- `index.vue` contains the shared masterdata CRUD/table/dialog logic.
- `product-config.vue`, `material-config.vue`, `accessory-config.vue`, and `sales-option-config.vue` are thin route wrappers that select a resource group.
- The grouped pages may maintain only the nine R-10B master-data objects.
- 产品配置 shows 产品大类, 产品系列, and 工艺型号 while keeping internal resource keys `product-category`, `product-series`, and `product-model`.
- 物料配置 shows 物料分类 and 原材料档案.
- 原材料档案 only maintains base materials. It does not maintain order-specific cutting dimensions; those are generated later by BOM, cut-list detail, or technical calculation.
- Do not create every order's sheet dimensions or profile lengths as 原材料档案 rows. The 规格 field means the material's own specification, such as thickness, cross-section, or whole-sheet specification.
- 配件配置 shows accessory category and accessory item.
- 销售选项配置 shows sales option category and sales option value.
- R-10J requires self-developed business category fields to use tree select when the target resource explicitly enables `treeEnabled`, `parentEnabled`, or `treeSelectEnabled`. Product category parent selection and product series/model category selection use tree select through this shared rule.
- Tree selects default collapsed, do not use `default-expand-all`, do not set default all-expanded keys, and display code plus name labels.
- Tree selects allow parent and child nodes to be selected; nodes are disabled only by explicit business rules such as self/descendant selection or maximum hierarchy depth.
- The rule does not change RuoYi native platform screens such as system management, system departments, or system dictionaries.
- Add does not show a required code input; the backend generates code.
- Edit shows code as read-only.
- 产品大类 uses the existing product-category tree table and allows at most three hierarchy levels.
- 产品大类 parent selection excludes the current category and descendants.
- Product families, product types, and sales option examples are data rows, not UI branches.
- Sales-order, field-scheme, formula, and technical-decomposition runtime must stay out of this folder.
