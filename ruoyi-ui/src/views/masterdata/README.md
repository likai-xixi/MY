# 主数据配置 RuoYi Frontend Ownership

Feature ID: `masterdata`

This folder owns the R-10B masterdata maintenance page and the grouped menu wrappers that reuse it.

- `index.vue` contains the shared masterdata CRUD/table/dialog logic.
- `product-config.vue`, `material-config.vue`, `accessory-config.vue`, and `sales-option-config.vue` are thin route wrappers that select a resource group.
- The grouped pages may maintain only the nine R-10B master-data objects.
- 产品配置 shows 产品大类, 产品系列, and 工艺型号 while keeping internal resource keys `product-category`, `product-series`, and `product-model`.
- 物料配置 shows material category and material item.
- 配件配置 shows accessory category and accessory item.
- 销售选项配置 shows sales option category and sales option value.
- Add does not show a required code input; the backend generates code.
- Edit shows code as read-only.
- 产品大类 uses the existing product-category tree table and allows at most three hierarchy levels.
- 产品大类 parent selection excludes the current category and descendants.
- Product families, product types, and sales option examples are data rows, not UI branches.
- Sales-order, field-scheme, formula, and technical-decomposition runtime must stay out of this folder.
