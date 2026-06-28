# Request

Implement R-10B masterdata MVP runtime for product, material, accessory, and sales-option master data.

## Scope

This runtime change may implement only these nine master-data objects:

1. product category (`product_category`)
2. product series (`product_series`)
3. product model (`product_model`)
4. material category (`material_category`)
5. material item (`material_item`)
6. accessory category (`accessory_category`)
7. accessory item (`accessory_item`)
8. sales option category (`sales_option_category`)
9. sales option value (`sales_option_value`)

## Hard Boundaries

- Do not implement sales-order runtime.
- Do not implement field schemes, formulas, formula variables, formula groups, calculation rules, technical decomposition templates, part templates, inventory, BOM, production routes, scanning/reporting, drawing tasks, shipment, finance, or receipt flows.
- Keep product families, product types, opening modes, colors, hardware, glass, surface treatment, packaging, and material-system names as configurable data rows, never Java enums, Vue branches, SQL model families, route families, or permission families.
- Use MySQL executable migrations and logical delete behavior for R-10B master data.
