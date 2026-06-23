# Component Exception

Scope: `CR-20260623T071949Z-change`

This customer list display change does not create customer-local reusable frontend components. It only removes the default customer-list `shortName` table column and adjusts the customer short-name placeholder text in the existing customer screen.

The following files are pre-existing RuoYi platform/system/tool screens or dialogs that the generic component checker flags because their filenames contain generic UI words such as `Dialog`, `Form`, `Table`, or `select`.

They are not owned by the `customer` feature and were not introduced by this change. They remain registered as RuoYi platform references in `ai/registry/components.json` and `ruoyi-ui/src/components/catalog.json`.

- `ruoyi-ui/src/views/system/role/selectUser.vue`
- `ruoyi-ui/src/views/tool/build/CodeTypeDialog.vue`
- `ruoyi-ui/src/views/tool/build/IconsDialog.vue`
- `ruoyi-ui/src/views/tool/build/TreeNodeDialog.vue`
- `ruoyi-ui/src/views/tool/gen/basicInfoForm.vue`
- `ruoyi-ui/src/views/tool/gen/createTable.vue`
- `ruoyi-ui/src/views/tool/gen/editTable.vue`
- `ruoyi-ui/src/views/tool/gen/genInfoForm.vue`
- `ruoyi-ui/src/views/tool/gen/importTable.vue`
