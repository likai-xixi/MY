# Module Guide

Use a module when a feature has its own business vocabulary, data contracts, or UI workflow.

For each module, update:

- `features/<feature>.md`
- `backend/...` if server behavior changes
- `frontend/src/modules/...` if UI behavior changes
- `frontend/src/components/...` and `frontend/src/components/catalog.json` if shared UI changes
- `memory/API_CATALOG.md` if API behavior changes
- `graph/module-graph.json`
- `graph/api-graph.json`
- `graph/ui-graph.json`
- `memory/MODULE_MAP.md`
- `memory/TASKS.json`
- `memory/sessions/...`

Run `npm run check` before handoff.
