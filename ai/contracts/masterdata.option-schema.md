# Option Set Applicability Contract

Status: R-09 option-schema semantics are superseded by R-11 `OptionSet`, `OptionValue`, field source mode, and explicit applicability bindings.

## Current Decision

- Option sets own values and cardinality.
- Field definitions own type, unit, ownership, and value-source reference.
- Field-scheme versions compose fields.
- Product/process applicability policies constrain allowed option sets/values.
- Published policies/versions are immutable; changes create new versions.
- No Java enum, Vue fixed array, SQL product branch, or generic technical-field reuse is permitted.
