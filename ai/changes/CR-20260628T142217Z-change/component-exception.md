# Component Exception

Scope: `CR-20260628T142217Z-change`

This change is a focused masterdata navigation split. It adds four thin masterdata route wrappers that reuse `ruoyi-ui/src/views/masterdata/index.vue`; it does not create shared frontend controls and does not modify RuoYi system/tool UI code.

The component checker is current-change scoped, so the inherited exact-path exception must be carried into this CR to keep pre-existing RuoYi platform/system/tool/generator pages from blocking unrelated masterdata UI evidence. These files are pre-existing RuoYi built-in pages/dialogs, are outside customer, masterdata, and sales-order runtime, and are not introduced by this change.

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
