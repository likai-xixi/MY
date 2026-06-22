# Backend Common Contracts

`backend/common/` is for shared backend utilities that have no feature ownership.

Allowed:

- Cross-module value helpers.
- Framework adapters that are not owned by one business feature.
- Shared error and result types.
- Test helpers used by multiple backend modules.

Not allowed:

- Feature-specific API handlers.
- Feature-specific service orchestration.
- Feature-specific domain rules.
- Feature-specific repository contracts.
- Imports from `backend/modules/<slug>/`.

Promotion rule:

Move code into `backend/common/` only after at least two modules need the same stable behavior, or after the architecture role records the reason in handoff evidence.

