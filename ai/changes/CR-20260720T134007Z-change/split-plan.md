# File Split Plan

`ruoyi-ui/src/views/masterdata/index.vue` currently serves product, material, accessory, and legacy sales-option groups. R-12A will remove the legacy option group from that shared page and implement the bounded `option-config.vue` page separately.

- Keep product/material/accessory behavior in `index.vue` for this batch.
- Move all new option-set/value presentation, state, and interactions to `option-config.vue`.
- Delete `sales-option-config.vue`; do not create redirects or compatibility wrappers.
- Reuse existing global/Element Plus controls. Register a new shared component only if the implementation actually creates reusable cross-feature UI.
- Defer any further product/material/accessory page decomposition to another approved change.

This split keeps R-12A reviewable and prevents option-only fields from expanding the shared generic page.
