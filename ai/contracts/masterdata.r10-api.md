# Masterdata R-10 API Contract

Change: `R-10A masterdata MVP contract package`
Status: contract/pre-review only. R-10A defines future API behavior but does not create controllers, services, API clients, API graph entries, generated scans, or tests.

## Purpose

R-10B APIs must expose CRUD, status, publish, archive/delete-safe, export, and reference-check behavior for the nine MVP master-data objects without creating product-family-specific endpoints.

## Future API Resource Groups

R-10B may introduce one generic master-data API family or separate resource groups, but the conceptual resources must stay limited to:

- product category
- product series
- product model
- material category
- material record
- accessory category
- accessory record
- sales option category
- sales option value

## Required API Capabilities

Each resource must support the adapter-equivalent of:

- view/list/query
- add
- edit
- remove with reference protection
- export
- status change
- publish or an explicit preserved publish boundary

If a resource is not versioned in the first runtime slice, R-10B must still preserve the publish boundary in contract, permission names, or a documented deferred implementation note so later immutable published data can be added without API ambiguity.

## API Shape Rules

- APIs must use stable `code` as the business reference and database id only as an internal row identity.
- APIs must expose `displayName`, `status`, `sortOrder`, and `remark`.
- Category APIs may expose parent/level/path fields.
- Material/accessory record APIs may expose category code, specification label, unit, and optional material/accessory type flags.
- Sales option value APIs may expose category code, optional linked material/accessory code, and sort order.
- APIs must not expose hard-coded fields for door categories, opening modes, colors, handles, locks, hinges, glass, surface treatment, packaging, or material systems.
- APIs must reject code changes after publication or after reference unless R-10B explicitly defines a safe migration rule.

## Future Ownership Requirement

When R-10B creates APIs it must update, in the same change:

- backend controller/service/domain/mapper ownership
- `memory/API_CATALOG.md`
- `graph/api-graph.json`
- generated backend-route and API-client scans
- feature registry API ownership
- contract-test matrix and runtime tests

R-10A records this requirement only; it does not update API graph or API catalog because no runtime endpoint exists yet.
