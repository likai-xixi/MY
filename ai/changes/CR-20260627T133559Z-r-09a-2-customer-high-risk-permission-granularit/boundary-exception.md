# Boundary Exception

Scope: `CR-20260627T133559Z-r-09a-2-customer-high-risk-permission-granularit`

This R-09A.2 customer permission granularity change does not add frontend routes, customer runtime business logic, or cross-feature frontend imports. The following files are pre-existing RuoYi platform/router/tool-generator files that the generic RuoYi boundary checker flags because original RuoYi routes and generator screens import `system`, `monitor`, or `tool` view/API internals.

They are not owned by the `customer` feature, were not introduced by this change, and remain outside customer business code and sales-order runtime. The exception is limited to these exact paths:

- `ruoyi-ui/src/router/index.js`
- `ruoyi-ui/src/views/tool/gen/editTable.vue`
- `ruoyi-ui/src/views/tool/gen/genInfoForm.vue`
