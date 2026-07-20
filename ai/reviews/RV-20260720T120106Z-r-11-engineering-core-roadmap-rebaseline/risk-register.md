# Risk Register

| Risk | Impact | Mitigation | Owner |
| --- | --- | --- | --- |
| Product model remains a renamed process plan | Every later order binds to mutable manufacturing logic | Product-only contract plus separate process-plan/version and same-model/two-plan golden proof | Architecture |
| Option sets absorb technical fields | Sales UI and technical calculations become indistinguishable | Immutable field ownership and option-only source mode for selectable SALES fields | Product + Architecture |
| Generic CRUD edits published/released objects | Historical results and production instructions can change silently | Command lifecycle, immutable versions, hashes, append-only release chain | Backend |
| Fixed leaf/segment columns appear | New door structures require schema and order rewrites | Generic decomposition node graph, role/type codes, dynamic measurements/attributes | Architecture |
| Formula or DXF later forces order-model changes | High-cost cross-module rewrite | Stable calculation documents; formula as adapter and DXF as release-package consumer | Architecture |
| Ambiguous current `product-model` rows are copied blindly | Process definitions become corrupted product identities | Development reset by default; export/classify/remap only explicitly approved rows | Migration owner |
| R-11 documents are mistaken for runtime readiness | Sales-order work starts too early | `engineering-core-ready` remains incomplete and `beforeSalesOrder` depends on it | QA/governance |
| Golden samples use invented numbers | False-green calculation acceptance | Register scenarios now; require business-signed inputs/outputs before executable acceptance | Product + QA |
| Current strong reference/concurrency protections are lost | Orphans or invalid hierarchies reappear | Carry invariants into bounded repositories and equivalent MySQL tests during migration | Backend + QA |

## Residual Risk

The final DDL, command API shapes, numeric golden truth, and runtime cutover are intentionally deferred. They require separate approved runtime changes.
