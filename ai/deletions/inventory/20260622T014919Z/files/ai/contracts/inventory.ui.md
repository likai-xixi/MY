# Inventory UI Ownership Contract

Feature ID: `inventory`

## Owned Screens

- `frontend.inventory` is registered in `graph/ui-graph.json`.
- Page-local components are allowed only when they are feature-specific and not reusable controls.

## Shared Component Rule

- Before creating table, form, modal, drawer, upload, select, search, pagination, or date controls, check `ai/registry/components.json` and component catalogs first.
- If a new reusable component is required, register its id, name, aliases, purpose, props, usedBy, and path before use.

## Verification

- `npm run scan:frontend-routes`
- `npm run check:components`
- `npm run check:component-similarity`
