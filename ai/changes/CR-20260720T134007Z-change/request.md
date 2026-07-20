# Request

Execute independent business change `R-12A: destructive product-catalog semantics and generic option migration`.

## Goals

1. Keep `product-category`, `product-series`, and `product-model` as the three product-catalog identities, and remove the current effective `工艺型号` / process-plan meaning from `product-model`.
2. Destructively replace `sales-option-category` / `sales-option-value` with reusable `option-set` / `option-value` across Java, Vue, API contracts, MySQL tables, menu, permissions, tests, registry, graph, generated scans, memory, and handover.
3. Preserve product hierarchy, reference, automatic-code, read-only-code, status, delete-protection, permission, and regression behavior.
4. Execute one truthful migration strategy against `my_ry_vue_runtime` or an isolated acceptance database, run executable validation SQL, and record rollback and runtime evidence.

## Runtime Boundary

This batch does not create or modify field-definition, field-schema/version, process-scheme/version, product-process binding, formula/calculation-engine, sales-order, tech-order, BOM, production, DXF, laser, workstation/mobile, delivery, finance, or customer-fund runtime. It does not edit governance scripts, scanners, checkers, package scripts, workflows, skills, or project profile rules.

## Authorization Gate

R-11 review approval does not authorize this runtime. Java, Vue, API, SQL, menu, or permission implementation may begin only after this change has its own five-role review and `decision.md` explicitly contains `Allow Implementation`.
