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

## Explicit Non-ownership

This file does not own sales-order tables, field-scheme tables, formula tables, technical decomposition tables, inventory tables, BOM tables, production route tables, scan/report tables, drawing-task tables, shipment tables, finance tables, or receipt tables.
