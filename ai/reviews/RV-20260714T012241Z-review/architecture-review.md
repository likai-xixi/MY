# Architecture Review

## Change Boundaries

The approved work must use five independently closable records:

1. Customer security and financial-integrity update.
2. Master-data delete-integrity update.
3. System runtime-safety update for notice rendering.
4. Platform runtime-safety update for the production profile.
5. Governance/rule-change for tools, workflow, CI, lockfiles, and context integrity.

Each record must declare this review through `impact.reviewId`, use only its explicit `allowedEditRoots`, finalize, pass its owning tests, and be committed before the next record becomes active. The commits may be pushed together after the final review.

## Contract Decisions

- `GET /business/customer/{customerId}` becomes query-safe and returns only `customer`. Sensitive domains remain available solely through their existing dedicated, permission-protected endpoints.
- Fund-account reads never initialize or mutate accounts. Account creation remains in customer creation and transactional mutation paths.
- Sample rebate creation is fail-closed until an approved authoritative sample-order source exists. The default adapter rejects before policy, idempotency, or writes; no sales-order table is invented in this batch. Future activation must replace client identity/amount with the authority snapshot and retain policy, idempotency, and database uniqueness controls.
- Generic customer update cannot write `owner_*`; only the transactional transfer path can lock the customer row, affect exactly one owner row, and then append its audit log. Salesman eligibility uses controlled role keys only.
- Master-data logical delete uses explicit concrete reference-count queries, not caller-controlled dynamic SQL.
- Notice HTML is displayed in an iframe with an empty `sandbox` policy and no same-origin/script capability. No raw `v-html` notice sink remains.
- Production config explicitly contains every property injected by `DruidProperties`; the governance checker prevents future drift.

## Sequencing And Risk

- The umbrella review covers `customer`, `masterdata`, `system`, and `platform`, but does not permit mixing their implementation with governance files.
- Graph/API changes are limited to response semantics; existing endpoint paths and permission codes stay stable.
- Production startup proof must fail only at the deliberately unreachable database, never at unresolved configuration placeholders.
- Sales-order paths and schemas remain forbidden throughout.
