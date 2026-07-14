# Verification

Status: verified [local]

## Commands

- `[local] npm run resume`
- `[local] npm run impact -- masterdata`
- `[local] node --test tests/masterdata-runtime.test.js`
- `[local] configured Maven 3.9.9 -pl ruoyi-business -am test`
- `[local] configured Maven 3.9.9 -pl ruoyi-business -am -Pintegration-test -Dit.test=MasterDataReferenceMySqlIT -Dsurefire.failIfNoSpecifiedTests=false verify`
- `[local] configured Maven 3.9.9 -pl ruoyi-admin -am -DskipTests compile`
- `[local] npm run scan:all`
- `[local] npm run context:build -- masterdata`
- `[local] npm run check:feature-test-ownership`
- `[local] npm run check:review`
- `[local] npm run check:context-pack`
- `[local] git diff --check`
- `[local] npm run finalize:change`
- `[local] npm run check`
- `[local] npm run close:change`

## Evidence

- [local] The restored batch is rebound to base commit `d659a09531813b9e7591fda2058baddf2af4291c` and approved review `RV-20260714T012241Z-review`; review, context, impact-root, and test-ownership gates pass.
- [local] The focused Node masterdata suite passed 34/34.
- [local] The Maven reactor unit suite passed 58/58, including `MasterDataServiceTest` at 21/21.
- [local] `MasterDataReferenceMySqlIT` passed 1/1 on Testcontainers MySQL 8.0.36 using the real Spring transaction proxy, production service, MyBatis XML, and V005 migration.
- [local] The integration test observed the second concurrent first-root insert waiting on the permanent `category_id = -1` hierarchy mutex; both requests committed after serialization.
- [local] A direct-SQL corruption fixture created an A-to-B-to-A cycle and a four-level tree. Runtime validation asserted the exact result set: rows `40` and `41` reported `unreachable_or_cycle` at depth `0`, while row `46` reported `depth_exceeds_3` at depth `4`; the service rejected the cycle within its bounded timeout, a new transaction then acquired the mutex, and validation returned zero violations after repair.
- [local] The integration test parsed all seven orphan statements from `sql/validation/masterdata_runtime_validation.sql` by `check_name`, injected one isolated positive orphan fixture per statement, asserted the exact `check_name`, child row, and missing-parent id, removed each fixture, and reran all seven statements to zero. The same path also covered all seven owned-reference delete guards, category/series and series/model ordering, active-model series recategorization rejection, repeated migration, sentinel repair, missing-sentinel fail-closed behavior, and model/series category consistency.
- [local] The first strengthened IT run failed because the real `orphan_product_model_series` statement detected the intentionally deleted series `303` fixture before its planned restoration. Positive orphan validation was moved after that restoration, and the next identical IT command passed; this red-to-green sequence confirms the assertions execute the production validation SQL rather than a copied clean-count query.
- [local] The unit cycle-timeout probe now calls `shutdownNow()` and requires executor termination within one second, including failure cleanup.
- [local] The eight-module `ruoyi-admin` reactor compile completed successfully.
- [local] Generated scans and masterdata context were rebuilt after the governance commit; no customer, sales-order, system-notice, production-profile, governance-tool, release, or deployment scope is included.
- [local] The complete project gate passed end to end with 381/381 Node tests; finalization reconciled exactly 29 recorded and actual paths, and change/close/diff checks passed.

## Residual Risk

- Existing databases have not been mutated in this non-release task. Before future runtime acceptance or deployment, rerun `sql/migrations/V20260628_005_masterdata_r10_schema.sql`, then execute the complete `sql/validation/masterdata_runtime_validation.sql` and require the mutex, category root-reachability/cycle/depth, all seven orphan, and model/series category-consistency checks to pass.
- Direct database writers do not participate in the service lock protocol; after any direct write they must preserve the hidden mutex row and execute the complete `sql/validation/masterdata_runtime_validation.sql`, including `invalid_product_category_hierarchy`.
- Product-category hierarchy writes intentionally serialize on one permanent row and then lock the active tree, favoring integrity over throughput for a low-frequency administrator workflow.
- [local] The current Maven graph resolves `org.testcontainers:mysql` 1.21.3 with transitive `jdbc`/`testcontainers` 1.21.4. The real IT passes, but version alignment requires a separate dependency/governance record because POM files are outside this business change.
