# Boundary Exception

Scope: `CR-20260623T071949Z-change`

This customer list display change does not add cross-feature frontend imports or change backend/API/database boundaries. It only changes the existing `customer` feature screen and its feature brief.

The following files are pre-existing RuoYi platform/router/tool-generator files that the generic RuoYi boundary checker flags because original RuoYi routes and generator screens import `system`, `monitor`, or `tool` view/API internals.

They are not owned by the `customer` feature, were not introduced by this change, and remain outside customer business code. The exception is limited to these files only:

- `ruoyi-ui/src/router/index.js`
- `ruoyi-ui/src/views/tool/gen/editTable.vue`
- `ruoyi-ui/src/views/tool/gen/genInfoForm.vue`
