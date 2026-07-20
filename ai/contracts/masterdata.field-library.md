# Masterdata Field Library Contract

Status: superseded by `engineering-core.domain.md` in R-11.

## Current Decision

- Every field definition has one owner: `SALES`, `TECH`, or `SYSTEM`.
- A definition owns stable code, type, canonical unit, source mode, validation schema, and lifecycle.
- Published ownership cannot change in place; semantic reclassification creates a new field code plus migration mapping.
- `FieldScheme` is a stable identity and `FieldSchemeVersion` is an immutable published composition.
- Scheme items reference definitions and add ordering, visibility, required, and default policy without redefining ownership.
- Sales writes sales-owned values; technical work reads sales values and writes technical-owned values; system-owned values are managed by the platform.
- A selection field may reference an `OptionSet`, but field and option identities remain separate.
