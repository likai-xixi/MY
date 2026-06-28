# Boundary Exception

Scope: `CR-20260628-r-10g-product-category-tree-live-acceptance`

R-10G is an acceptance-only masterdata closeout. It does not add frontend routes, customer runtime business logic, masterdata runtime code, sales-order runtime code, or cross-feature frontend imports.

The boundary checker is current-change scoped, so the inherited exact-path exception must be carried into this CR to keep pre-existing RuoYi platform/router/tool-generator files from blocking unrelated live-acceptance evidence. These files are pre-existing RuoYi built-in router/generator files, are outside customer, masterdata, and sales-order runtime, and are not introduced by this change.

The exception is limited to these exact paths:

- `ruoyi-ui/src/router/index.js`
- `ruoyi-ui/src/views/tool/gen/editTable.vue`
- `ruoyi-ui/src/views/tool/gen/genInfoForm.vue`
