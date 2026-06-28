# Plan

Mode: `contract-only`
Feature: `platform`

1. Record R-10A request and impact scope.
2. Create R-10A contracts for scope, API, DB, UI, permission, migration, contract-test matrix, and implementation boundary.
3. Keep the MVP limited to product category, product series, product model, material category, material record, accessory category, accessory record, sales option category, and sales option value.
4. Explicitly mark product families, product series/model examples, and sales-option examples as user-configured data rather than hard-coded runtime models.
5. Preserve non-goals: no field scheme, formula, calculation rule, technical template, sales order, inventory, BOM, production route, scanning/reporting, or drawing runtime.
6. Update current context and memory so the next Codex window can see the R-10A boundary.
7. Run `npm run resume`, `npm run check`, and `git diff --check`.
8. Audit changed paths to confirm no sales-order runtime and no Java/Vue/API/SQL runtime files were created.

## Explicit Non-goals

- No Java runtime.
- No Vue runtime.
- No API client runtime.
- No SQL migration or validation SQL.
- No sales-order runtime.
- No field scheme, formula, technical-template, inventory, BOM, production, scanning/reporting, drawing, shipment, finance, or receipt runtime.
- No package, tool, workflow, or production configuration change.
