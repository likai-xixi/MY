# Product Review

## Outcome

R-11 establishes one engineering-core language before sales-order work begins. Sales records what the customer selected; engineering resolves how that selection is built; production consumes an explicitly released technical package. Product identity, process choice, field ownership, calculation evidence, and release versions must therefore be separate objects.

## Users And Value

- Sales users select a product model, sales-owned fields, and values from approved option sets without seeing technical-only fields.
- Technical users choose or revise a process-plan version, fill technical fields, review calculation evidence, and publish a technical release package.
- Production users later consume a production release version rather than mutable masterdata or a live order draft.
- Administrators maintain reusable product, option, field, and process definitions without adding product-family-specific code.

## Approved Scope

- Rebaseline architecture, contracts, roadmap, phase gates, and the destructive migration plan for current masterdata.
- Define product model separately from process plan and process-plan version.
- Replace sales-option category/value semantics with reusable option-set/option-value semantics.
- Define field definition, field scheme, immutable field-scheme version, and `SALES`/`TECH`/`SYSTEM` ownership.
- Define unified calculation input and generic decomposition output.
- Define order version, technical version, calculation snapshot, technical release package, and production release version.
- Register the first golden-sample pair: `9CM 标准单开` and `9CM 对开/分格拼接`.
- Make `beforeSalesOrder` require `engineering-core-ready` while leaving sales-order implementation blocked.

## Non-goals

- No sales-order, production, formula-engine, calculation-engine, or DXF runtime.
- No Java, Vue, SQL, route, API client, permission, table, migration, seed, or business runtime test change.
- No compatibility layer for old API paths, table names, resource keys, labels, or persisted development data.
- No product-family-specific columns, screens, services, or enums.
- No claim that the two golden samples have executable expected dimensions or shop-approved calculation results in R-11.

## Success Criteria

- One `9CM` product model can reference both approved golden-sample process plans without duplicating the model.
- Sales option values cannot become the storage model for technical or system-owned fields.
- Published/versioned/release artifacts use explicit lifecycle commands and are not maintained through generic CRUD.
- Main leaf, secondary leaf, grid, splice, and segment are output node roles/data, never fixed schema columns.
- Future formula and DXF adapters consume the stable calculation/release interfaces without adding columns to order or technical-version models.
- The roadmap identifies the later destructive runtime slices required before `engineering-core-ready` can become complete.

## Product Decision

Approve the R-11 governance and contract rebaseline. Do not approve business runtime in this review package.
