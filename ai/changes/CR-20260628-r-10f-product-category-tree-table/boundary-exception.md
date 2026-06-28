# Boundary Exception

Scope: `CR-20260628-r-10f-product-category-tree-table`

This R-10F masterdata runtime change stays inside the product-category slice of the existing masterdata feature. It does not add cross-feature frontend imports, customer runtime code, sales-order runtime code, or shared framework code.

The following files are pre-existing RuoYi platform/router/tool-generator files that the generic RuoYi boundary checker flags because original RuoYi routes and generator screens import `system`, `monitor`, or `tool` view/API internals. They are not owned by `masterdata`, were not introduced by this change, and remain outside R-10F:

- `ruoyi-ui/src/router/index.js`
- `ruoyi-ui/src/views/tool/gen/editTable.vue`
- `ruoyi-ui/src/views/tool/gen/genInfoForm.vue`
