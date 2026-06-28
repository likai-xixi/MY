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

Each object exposes stable code, display name, status, sort order, and remark. Material and accessory items also expose specification and unit. Relationship fields stay data-driven through category/series ids.

## Non-goals

- No sales-order runtime.
- No field scheme or field-scheme binding.
- No formula variables, formula groups, calculation rules, or process engines.
- No technical decomposition templates or part templates.
- No inventory deduction, BOM, production route, scanning/reporting, drawing task, shipment, finance, or receipt flow.
- No hard-coded product-family, product-series, opening-mode, color, hardware, glass, surface-treatment, packaging, or material-system branches.

## Acceptance Criteria

- MySQL migrations create the nine masterdata tables and RuoYi menu/permission rows.
- Backend APIs support list, options, detail, add, edit, status change, logical delete, and export under `/business/masterdata/{resource}`.
- The Vue page provides search, list, add, edit, status change, delete, and export for the nine resources.
- API/UI/SQL/permission/test ownership is registered in feature and module registries, graphs, generated scans, memory, and handover.
- `beforeSalesOrder` remains blocked and no sales-order runtime is created.

## Verification

- `npm run scan:all`
- `npm run finalize:change`
- `npm run check`
- `git diff --check`
- `mvn -pl ruoyi-admin -am -DskipTests compile`
- `npm --prefix ruoyi-ui run build:prod`
