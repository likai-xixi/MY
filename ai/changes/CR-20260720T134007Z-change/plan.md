# Plan

Mode: `update`
Feature: `masterdata`
Batch: `R-12A`

1. Preserve the verified R-11 publication boundary and both blocked phase gates.
2. Build the masterdata context and complete a new five-role R-12A review.
3. Keep implementation blocked until the R-12A decision explicitly says `Allow Implementation` and the review id is bound to `impact.json`.
4. Add focused failing tests for the new resource vocabulary, product-model semantics, option invariants, migration absence checks, and forbidden-runtime audit.
5. Implement only the approved masterdata Java/Vue/API/SQL/menu/permission slice, with no compatibility path.
6. Refresh contracts, registry, graph, scans, memory, session, handover, and the changed-file ledger together.
7. Execute focused tests, Maven compile/tests, Vue production build, MySQL migration/validation, API acceptance, and browser regression as separate evidence layers.
8. Run an independent reverse audit, then `npm run finalize:change`, `npm run check`, `npm run close:change`, and `git diff --check`.
9. Stop with an uncommitted, unpushed R-12A worktree for user review.

## Migration Decision Gate

Choose exactly one after live database inventory: deterministic data migration when old data must be preserved, or an explicitly recorded development-data reset only when all old rows are confirmed test data. Never claim both.
