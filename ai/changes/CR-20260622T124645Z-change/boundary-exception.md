---
scope: pre-existing-ruoyi-cross-feature-imports
allow-all: false
---

# Boundary Exception

The `customer` administrative-division-code update does not import other feature internals. It uses `@/api/customer` and the customer-owned/shared region utility `@/utils/region-data` on the frontend, and the existing customer controller/service/mapper boundary on the backend.

The files below are inherited RuoYi baseline files that already cross feature namespaces for router setup or generator pages. They are not changed by this feature and are not imported by `ruoyi-ui/src/views/customer/index.vue`.

- `ruoyi-ui/src/router/index.js`
- `ruoyi-ui/src/views/tool/gen/editTable.vue`
- `ruoyi-ui/src/views/tool/gen/genInfoForm.vue`
