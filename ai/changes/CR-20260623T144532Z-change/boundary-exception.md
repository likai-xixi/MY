# Boundary Exception

Scope: `CR-20260623T144532Z-change`

This customer-management mobile-phone validation iteration stays inside the existing `customer` RuoYi feature boundary. It updates the existing customer screen validation, customer service save validation, customer feature brief, customer UI contract, and change/memory evidence.

The following files are pre-existing RuoYi platform/router/tool-generator files that the generic RuoYi boundary checker can flag because original RuoYi routes and generator screens import `system`, `monitor`, or `tool` view/API internals.

They are not owned by the `customer` feature, were not introduced by this change, and remain outside customer business code. The exception is limited to these files only:

- `ruoyi-ui/src/router/index.js`
- `ruoyi-ui/src/views/tool/gen/editTable.vue`
- `ruoyi-ui/src/views/tool/gen/genInfoForm.vue`
