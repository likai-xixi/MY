# Request

R-10H product-category tree visual enhancement.

Scope is a small masterdata UI iteration. Improve readability of the product-category tree table only. Do not change backend rules, API clients, SQL migrations, product series/model/material/accessory/sales-option tables, customer runtime, idempotency runtime, or any sales-order/field-scheme/formula/technical-decomposition runtime.

Required outcome:

- Product category name column makes 1/2/3-level hierarchy easier to read.
- Increase perceived indentation and tree guidance.
- Keep the parent column hidden.
- Add lightweight level/path hints when useful.
- Keep product-category initial/reset search state collapsed, expand only the selected parent path after adding a child, and preserve current expansion state after edit/status/delete refresh.
- Shrink L1/L2/L3 tags so the category name remains the primary visual focus.
- Preserve R-10F/R-10G behavior: tree table, maximum depth 3, backend validation, PC auto code, self/descendant rejection, and child-protected delete.

Verification:

- `node --test tests/masterdata-runtime.test.js`
- `npm run check`
- `git diff --check`
- `npm --prefix ruoyi-ui run build:prod`
