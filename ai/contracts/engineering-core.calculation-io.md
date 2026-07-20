# Engineering Core Calculation I/O Contract

Change: `R-11 engineering-core roadmap rebaseline`
Status: approved interface contract; engine/runtime not implemented.

## Purpose

The calculation boundary must let formula engines, manual calculators, rule engines, and future geometry/DXF adapters evolve without changing the order or technical-version model.

## EngineeringCalculationInput

The input is one canonical versioned document with a deterministic serialization and content hash.

| Section | Required content |
| --- | --- |
| Header | `schemaVersion`, calculation request id, created time, locale/unit policy |
| Trace refs | order id/version, technical id/version, product model snapshot, process-plan version/hash |
| Fields | map/list keyed by field code with owner, data type, unit, value, and definition/version snapshot |
| Options | option-set/value code and label snapshots plus applicability decision |
| Artifacts | field-scheme versions, calculation contract, rule/template references and hashes |
| System context | rounding policy, precision, actor, correlation/idempotency key |
| Attachments | immutable references and hashes only; no mutable file paths |

Input rules:

- Values are keyed by stable codes, never by Chinese label or database id alone.
- `SALES`, `TECH`, and `SYSTEM` ownership is preserved in every field value.
- The input may reference future formula/rule packages, but does not embed engine-specific table columns.
- The exact normalized input is retained inside the resulting calculation snapshot.

## EngineeringDecompositionOutput

The output is one canonical versioned document.

| Section | Required content |
| --- | --- |
| Header | output schema version, input hash, engine/adapter identity and version |
| Nodes | generic decomposition nodes with parent relation, type/role codes, quantity, measurements, attributes, and snapshots |
| Decisions | applicability, branch, rule, rounding, tolerance, and fallback decisions |
| Trace | source field/option/rule/template references for every generated value/node |
| Diagnostics | stable severity/code/message plus related field/node references |
| Geometry requests | neutral geometry intents and parameters for future drawing/DXF adapters |
| Summary | result hash, counts, warnings, and acceptance status |

Output rules:

- Node measurements and attributes are keyed data validated by schemas; they are not product-specific header columns.
- Main/secondary leaf, grid, splice, and segment are role/type values.
- Every computed value can be traced to input values and versioned rules/templates.
- A failed calculation returns diagnostics and no releasable output; partial output cannot be silently released.
- Output is immutable after snapshot creation.

## Adapter Contracts

### Formula/Rule Adapter

Future formula engines receive the normalized input plus versioned rule package and return values/decisions in the canonical output. Adding a new formula language changes adapter and rule-package versions only.

### DXF/Geometry Adapter

Future DXF generation consumes geometry requests from an approved `TechnicalReleasePackage`, produces immutable drawing artifacts, and returns artifact references/hashes. It does not write DXF-specific columns into `OrderVersion`, `TechnicalVersion`, or decomposition nodes.

### Manual/External Calculation

A controlled manual/external adapter may produce the same canonical output only when it identifies the adapter/version, records actor/source evidence, passes schema validation, and is included in the calculation snapshot. This is not permission to bypass golden tests.

## Compatibility Policy

Calculation schema versions are explicit. During pre-release development, a breaking schema change replaces fixtures and development data; no dual reader/writer or old-schema compatibility layer is required unless separately approved.

## R-11 Evidence Boundary

R-11 defines documents and invariants only. No formula execution, calculation service, output persistence, drawing task, file generation, or DXF runtime exists.
