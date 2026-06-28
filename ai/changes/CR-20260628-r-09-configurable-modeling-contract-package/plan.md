# Plan

Mode: `contract-only`

1. Create R-09 contracts for configurable product, material, sales option, sales configuration process, field library, option schema, formula variables, formula groups, calculation rules, glass rules, offset rules, technical decomposition templates, part templates, calculation snapshots, permissions, migration planning, and contract-test matrix.
2. Keep the change outside runtime roots.
3. Do not create sales-order runtime.
4. Do not create SQL migrations.
5. Do not modify customer runtime, idempotency runtime, security configuration, package scripts, or tools.
6. Update change record and handover evidence.
7. Reconcile the backed-up f959 `r09-*` content into the remote `masterdata.*`, `rule.*`, and `tech.*` structure only; do not create `r09-*` files, merge two contract sets, or enter R-10.

## Explicit Non-goals

- No Java runtime.
- No Vue runtime.
- No SQL table or seed.
- No sales-order.
- No process/material/formula/drawing runtime.
