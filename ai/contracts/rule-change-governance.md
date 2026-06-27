# Rule Change Governance Contract

## Purpose

R-09A upgrades the governance base from feature-level ownership to rule-object ownership. Before Codex changes, deletes, supersedes, or overturns a high-risk business rule, it must identify the rule object and record its lifecycle, version, references, contracts, tests, snapshot policy, and gate state.

This contract is governance-only. It must not modify customer runtime code, sales-order runtime code, business database tables, routes, permissions, controllers, services, mappers, Vue pages, or API clients.

## Rule Object Model

Rule objects are registered in `ai/registry/rule-objects.json` and validated by `npm run check:rule-objects`.

Each object must include:

- `id`: lowercase ASCII kebab-case machine id.
- `name`: display name.
- `objectType`: rule category.
- `ownerFeature`: active feature id from `ai/registry/features.json`.
- `lifecycleStatus`: one of `draft`, `published`, `deprecated`, `superseded`, `archived`.
- `version`: required for `published` objects.
- `blockingMode`: one of `off`, `warning`, `blocking`, `runtime-bound`, `release-bound`.
- `sourceContracts`: files that define the rule.
- `ownedFiles`: files where the rule is enforced or guarded.
- `tests`: tests that protect the rule.
- `immutableFields`: fields or semantics that cannot be changed without an explicit rule-change CR.
- `changePolicy`: required for `published` objects.
- `deletePolicy`: deletion requirements.
- `snapshotPolicy`: snapshot or evidence-preservation requirements.
- `supersedes`: rule object ids replaced by this object.
- `supersededBy`: rule object ids that replace this object.
- `createdByChange`: CR that introduced the rule object record.
- `updatedByChange`: latest CR that updated the record.
- `notes`: implementation and review notes.

## Blocking Checks

`check:rule-objects` is blocking for these conditions:

- `ai/registry/rule-objects.json` is missing or invalid JSON.
- `schemaVersion` is not `1`.
- object ids are duplicated.
- `ownerFeature` is not registered in `ai/registry/features.json`.
- a `sourceContracts` path does not exist.
- an `ownedFiles` path does not exist.
- a `tests` path does not exist.
- `lifecycleStatus` is invalid.
- `blockingMode` is invalid.
- a `published` object has no `version`.
- a `published` object has no `changePolicy`.
- `supersedes` or `supersededBy` references an unknown object.
- supersede links are not bidirectional.

## Preflight

`npm run rule:preflight` writes `ai/changes/<current-change>/rule-preflight.md`.

The preflight report must show:

- current change id;
- selected or registered rule objects;
- lifecycle status, version, owner, and blocking mode;
- source contracts, owned files, and tests;
- immutable fields and change/delete/snapshot policies;
- supersede links;
- current phase-gate status, including `beforeSalesOrder`.

The preflight is informational when the registry is valid, and blocking when `check:rule-objects` finds errors.

## Sales-Order Boundary

R-09A must keep `beforeSalesOrder` blocked. It may strengthen `tools/phase-gate-checker.js`, but it must not create `check:sales-order-gate` or any sales-order runtime artifact.

While `beforeSalesOrder` is incomplete, `check:phase-gate` must block sales-order runtime changes under implementation roots, including common naming variants:

- `sales-order`
- `salesorder`
- `sales_order`
- `sales/order`
- `salesOrder`
- SQL `create table sales_order`
- SQL `create table sales_order_item`
- Vue route, API, menu, or permission paths that reference sales-order runtime behavior
