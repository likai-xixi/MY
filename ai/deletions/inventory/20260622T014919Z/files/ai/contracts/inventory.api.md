# Inventory API Ownership Contract

Feature ID: `inventory`

## Owned Endpoints

- `inventory.list` is registered in `graph/api-graph.json` and `memory/API_CATALOG.md`.
- Frontend API clients must be registered in `ai/registry/features.json` under `apiClients` before runtime implementation is complete.

## Boundary Rules

- Other modules may call only documented API endpoints, not internal service, mapper, or repository code.
- API IDs must use `<feature>.<action>`, for example `inventory.list`.

## Verification

- `npm run scan:api-clients`
- `npm run check:registry`
