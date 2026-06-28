# Component Exception

Scope: `CR-20260628-r-10d-masterdata-code-autogeneration`

This R-10D masterdata runtime change does not create reusable frontend components. The following files are pre-existing RuoYi platform pages or dialogs that the generic component checker flags because their filenames contain generic UI words such as `Dialog`, `Form`, `Table`, or `select`.

They are not owned by `masterdata`, were not introduced by this change, and are outside the R-10D masterdata runtime boundary. The exception is limited to these exact paths:

- `ruoyi-ui/src/views/system/role/selectUser.vue`
- `ruoyi-ui/src/views/tool/build/CodeTypeDialog.vue`
- `ruoyi-ui/src/views/tool/build/IconsDialog.vue`
- `ruoyi-ui/src/views/tool/build/TreeNodeDialog.vue`
- `ruoyi-ui/src/views/tool/gen/basicInfoForm.vue`
- `ruoyi-ui/src/views/tool/gen/createTable.vue`
- `ruoyi-ui/src/views/tool/gen/editTable.vue`
- `ruoyi-ui/src/views/tool/gen/genInfoForm.vue`
- `ruoyi-ui/src/views/tool/gen/importTable.vue`
