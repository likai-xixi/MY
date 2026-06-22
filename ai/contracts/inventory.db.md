# Inventory Database Ownership Contract

Feature ID: `inventory`

## Owned Database Objects

- No runtime database table is implemented in the scaffold sample.
- Register real tables in `ai/registry/db.json` and `ai/registry/features.json` under `dbTables`.

## Delete Rule

- A feature can only be fully removed when database, menu, permission, mapper XML, and seed ownership are registered.

## Verification

- `npm run scan:db`
- `npm run check:ownership`
