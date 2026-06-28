# Feature Brief: 主数据配置

## Identity

- ID: `masterdata`
- Name: 主数据配置

## Product Outcome

Operators can maintain the configurable master-data base required before later sales configuration, technical decomposition, production, inventory, and finance work begins.

## MVP Scope

R-10B implements only these nine maintenance objects:

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

## Non-goals

- No sales-order runtime.
- No field scheme or field-scheme binding.
- No formula variables, formula groups, calculation rules, or process engines.
- No technical decomposition templates or part templates.
- No inventory deduction, BOM, production route, scanning/reporting, drawing task, shipment, finance, or receipt flow.
- No hard-coded product-family, product-series, opening-mode, color, hardware, glass, surface-treatment, packaging, or material-system branches.
- Opening mode, color, handle, lock, hinge, glass, surface treatment, and packaging remain sales option data, not product category hierarchy guidance.

## Acceptance Criteria

- MySQL migrations create the nine masterdata tables and RuoYi menu/permission rows.
- Backend APIs support list, options, detail, add, edit, status change, logical delete, and export under `/business/masterdata/{resource}`.
- Add does not require or trust caller-entered code; the backend generates the code and retries bounded duplicate-key collisions.
- Edit keeps the original code immutable even if the payload contains a different code.
- The Vue page provides search, list, add without code input, edit with read-only code, status change, delete, and export for the nine resources.
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
