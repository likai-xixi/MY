---
scope: pre-existing-ruoyi-module-components
allow-all: false
---

# Component Exception

This change replaces incomplete customer province/city/district options with a complete region data file. It does not introduce reusable frontend components.

The files below are pre-existing RuoYi system/tool module-local views that the current component heuristic classifies as reusable controls because of generic names such as `Dialog`, `Form`, or `Table`.

They are not copied into `ruoyi-ui/src/views/customer/`, not reused by `customer`, and not changed by this feature. They remain registered as existing RuoYi references in `ai/registry/components.json`.

- `ruoyi-ui/src/views/system/role/selectUser.vue`
- `ruoyi-ui/src/views/tool/build/CodeTypeDialog.vue`
- `ruoyi-ui/src/views/tool/build/IconsDialog.vue`
- `ruoyi-ui/src/views/tool/build/TreeNodeDialog.vue`
- `ruoyi-ui/src/views/tool/gen/basicInfoForm.vue`
- `ruoyi-ui/src/views/tool/gen/createTable.vue`
- `ruoyi-ui/src/views/tool/gen/editTable.vue`
- `ruoyi-ui/src/views/tool/gen/genInfoForm.vue`
- `ruoyi-ui/src/views/tool/gen/importTable.vue`
