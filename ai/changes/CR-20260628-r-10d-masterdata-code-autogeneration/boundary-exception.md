# Boundary Exception

Scope: `CR-20260628-r-10d-masterdata-code-autogeneration`

The R-10D runtime change may add only one business-common helper root for masterdata code generation:

- `ruoyi-business/src/main/java/com/ruoyi/business/common/code`

This is allowed because the requested generator is a business numbering rule, not a framework utility, and must not be placed under `ruoyi-common`.

The following files are pre-existing RuoYi platform/router/tool-generator files that the generic RuoYi boundary checker flags because original RuoYi routes and generator screens import `system`, `monitor`, or `tool` view/API internals. They are not owned by `masterdata`, were not introduced by this change, and remain outside R-10D:

- `ruoyi-ui/src/router/index.js`
- `ruoyi-ui/src/views/tool/gen/editTable.vue`
- `ruoyi-ui/src/views/tool/gen/genInfoForm.vue`
