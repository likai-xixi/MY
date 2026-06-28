# Request

R-10G product-category tree live acceptance.

This change records runtime acceptance evidence for the already-published R-10F product category tree table and hierarchy constraints. It must not change Java runtime, Vue runtime, API clients, SQL migrations, sales-order runtime, field-scheme runtime, formula runtime, or technical-decomposition runtime.

Baseline commit:

- `770784f07335c2ff90c2c8c89f99456e8d76c22f`

Acceptance goals:

- Verify local backend, frontend, MySQL, and Redis runtime stack.
- Open `/business/masterdata`.
- Verify product category renders as a tree table.
- Verify 1/2/3-level product category creation, PC auto code generation, level-four backend rejection, self/descendant parent rejection, child-protected delete, and non-cascading disable behavior.
- Sample product series, product model, material, accessory, and sales option value pages.
- Confirm `beforeSalesOrder` remains blocked and forbidden future runtime remains absent.
