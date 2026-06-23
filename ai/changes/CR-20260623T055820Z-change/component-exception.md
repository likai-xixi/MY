# Component Exception

Scope: `CR-20260623T055820Z-change`

This customer UI behavior change does not create customer-local reusable frontend components. The following files are pre-existing RuoYi platform/system/tool screens or dialogs that the generic component checker flags because their filenames contain generic UI words such as `Dialog`, `Form`, `Table`, or `select`.

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
