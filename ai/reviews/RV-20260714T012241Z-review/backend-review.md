# Backend Review

## Customer

- Reduce `selectCustomerDetail` to the basic `customer` payload.
- Make `selectFundAccounts` a pure read.
- Add an authoritative sample-order boundary. Because no implementation exists yet, the production adapter must reject every create request before policy, idempotency, or writes; tests may inject an authority to preserve future calculation/idempotency coverage.
- Future enabled generation must replace client order identity/amount with the authority snapshot, validate active policy and bounds, hash order ID/effective discount, and enforce unique order identity in the database.
- Reject owner changes through normal update, remove owner columns from the generic update SQL, and add a dedicated owner-update mapper used only by `transferOwner`.
- Require the selected owner to be normal, not deleted, and assigned an active controlled `sales`, `salesman`, or `business` role key (`SysRole.flag=true`). Never authorize by display name.
- Lock the customer row during transfer and insert the audit record only after exactly one dedicated owner update.

## Master Data

- Add concrete mapper counts for category/series dependants.
- Reject deletion before changing any `del_flag` when an active dependant exists.
- Keep batch deletion transactional and preserve successful deletion for unreferenced rows.

## Platform/System

- Add all Druid pool/filter properties required by the production profile without adding secrets or localhost defaults.
- The notice fix is primarily a render-boundary change. Historical stored content is treated as untrusted and must never reach an unsandboxed HTML sink.

## Required Proof

- Java unit tests for customer and masterdata negative/positive paths.
- Existing MySQL/Testcontainers customer integration suite.
- Packaged production-profile startup probe.
- Static security test proving the notice sink is sandboxed and no notice `v-html` remains.
