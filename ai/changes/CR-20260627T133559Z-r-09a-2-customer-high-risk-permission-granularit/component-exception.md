# Component Exception

Scope: `CR-20260627T133559Z-r-09a-2-customer-high-risk-permission-granularit`

This R-09A.2 customer permission granularity change does not create customer-local reusable frontend components. The following files are pre-existing RuoYi platform/system/tool/generator pages or dialogs that the generic component checker flags because their filenames contain generic UI words such as `Dialog`, `Form`, `Table`, or `select`.

They are not owned by the `customer` feature, were not introduced by this change, and are outside sales-order runtime. They are RuoYi built-in platform pages and should not be moved into the shared component directory as part of customer permission granularity work. The exception is limited to these exact paths:

- `ruoyi-ui/src/views/system/role/selectUser.vue`
- `ruoyi-ui/src/views/tool/build/CodeTypeDialog.vue`
- `ruoyi-ui/src/views/tool/build/IconsDialog.vue`
- `ruoyi-ui/src/views/tool/build/TreeNodeDialog.vue`
- `ruoyi-ui/src/views/tool/gen/basicInfoForm.vue`
- `ruoyi-ui/src/views/tool/gen/createTable.vue`
- `ruoyi-ui/src/views/tool/gen/editTable.vue`
- `ruoyi-ui/src/views/tool/gen/genInfoForm.vue`
- `ruoyi-ui/src/views/tool/gen/importTable.vue`
