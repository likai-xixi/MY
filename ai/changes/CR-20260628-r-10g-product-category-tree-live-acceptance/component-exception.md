# Component Exception

Scope: `CR-20260628-r-10g-product-category-tree-live-acceptance`

R-10G is an acceptance-only masterdata closeout. It does not create reusable frontend components and does not change RuoYi system/tool UI code.

The component checker is current-change scoped, so the inherited exact-path exception must be carried into this CR to keep pre-existing RuoYi platform/system/tool/generator pages from blocking unrelated live-acceptance evidence. These files are pre-existing RuoYi built-in pages/dialogs, are outside customer, masterdata, and sales-order runtime, and are not introduced by this change.

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
