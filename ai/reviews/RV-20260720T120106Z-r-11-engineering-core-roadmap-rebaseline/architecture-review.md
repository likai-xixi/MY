# Architecture Review

## Current Findings

- `product-model` is displayed as `工艺型号`, so product identity and manufacturing method remain semantically coupled.
- `sales-option-category/value` and the old option-schema contract allow options to leak into process and field concerns.
- One generic `MasterDataRecord`, enum-selected table mapper, generic API family, and shared page assume that all objects have the same mutable CRUD lifecycle.
- Existing technical contracts enumerate example parts but do not define a generic decomposition graph, leaving pressure to add fixed main-leaf, secondary-leaf, or segment columns.

## Approved Boundaries

### Product catalog

`ProductModel` is the sellable/configurable product identity. It owns stable identity, category/series placement, status, and display metadata. It does not own a bill of process, formula, decomposition template, or release lifecycle.

### Option catalog

`OptionSet` defines one reusable customer-choice dimension and its cardinality. `OptionValue` belongs to exactly one set. Applicability bindings may constrain sets/values by product model or process-plan context, but an option never changes ownership into a technical field.

### Field catalog

`FieldDefinition` owns a stable field code, type, unit, source mode, and exactly one owner: `SALES`, `TECH`, or `SYSTEM`. `FieldSchemeVersion` is an immutable published composition of definitions. A scheme may read values owned elsewhere but cannot silently reclassify ownership.

### Engineering process

`ProcessPlan` is a stable engineering identity. `ProcessPlanVersion` is an immutable published recipe that references field-scheme versions, option applicability, calculation contracts, and decomposition policies. Product models and process plans are many-to-many through explicit versioned applicability/default-selection bindings.

### Calculation boundary

`EngineeringCalculationInput` is a versioned document containing immutable product/process/order references, owner-tagged field values, selected option snapshots, system context, and artifact hashes. `EngineeringDecompositionOutput` is a generic node graph plus calculation trace, diagnostics, and geometry requests. Formula execution is a future input-to-output adapter; DXF is a future consumer of released geometry requests.

### Version and release chain

`OrderVersion -> TechnicalVersion -> CalculationSnapshot -> TechnicalReleasePackage -> ProductionReleaseVersion` is the trace chain. Each arrow records immutable ids/versions/hashes. Snapshots and release versions are append-only. Supersede/revoke creates a new lifecycle event or version; it does not edit historical payloads.

## Lifecycle Rule

Generic CRUD may maintain unversioned catalog definitions and mutable drafts only. Publish, approve, calculate, release, supersede, revoke, and production-release actions require explicit commands with preconditions, idempotency, actor, time, and payload hash. Generic `/business/masterdata/{resource}` must not own these commands.

## Extensibility Proof

- A formula engine later implements the calculation adapter against `EngineeringCalculationInput` and emits the same `EngineeringDecompositionOutput`; order and technical-version schemas remain unchanged.
- A DXF adapter later consumes `TechnicalReleasePackage.geometryRequests` and stores drawing artifacts by reference; it does not add DXF columns to order, part, or process-plan rows.
- New leaf types, sub-leaves, grids, or splice segments are node `typeCode`/`roleCode` values and parent-child edges, not migrations adding fixed columns.

## Architecture Decision

Approve the contract model above. Keep formula grammar, DXF file generation, production routing, and runtime persistence out of R-11.
