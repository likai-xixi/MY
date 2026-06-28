# Component Exception

Scope: `CR-20260628-r-10b-masterdata-mvp-runtime`

This R-10B masterdata runtime change does not create or modify reusable platform/system/tool/generator frontend components. The following files are pre-existing RuoYi platform pages or dialogs that the generic component checker flags because their filenames contain generic UI words such as `Dialog`, `Form`, `Table`, or `select`.

They are not owned by the `masterdata` feature, were not introduced by this change, and are outside the R-10B masterdata runtime boundary. They should not be moved into the shared component directory as part of this CR. The exception is limited to these exact paths:

- `ruoyi-ui/src/views/system/role/selectUser.vue`
- `ruoyi-ui/src/views/tool/build/CodeTypeDialog.vue`
- `ruoyi-ui/src/views/tool/build/IconsDialog.vue`
- `ruoyi-ui/src/views/tool/build/TreeNodeDialog.vue`
- `ruoyi-ui/src/views/tool/gen/basicInfoForm.vue`
- `ruoyi-ui/src/views/tool/gen/createTable.vue`
- `ruoyi-ui/src/views/tool/gen/editTable.vue`
- `ruoyi-ui/src/views/tool/gen/genInfoForm.vue`
- `ruoyi-ui/src/views/tool/gen/importTable.vue`
