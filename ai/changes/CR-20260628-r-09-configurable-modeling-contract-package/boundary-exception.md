# Boundary Exception

Scope: `CR-20260628-r-09-configurable-modeling-contract-package`

R-09 is a contract-only configurable modeling package. It does not add frontend routes, customer runtime business logic, sales-order runtime code, or cross-feature frontend imports.

The boundary checker is current-change scoped, so the R-09A.3/R-09A.4 exact-path exception must be carried into this CR to keep inherited RuoYi platform/router/tool-generator files from blocking unrelated contract closeout. These files are pre-existing RuoYi built-in router/generator files, are outside customer and sales-order runtime, and are not introduced by this change.

The exception is limited to these exact paths:

- `ruoyi-ui/src/router/index.js`
- `ruoyi-ui/src/views/tool/gen/editTable.vue`
- `ruoyi-ui/src/views/tool/gen/genInfoForm.vue`
