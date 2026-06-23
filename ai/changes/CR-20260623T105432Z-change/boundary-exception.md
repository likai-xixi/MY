# Boundary Exception

Scope: `CR-20260623T105432Z-change`

This customer-management iteration stays inside the existing `customer` RuoYi feature boundary. It updates the customer domain, mapper XML, service rules, SQL ownership, contracts, and the existing customer screen for public customers and the unified deposit model.

The following files are pre-existing RuoYi platform/router/tool-generator files that the generic RuoYi boundary checker can flag because original RuoYi routes and generator screens import `system`, `monitor`, or `tool` view/API internals.

They are not owned by the `customer` feature, were not introduced by this change, and remain outside customer business code. The exception is limited to these files only:

- `ruoyi-ui/src/router/index.js`
- `ruoyi-ui/src/views/tool/gen/editTable.vue`
- `ruoyi-ui/src/views/tool/gen/genInfoForm.vue`
