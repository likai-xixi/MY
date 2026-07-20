# Engineering Core Contract Test Matrix

Change: `R-11 engineering-core roadmap rebaseline`
Status: governance test plan; runtime evidence pending.

| Area | Must hold | R-11 evidence | Future runtime evidence |
| --- | --- | --- | --- |
| Product/process split | One product model can use multiple process-plan versions | Domain contract and two golden scenarios | Repository/API tests and golden runner |
| Options | Option set/value models selectable intent only | Domain and migration contracts | Cardinality/applicability/negative ownership tests |
| Field ownership | Every field has one `SALES`/`TECH`/`SYSTEM` owner | Domain/calculation contracts | DB/API/UI ownership and immutable-publication tests |
| Field versions | Published scheme versions cannot change in place | Domain/version contracts | Command/API and persistence immutability tests |
| Process versions | Published process-plan versions are immutable and separate from product | Domain/version contracts | Publication/applicability/version tests |
| Calculation input | Stable code-keyed, owner-tagged, versioned, hashable document | Calculation I/O contract | Schema/normalization/hash tests |
| Decomposition output | Generic nodes/edges, keyed measurements/attributes, full trace | Calculation I/O contract | Schema, trace, property, and golden tests |
| Release chain | Order, technical, snapshot, technical package, and production release are distinct | Version/release contract | Lifecycle/idempotency/immutability tests |
| Generic CRUD | Cannot publish/release/mutate historical objects | Review and version contracts | Endpoint allow/deny and authorization tests |
| Destructive migration | Old tables/routes/resource keys/pages/tests disappear together | Migration plan | Migration/negative-surface/MySQL tests |
| Golden samples | 9CM single and double/grid-splice use one model and two plans | Golden registry | Signed fixture runner |
| Formula stability | Formula adapter does not change order/technical contracts | Calculation I/O contract | Adapter conformance tests |
| DXF stability | DXF consumes released geometry requests | Calculation I/O and release contracts | Adapter/artifact/hash tests |

## Reverse Review Assertions

1. No contract, registry, page label, or future table may call a product model a process/craft plan.
2. No technical/system-owned field may be implemented as an option value merely to reuse sales UI.
3. No generic CRUD controller may update, delete, publish, approve, calculate, release, supersede, or revoke version/release objects.
4. No table or DTO may add fixed main-leaf, secondary-leaf, grid, splice, or segment-position columns; those remain node data.
5. Formula and DXF integrations must pass adapter conformance without schema changes to order or technical-version headers.

## R-11 Negative Evidence

The changed-file audit must show no Java, Vue, SQL, API client, route, permission, graph, sales-order, production, formula runtime, calculation runtime, or DXF runtime change. Runtime rows in this matrix remain `[not-run]`.
