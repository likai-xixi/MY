# Engineering Process Plan Contract

Status: superseded by the R-11 process-plan boundary in `engineering-core.domain.md`.

## Current Decision

- The old term `sales configuration process` is retired.
- `ProcessPlan` is a stable engineering recipe identity, separate from product model and production route.
- `ProcessPlanVersion` is an immutable published version that references field-scheme versions, option applicability, calculation contracts, and decomposition policies.
- One product model may use multiple process plans; one process plan may apply to multiple product models.
- Product/process applicability is explicit data with priority/default/effective policy.
- A process-plan version may read sales intent but must not rewrite the frozen order version.
