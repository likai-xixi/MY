# Masterdata SQL/Menu/Permission Ownership

Feature ID: `masterdata`
Feature name: 主数据配置

## Owned Runtime Tables

- `masterdata_product_category`
- `masterdata_product_series`
- `masterdata_product_model`
- `masterdata_material_category`
- `masterdata_material_item`
- `masterdata_accessory_category`
- `masterdata_accessory_item`
- `masterdata_sales_option_category`
- `masterdata_sales_option_value`

## Owned SQL Files

- `sql/migrations/V20260628_005_masterdata_r10_schema.sql`
- `sql/migrations/V20260628_006_masterdata_r10_menu_permission.sql`
- `sql/validation/masterdata_runtime_validation.sql`

## Owned Menu And Permission Codes

- menu path `业务管理 / 主数据配置 / 产品配置`
- menu path `业务管理 / 主数据配置 / 物料配置`
- menu path `业务管理 / 主数据配置 / 配件配置`
- menu path `业务管理 / 主数据配置 / 销售选项配置`
- `business:masterdata:list`
- `business:masterdata:query`
- `business:masterdata:add`
- `business:masterdata:edit`
- `business:masterdata:remove`
- `business:masterdata:export`
- `business:masterdata:status`
- `business:masterdata:publish`

## Delete And Reference Rule

R-10B uses logical delete through `del_flag = '2'`. Later order, technical, inventory, BOM, production, drawing, shipment, finance, or receipt references must preserve code/name snapshots and must not require physical deletion of master-data rows.

Current owned references are protected in application transactions: referenced parents and delete targets are locked in resource/id order, and deletion is rejected for the seven category/series/item relationships recorded in `ai/contracts/masterdata.delete-ownership.md`. Disabled rows still count as references while `del_flag = '0'`; validation SQL reports any active orphan created by direct database writes.

Product-category hierarchy mutations first lock the permanent hidden `masterdata_product_category` row with `category_id = -1`, then lock the complete active category set before depth/cycle validation. Every category graph traversal fails closed on a repeated id. The migration creates or repairs that logically deleted mutex row idempotently; normal business queries exclude it. Product-series category changes are rejected while active models reference the series, and validation SQL reports a missing mutex, any active category unreachable from a root or deeper than level three, active orphans, and any model whose category differs from its active series category.

## R-10D Code Generation Rule

R-10D does not add tables or change the SQL schema. Existing unique code keys remain the uniqueness guard while backend service code generates `prefix + yyyyMM + 6 digit monthly sequence` values per resource/month.

## Explicit Non-ownership

This file does not own sales-order tables, field-scheme tables, formula tables, technical decomposition tables, inventory tables, BOM tables, production route tables, scan/report tables, drawing-task tables, shipment tables, finance tables, or receipt tables.
