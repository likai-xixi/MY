# Component Exception

Scope: `CR-20260627T154818Z-r-09a-4-anti-false-green-minimum-closure`

R-09A.4 is a governance-only anti-false-green closure. It does not create customer-local reusable frontend components and does not change RuoYi system/tool UI code.

The component checker is current-change scoped, so the R-09A.3 exact-path exception must be carried into this CR to keep the inherited RuoYi platform/system/tool/generator pages from blocking unrelated governance closeout. These files are pre-existing RuoYi built-in pages/dialogs, are outside customer and sales-order runtime, and are not introduced by this change.

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
