# Frontend

Frontend code lives here.

- `src/modules/` contains business feature modules.
- `src/components/` contains reusable UI components.
- `src/layouts/` contains app-level layout shells.
- `src/router/` contains route definitions.
- `src/store/` contains shared client state.

Shared components must be registered in `src/components/catalog.json` and exported from `src/components/index.ts`.
Feature-only widgets may live under `src/modules/<slug>/components/`, but generic controls belong in `src/components/`.

Update `graph/ui-graph.json` whenever screens or routes change.
