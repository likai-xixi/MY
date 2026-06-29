# Feature Brief: 主数据配置

## Identity

- ID: `masterdata`
- Name: 主数据配置

## Product Outcome

Operators can maintain the configurable master-data base required before later sales configuration, technical decomposition, production, inventory, and finance work begins.

## MVP Scope

R-10B implements only these nine maintenance objects. User-facing product labels are 产品大类, 产品系列, and 工艺型号; internal resource keys remain `product-category`, `product-series`, and `product-model`.

- product category
- product series
- product model
- material category
- material item
- accessory category
- accessory item
- sales option category
- sales option value

Each object exposes backend-generated stable code, display name, status, sort order, and remark. Material and accessory items also expose specification and unit. Relationship fields stay data-driven through category/series ids.

R-10D code generation format is `prefix + yyyyMM + 6 digit monthly sequence`. Prefixes are `PC`, `PS`, `PM`, `MC`, `MI`, `AC`, `AI`, `SOC`, and `SOV` for product category, product series, product model, material category, material item, accessory category, accessory item, sales option category, and sales option value respectively.

R-10F presents product category as a tree table and limits the product category hierarchy to three levels. The backend rejects level-four categories, self-parenting, descendant-parent cycles, and deletion of a category that still has child categories.

R-10H keeps the same product-category business rules and improves only tree-table readability in the name column with clearer indentation, branch guidance, smaller L1/L2/L3 level tags, path tooltip hints, and controlled expansion state.

R-10I keeps the grouped menu split and adjusts product-facing display wording: 产品配置 contains 产品大类, 产品系列, and 工艺型号. 工艺型号 is still the existing `product-model` resource and `masterdata_product_model` table; formula, drawing, part template, and route runtime are deferred.

R-10J defines the project-level self-developed business category selection rule. In self-developed business modules, any field named 分类、上级分类、所属分类, or 父级分类 must use a tree select when the target category resource is explicitly marked as hierarchical through `treeEnabled`, `parentEnabled`, or `treeSelectEnabled`. The rule is configuration-driven, not data-driven: current rows with or without non-empty `parentId` must not cause the control type to switch unexpectedly. Tree selects default collapsed, must not use `default-expand-all`, must not configure default all-expanded keys, and show labels as code plus name. Parent-category selection must reject the current row, child rows, and descendants. When a maximum hierarchy depth exists, frontend prompts and backend validation must both remain. This rule applies to self-developed business modules and does not change RuoYi native platform screens such as system management, system departments, or system dictionaries.

R-10J bugfix rule: tree selects must allow both parent and child nodes to be selected unless an explicit business rule disables that node. A node must not become disabled merely because it has `children`; product category parent selection is disabled only for self, descendants, or selections that would exceed the maximum hierarchy depth.

## Non-goals

- No sales-order runtime.
- No field scheme or field-scheme binding.
- No formula variables, formula groups, calculation rules, or process engines.
- No technical decomposition templates or part templates.
- No inventory deduction, BOM, cut-list detail, technical calculation output, production route, scanning/reporting, drawing task, shipment, finance, or receipt flow.
- No hard-coded product-family, product-series, opening-mode, color, hardware, glass, surface-treatment, packaging, or material-system branches.
- Opening mode, color, handle, lock, hinge, glass, surface treatment, and packaging remain sales option data, not product category hierarchy guidance.

## Acceptance Criteria

- MySQL migrations create the nine masterdata tables and RuoYi menu/permission rows.
- Backend APIs support list, options, detail, add, edit, status change, logical delete, and export under `/business/masterdata/{resource}`.
- RuoYi menus expose `业务管理 / 主数据配置 / 产品配置`, `物料配置`, `配件配置`, and `销售选项配置` as four grouped pages.
- 产品配置 shows only 产品大类、产品系列、工艺型号.
- 物料配置 shows only 物料分类、原材料档案.
- 配件配置 shows only 配件分类、配件档案.
- 销售选项配置 shows only 销售选项分类、销售选项值.
- The frontend reuses the current masterdata page logic through thin grouped route wrappers and keeps `ruoyi-ui/src/api/masterdata.js` unchanged.
- Add does not require or trust caller-entered code; the backend generates the code and retries bounded duplicate-key collisions.
- Edit keeps the original code immutable even if the payload contains a different code.
- The Vue page provides search, list, add without code input, edit with read-only code, status change, delete, and export for the nine resources.
- Self-developed hierarchical category selections use a tree select by explicit target resource config, default collapsed, without `default-expand-all` or default all-expanded keys, and with code-plus-name labels.
- Hierarchical tree selects use strict node selection so parent categories and child categories can both be chosen unless an explicit business rule disables the node.
- 产品大类的上级分类、产品系列的所属产品大类, and 工艺型号的所属产品大类 use tree select because `product-category` is hierarchical.
- 原材料档案的物料分类、配件档案的配件分类, and 销售选项值的销售选项分类 can remain normal selects while their category targets do not enable hierarchy, but the shared UI switches automatically when those target resources later enable `treeEnabled`, `parentEnabled`, or `treeSelectEnabled`.
- 原材料档案 only maintains base materials. It must not maintain order-specific cutting dimensions.
- Order-specific material usage is generated later by BOM, cut-list detail, or technical calculation.
- Do not create every order's sheet dimensions or profile lengths as 原材料档案 rows.
- 原材料档案 fields stay simple: 名称、所属分类、规格、单位、排序、状态、备注.
- 原材料档案的规格 means the material's own specification, such as thickness, cross-section, or whole-sheet specification; it does not mean order cutting size.
- Product category list displays as a tree table with code, name, sort order, status, remark, create time, and actions; the parent column is hidden because hierarchy is visible in the tree.
- Product category tree names show clearer hierarchy with smaller level hints, stronger indentation, branch guidance, path tooltip context, and controlled expand/collapse state.
- Product category initial load and reset search keep child rows collapsed; adding a child expands only the selected parent path; edit/delete refresh preserves current expansion state.
- Product category add/edit parent selection cannot exceed three levels and cannot select the current category or its descendants.
- API/UI/SQL/permission/test ownership is registered in feature and module registries, graphs, generated scans, memory, and handover.
- `beforeSalesOrder` remains blocked and no sales-order runtime is created.

## Verification

- `npm run scan:all`
- `npm run finalize:change`
- `npm run check`
- `git diff --check`
- `mvn -pl ruoyi-admin -am -DskipTests compile`
- `npm --prefix ruoyi-ui run build:prod`
