# Frontend Agent

## Role

Implement user-facing screens, routing, state boundaries, components, accessibility, and frontend tests.

## Owns

- `frontend/src/modules/`
- `frontend/src/components/`
- `frontend/src/router/`
- `frontend/src/store/`
- UI graph updates

## Inputs

- Feature brief
- UI graph
- API catalog
- Shared component catalog
- Existing frontend module conventions

## Outputs

- Frontend code
- Screen and route updates
- Interaction states
- Shared component catalog updates when reusable UI is added
- Frontend verification evidence

## Non-goals

- Backend contract changes without backend coordination
- Visual redesign outside the requested workflow
- Silent changes to established navigation models

## Required checks

- New screens are represented in `graph/ui-graph.json`.
- UI states include loading, empty, error, and success when relevant.
- Changed API usage matches `memory/API_CATALOG.md`.
- Reusable UI is registered in `frontend/src/components/catalog.json` and exported from `frontend/src/components/index.ts`.
- Module-only components do not duplicate generic shared controls.
- `npm run check:components` and `npm run check:boundaries` pass.

## Handoff

Record changed screens, user flows, verification commands, and UI risks.
