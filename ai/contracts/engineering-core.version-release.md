# Engineering Core Version And Release Contract

Change: `R-11 engineering-core roadmap rebaseline`
Status: approved lifecycle contract; persistence and workflows deferred.

## Trace Chain

```text
OrderVersion
  -> TechnicalVersion
  -> CalculationSnapshot
  -> TechnicalReleasePackage
  -> ProductionReleaseVersion
```

Every link stores stable identity, version, payload hash, source identity/version, actor, time, and reason. A later version supersedes an earlier version; it does not rewrite it.

## OrderVersion

An immutable commercial-intent revision. It freezes customer/contact/address snapshots, product-model snapshot, sales-owned field values, selected option snapshots, price/fund-relevant values, and source order draft revision.

- Created by an explicit freeze/revise command.
- Never updated after freeze.
- A revised requirement creates the next order version.
- Technical work always names the exact order version it consumes.

## TechnicalVersion

An engineering revision bound to one order version and one process-plan version. It freezes technical-owned field values, selected engineering policies, manual decisions, and calculation request references.

- Draft editing may occur in a dedicated technical workspace.
- Submit/approve freezes a new immutable technical version.
- Reject records a decision; it does not mutate an earlier approved version.
- Rework starts a new draft sourced from a named prior version.

## CalculationSnapshot

An append-only evidence object containing normalized calculation input, output, diagnostics, referenced artifact versions/hashes, adapter identity/version, and overall content hash.

- Created only by calculate/import-and-validate commands.
- Has no generic update or delete.
- Failed snapshots remain evidence but cannot enter a release package.
- Recalculation creates a new snapshot.

## TechnicalReleasePackage

An immutable approved bundle containing:

- exact order and technical versions
- one or more accepted calculation snapshots
- decomposition output and material/accessory snapshots
- approved attachments and neutral geometry requests
- release manifest, hashes, approver, time, and reason

Release/revoke/supersede are explicit commands. Revocation preserves the package and appends lifecycle evidence. A new release package is required after technical change.

## ProductionReleaseVersion

A factory-consumable version derived from exactly one technical release package. It may later add production routing, work-center, batch, label, or dispatch projections without changing the technical package.

- Publish/cancel/supersede are explicit commands.
- Production planning consumes a production release version, never a mutable technical draft.
- A production adjustment that changes engineering meaning requires a new technical version/package first.

## Command Boundary

Allowed conceptual commands include:

- `freezeOrderVersion`, `reviseOrder`
- `submitTechnicalVersion`, `approveTechnicalVersion`, `rejectTechnicalVersion`, `startTechnicalRework`
- `calculate`, `importCalculationAndValidate`
- `releaseTechnicalPackage`, `revokeTechnicalPackage`, `supersedeTechnicalPackage`
- `publishProductionRelease`, `cancelProductionRelease`, `supersedeProductionRelease`

Every command requires authorization, expected source version, idempotency key, reason, and audit actor. Generic add/edit/status/delete/export APIs cannot substitute for these commands.

## State And Immutability Rules

- Catalog drafts and version drafts may be edited only before publication/freeze.
- Published process/field versions, snapshots, and releases are immutable.
- Status changes that alter meaning are lifecycle events, not row edits.
- Physical deletion is forbidden for any artifact referenced in the trace chain.
- During pre-release resets the entire development dataset may be discarded, but surviving evidence is never partially mutated into the new contract.

## Formula And DXF Stability

Order and technical versions reference calculation and release artifacts through stable ids/versions/hashes. Formula packages and DXF adapters can change independently because their engine-specific data lives behind calculation artifact references and release-package geometry requests.
