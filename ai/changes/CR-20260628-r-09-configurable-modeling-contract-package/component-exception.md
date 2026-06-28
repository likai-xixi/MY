# Component Exception

Scope: `CR-20260628-r-09-configurable-modeling-contract-package`

R-09 is a contract-only configurable modeling package. It does not create customer-local reusable frontend components and does not change RuoYi system/tool UI code.

The component checker is current-change scoped, so the R-09A.3/R-09A.4 exact-path exception must be carried into this CR to keep inherited RuoYi platform/system/tool/generator pages from blocking unrelated contract closeout. These files are pre-existing RuoYi built-in pages/dialogs, are outside customer and sales-order runtime, and are not introduced by this change.

The exception is limited to these exact paths:

- `ruoyi-ui/src/views/system/role/selectUser.vue`
- `ruoyi-ui/src/views/tool/build/CodeTypeDialog.vue`
- `ruoyi-ui/src/views/tool/build/IconsDialog.vue`
- `ruoyi-ui/src/views/tool/build/TreeNodeDialog.vue`
- `ruoyi-ui/src/views/tool/gen/basicInfoForm.vue`
- `ruoyi-ui/src/views/tool/gen/createTable.vue`
- `ruoyi-ui/src/views/tool/gen/editTable.vue`
- `ruoyi-ui/src/views/tool/gen/genInfoForm.vue`
- `ruoyi-ui/src/views/tool/gen/importTable.vue`
