# Engineering Core Domain Contract

Change: `R-11 engineering-core roadmap rebaseline`
Status: approved architecture contract; persistence and APIs deferred.

## Product Catalog

### ProductModel

`ProductModel` identifies what can be sold/configured. Required conceptual fields:

- stable `productModelCode`
- display name
- category/series references
- lifecycle status
- commercial metadata and tags

It must not contain process steps, part formulas, field columns, decomposition rows, or a release state. A product model may be applicable to many process plans, and a process plan may serve many product models.

### ProcessPlan And ProcessPlanVersion

`ProcessPlan` is the stable engineering recipe identity. `ProcessPlanVersion` is a published immutable version. Conceptual references include:

- process plan code and semantic version
- product-model applicability policy
- sales-field scheme version read contract
- technical-field scheme version
- option applicability policy version
- calculation contract/version reference
- decomposition policy/template reference
- effective status, publisher, published time, and payload hash

The product catalog may point to a default-selection policy, but must not embed or own process-plan contents.

## Option Catalog

### OptionSet

An option set represents one reusable selectable dimension, for example opening mode or color. It owns:

- stable set code and display name
- selection cardinality (`SINGLE`, `MULTIPLE`, or bounded count)
- value ordering and lifecycle status
- optional applicability-policy reference

### OptionValue

An option value belongs to exactly one set and owns stable code, display label, status, order, and optional external material/accessory reference.

Rules:

- An option is a selectable value, not a generic field definition.
- Technical derived values, allowances, cut sizes, offsets, and generated part roles are not option values.
- A `SALES` field may use one option set as its value source.
- Reuse means referencing the same set/value identity, not copying labels into process or product tables.
- Applicability bindings constrain choices without changing ownership.

## Field Catalog

### FieldDefinition

Every field definition has exactly one immutable owner:

- `SALES`: supplied or confirmed by sales/customer intent.
- `TECH`: decided or derived during technical work.
- `SYSTEM`: identifiers, hashes, timestamps, versions, state, and other system-managed values.

Required conceptual fields:

- stable field code and label
- owner
- data type and nullable rule
- canonical unit/dimension
- source mode (`MANUAL`, `OPTION`, `DERIVED`, or `SYSTEM`)
- validation schema
- optional option-set reference, allowed only when source mode is `OPTION`
- lifecycle status

Published field ownership cannot be edited in place. A semantic ownership change requires a new field code and explicit migration mapping.

### FieldScheme And FieldSchemeVersion

`FieldScheme` is a stable scheme identity. `FieldSchemeVersion` is an immutable published composition. Each version item references a `FieldDefinition` and adds order, required/visible policy, default policy, and context-specific presentation metadata.

Rules:

- A scheme references fields; it does not copy or redefine field ownership.
- A sales screen writes `SALES` values and reads approved `SYSTEM` context. It does not write `TECH` values.
- A technical screen may read `SALES` values and write `TECH` values. It cannot reclassify sales inputs.
- Published scheme versions are immutable; changes create a new version.

## Product/Plan Applicability

Use a versioned binding with these conceptual fields:

- product model reference
- process-plan version reference
- applicability predicate reference
- priority and default flag
- effective interval/status

This binding is the only supported product-to-process relation. Renaming a process plan never renames a product model, and publishing a process-plan version never creates a new product model.

## Decomposition Domain

The technical decomposition result is a graph/list of nodes. Each node owns:

- stable result-local `nodeKey`
- optional `parentNodeKey`
- `typeCode` and `roleCode`
- ordinal/path and quantity
- material/accessory snapshots
- a keyed measurement map
- a keyed attribute map
- operation and geometry-request references
- source rule/template/trace references

`PRIMARY_LEAF`, `SECONDARY_LEAF`, `GRID`, `SPLICE`, and `SEGMENT` may be data values. They must not become schema columns, dedicated tables per role, or mandatory fields on order/technical-version headers.

## Ownership Invariants

- Product identity survives process-plan replacement.
- Field ownership survives UI placement and scheme reuse.
- Option identity survives label changes through snapshots.
- Published versions survive current masterdata changes through immutable payloads and hashes.
- Downstream production consumes a released package, not mutable catalog rows.
