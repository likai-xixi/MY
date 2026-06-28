# Boundary Exception

Scope: `CR-20260628-r-10b-masterdata-mvp-runtime`

This R-10B masterdata runtime change does not add cross-feature frontend imports. The following files are pre-existing RuoYi platform/router/tool-generator files that the generic RuoYi boundary checker flags because original RuoYi routes and generator screens import `system`, `monitor`, or `tool` view/API internals.

They are not owned by the `masterdata` feature, were not introduced by this change, and remain outside the R-10B masterdata runtime boundary. The exception is limited to these exact paths:

- `ruoyi-ui/src/router/index.js`
- `ruoyi-ui/src/views/tool/gen/editTable.vue`
- `ruoyi-ui/src/views/tool/gen/genInfoForm.vue`
