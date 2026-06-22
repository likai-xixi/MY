# Inventory Delete Ownership Contract

Feature ID: `inventory`

## Deletion Preconditions

- Run deletion dry-run before applying removal.
- Stop deletion if any external module still depends on this feature's API, UI, database, permission, component, or internal code.
- Delete only files registered under feature ownership or adapter-generated ownership paths.

## Must Be Listed Before Removal

- Backend modules, controllers, services, mappers, domain objects, mapper XML files.
- Frontend pages, routes, API clients, page-local components.
- Tables, SQL files, menu SQL, permission codes, dictionary types, tests, and docs.

## Verification

- `npm run feature:remove -- inventory --dry-run`
- `npm run feature:remove -- inventory --apply --confirm inventory`
- `npm run check:orphan -- inventory`
- `npm run check`
