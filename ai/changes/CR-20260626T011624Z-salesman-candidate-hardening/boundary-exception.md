# Boundary Exception

Scope: `CR-20260626T011624Z-salesman-candidate-hardening`

This R-05 customer runtime hardening does not add cross-feature frontend imports. The following files are pre-existing RuoYi platform/router/tool-generator files that the generic RuoYi boundary checker flags because original RuoYi routes and generator screens import `system`, `monitor`, or `tool` view/API internals.

They are not introduced by this change, are outside customer runtime code, and remain unchanged. The exception is limited to these exact paths:

- `ruoyi-ui/src/router/index.js`
- `ruoyi-ui/src/views/tool/gen/editTable.vue`
- `ruoyi-ui/src/views/tool/gen/genInfoForm.vue`
