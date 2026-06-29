# Boundary Exception

Scope: `CR-20260628T142217Z-change`

This change is a focused masterdata navigation split. It adds four thin masterdata route wrappers that reuse `ruoyi-ui/src/views/masterdata/index.vue`; it does not add backend runtime code, sales-order runtime code, or cross-feature frontend imports.

The boundary checker is current-change scoped, so the inherited exact-path exception must be carried into this CR to keep pre-existing RuoYi platform/router/tool-generator files from blocking unrelated masterdata UI evidence. These files are pre-existing RuoYi built-in router/generator files, are outside customer, masterdata, and sales-order runtime, and are not introduced by this change.

The exception is limited to these exact paths:

- `ruoyi-ui/src/router/index.js`
- `ruoyi-ui/src/views/tool/gen/editTable.vue`
- `ruoyi-ui/src/views/tool/gen/genInfoForm.vue`
