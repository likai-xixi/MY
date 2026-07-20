# Risk Register

| ID | Severity | Risk | Mitigation / Exit Condition | Owner |
| --- | --- | --- | --- | --- |
| R12A-01 | Critical | Destructive migration loses or misclassifies useful data | Deterministic migration, pre-cutover dump/checksum, exact count/mapping validation, and restore drill | Backend/DB |
| R12A-02 | Critical | Old and new DB/API/menu paths coexist | No aliases/views/dual writes; DB/API/browser negative-old-surface tests | Architecture |
| R12A-03 | High | `option-value` keeps old `categoryId` semantics | Freeze and verify `optionSetId` across DTO, mapper, SQL, API, UI, and tests | Backend/Frontend |
| R12A-04 | High | `selectionMode` is UI-only or accepts extra vocabulary | DB constraint plus backend validation for exactly `SINGLE` or `MULTIPLE` | Backend/DB |
| R12A-05 | High | Product models still imply process plans | Current-data classification and active-source/UI/menu/test semantic audit | Product |
| R12A-06 | High | Generic DTO/mapper changes leak option fields into other resources | Resource capability allowlist and retained-resource payload/regression tests | Backend |
| R12A-07 | High | Hierarchy/reference/concurrency protection regresses | Preserve unit and real MySQL tests, mutex, deterministic locks, disabled-reference and affected-row assertions | Backend/QA |
| R12A-08 | High | Menu replacement loses grants or leaves stale dynamic routes | Preserve the existing menu row identity where possible; inventory role-menu relations; runtime least-privilege and old-route checks | Frontend/DB |
| R12A-09 | High | Static green is overstated as runtime acceptance | Separate provenance layers and keep DB/API/browser/rollback as release blockers | QA |
| R12A-10 | High | R-11 full-cutover plan is misapplied to R-12A | R-12A table-by-table scope explicitly retains product/material/accessory tables | Architecture |
| R12A-11 | Critical | Rollback is prose only | Full dump plus matching-code restore drill; prohibit partial or mixed-version rollback | Backend/DB |
| R12A-12 | High | Scope expands into field/process/order/formula/production/DXF/customer runtime | Exact base-to-final path and semantic audits with zero forbidden changes | Main agent |
| R12A-13 | Critical | Review self-approves in the same Git range | The approved review must be committed before runtime implementation; do not bypass the checker | Main agent/User |
