# Masterdata Option Set Contract

Status: active R-12A option value-domain contract under `engineering-core.domain.md`.

## Current Decision

- `OptionSet` represents one reusable selectable value domain and owns required `selectionMode` (`SINGLE` or `MULTIPLE`).
- `OptionValue` belongs to exactly one set and preserves stable code/label snapshots.
- New set/value codes use `OS`/`OV`; migrated `SOC`/`SOV` codes remain immutable historical row identities.
- Disabling a set does not cascade, but values under a disabled set are excluded from new-business options results.
- Any non-deleted value, including a disabled value, blocks deletion of its owning set.
- Option sets do not own SALES/TECH/SYSTEM field ownership, required/default/validation/display rules, formula, BOM, process version, or DXF behavior. Those concerns require later contracts and runtime changes.
- Old sales-option tables, resource keys, APIs, pages, labels, permissions aliases, compatibility views, and dual read/write paths are absent after V007.
