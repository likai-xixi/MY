# Masterdata Sales Option Contract

Status: superseded by the R-11 `OptionSet`/`OptionValue` contract in `engineering-core.domain.md`.

## Current Decision

- `OptionSet` represents one reusable customer-selectable dimension and selection cardinality.
- `OptionValue` belongs to exactly one set and preserves stable code/label snapshots.
- A `SALES` field may read from an option set through source mode `OPTION`.
- `TECH` and `SYSTEM` fields are not sales options, even if their values are enumerated.
- Applicability bindings may constrain choices by product/process context without copying or re-owning values.
- Current `sales-option-category/value` tables, resource keys, APIs, pages, and labels are replaced destructively by the migration in `engineering-core.migration-plan.md`.
