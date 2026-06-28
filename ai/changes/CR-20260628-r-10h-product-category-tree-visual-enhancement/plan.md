# Plan

1. Confirm R-10G baseline and local/remote alignment.
2. Create R-10H UI-only change record.
3. Inspect product-category tree table rendering in `ruoyi-ui/src/views/masterdata/index.vue`.
4. Add focused name-column visual hierarchy enhancements for product category only.
5. Replace product-category full default expansion with controlled expansion state for initial load, reset search, add-child, search, edit, status, and delete flows.
6. Shrink product-category L1/L2/L3 tags so names remain the primary visual focus.
7. Add or update focused structure tests if needed.
8. Update masterdata docs and handoff memory.
9. Run `node --test tests/masterdata-runtime.test.js`, `npm run check`, `git diff --check`, and `npm --prefix ruoyi-ui run build:prod`.

No backend, API client, SQL, package, tool, workflow, customer, idempotency, security, sales-order, field-scheme, formula, or technical-decomposition runtime files may be changed.
