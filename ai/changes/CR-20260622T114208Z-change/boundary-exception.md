---
scope: pre-existing-ruoyi-cross-feature-imports
allow-all: false
---

# Boundary Exception

The `customer` region-data fix does not import other feature internals. It uses only `@/api/customer` and the shared utility data file `@/utils/region-data` on the frontend.

The files below are inherited RuoYi baseline files that already cross feature namespaces for router setup or generator pages. They are not changed by this feature and are not imported by `ruoyi-ui/src/views/customer/index.vue`.

- `ruoyi-ui/src/router/index.js`
- `ruoyi-ui/src/views/tool/gen/editTable.vue`
- `ruoyi-ui/src/views/tool/gen/genInfoForm.vue`
