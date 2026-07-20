# Snapshot And Versioning Contract

Status: superseded by `engineering-core.version-release.md` and `engineering-core.calculation-io.md` in R-11.

## Current Decision

The authoritative trace chain is:

`OrderVersion -> TechnicalVersion -> CalculationSnapshot -> TechnicalReleasePackage -> ProductionReleaseVersion`

- Frozen/published versions, snapshots, and releases are immutable.
- Revisions and recalculations create new objects.
- Every link records stable identity/version, payload hash, source reference, actor, time, and reason.
- Historical meaning is reconstructed from snapshots and hashes, never mutable ids alone.
- Generic CRUD cannot publish, approve, calculate, release, supersede, revoke, update, or delete these objects.
