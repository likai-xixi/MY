# Shared Components

Shared components live here when they are reusable across modules.

Rules:

- Search `catalog.json` before creating a component.
- Search `ai/registry/components.json` before creating a component.
- Export shared components from `index.ts`.
- Register every shared component file in both `catalog.json` and `ai/registry/components.json` with the same `id`.
- Keep feature-only widgets inside `frontend/src/modules/<slug>/components/`.
- Obvious reusable controls inside a module are checked even when they are not under `/components/`.
- Do not create generic controls such as buttons, tables, forms, modals, tabs, filters, or pagination inside a module when a shared component can cover the need.
- Empty registry/catalog files are only a starter state when this folder contains no component files.
- Add catalog and registry entries before a shared component is used by more than one module.
- Use `ai/changes/<current>/component-exception.md` for explicit module-local exceptions. List the exact file path and reason; shared-root files still require dual registration.

Catalog fields:

- `id`: stable component id.
- `name`: exported component name.
- `exportedFrom`: path below `frontend/src/components/`.
- `owner`: role or team that owns the component.
- `purpose`: what the component is for.
- `category`: control, layout, data-display, feedback, navigation, or form.
- `status`: draft, stable, or deprecated.
- `usedBy`: module ids that use the component.

Registry fields:

- `id`: same stable component id used by the catalog.
- `name`: exported component name.
- `path`: full path under the active shared component root.
- `owner`: role or team that owns the component.
- `purpose`: searchable behavior description.
- `category`: searchable component category.
- `aliases`: optional alternate names users or code may use.
- `props`: optional prop names or prop metadata used by similarity checks.
- `status` or `lifecycle`: draft, stable, deprecated, or lifecycle state.
- `usedBy`: module ids that use the component.
