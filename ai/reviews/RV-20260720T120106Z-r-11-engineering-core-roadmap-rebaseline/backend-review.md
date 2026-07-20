# Backend Review

## Current Runtime Surface Audited

- Nine tables under `masterdata_*`.
- One `MasterDataResource` enum maps path keys to table/column names.
- One `MasterDataRecord` DTO exposes the union of `parentId`, `categoryId`, `seriesId`, `spec`, and `unit`.
- One controller exposes generic list/options/detail/add/edit/status/delete/export endpoints.
- One mapper interpolates the selected table and common fields.
- Service and MySQL tests protect seven current reference edges and product-category hierarchy concurrency.

## Destructive Migration Direction

- Preserve the validated hierarchy/reference ideas, but reimplement them against explicit bounded-context repositories.
- Rebuild `product_model` with product-only semantics and remove the `工艺型号` alias.
- Replace sales-option tables/resources with `option_set` and `option_value`; no alias endpoint or dual-write period.
- Introduce separate field-definition/scheme/version and process-plan/version stores in later runtime batches.
- Treat current development data as resettable. Export only for classification/reference; do not automatically copy rows whose product/process meaning is ambiguous.
- Remove the generic controller/DTO/mapper after all target resources in the migration slice have explicit contracts and tests.

## API Decision

- Catalog definitions use bounded resource APIs.
- Draft edits remain ordinary create/update commands only where the object is explicitly mutable.
- Version publication and release objects expose commands such as `publish`, `submit`, `approve`, `calculate`, `release`, `supersede`, and `revoke`; no generic update/delete endpoints.
- Calculation endpoints exchange the unified documents and hashes, not table-shaped DTOs.

## Persistence Decision

- Use normalized identities and version headers with immutable version payloads or normalized immutable rows.
- Field values, measurements, attributes, and decomposition roles are keyed collections/documents validated against schemas; do not add columns for every product-specific field.
- Main leaf, secondary leaf, segment, and grid relationships use generic nodes and edges.
- Snapshot and release payloads are immutable and hash-addressed; mutable foreign-key-only history is rejected.

## Backend Blockers For Later Runtime

- Final MySQL DDL and command API contracts must be approved in a separate runtime CR.
- The two golden samples need signed numeric inputs and expected outputs before calculation runtime can be accepted.
- Existing data classification/reset and menu cutover require a maintenance-window plan.
- Any later runtime implementation must use a review package already committed at its base revision.

## Backend Decision

Approve the R-11 plan only. No backend or SQL runtime path is approved in this review.
