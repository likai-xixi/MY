# Handover

## Summary

Current change `CR-20260714T022937Z-change` hardens masterdata reference integrity, category hierarchy concurrency, and product-series/model category consistency. The project remains unreleased; this batch does not publish or deploy.

## Impact

The change is bound to governance commit `d659a09531813b9e7591fda2058baddf2af4291c` and approved review `RV-20260714T012241Z-review`. It changes only approved masterdata runtime, SQL, tests, contracts, generated context/scan artifacts, registry, and handoff memory. It does not change table shape, frontend behavior, routes, permissions, customer runtime, sales-order runtime, system notices, production profiles, or governance tools.

## Changed Files

- `ai/changes/CR-20260714T022937Z-change/changed-files.json`
- `ai/changes/CR-20260714T022937Z-change/handover.md`
- `ai/changes/CR-20260714T022937Z-change/impact.json`
- `ai/changes/CR-20260714T022937Z-change/plan.md`
- `ai/changes/CR-20260714T022937Z-change/request.md`
- `ai/changes/CR-20260714T022937Z-change/verification.md`
- `ai/changes/CURRENT_CHANGE.json`
- `ai/context/current-context.json`
- `ai/context/current-context.md`
- `ai/contracts/masterdata.api.md`
- `ai/contracts/masterdata.db.md`
- `ai/contracts/masterdata.delete-ownership.md`
- `ai/generated/db-schema.json`
- `ai/registry/features.json`
- `features/masterdata.md`
- `memory/CHANGELOG.md`
- `memory/HANDOVER.md`
- `memory/PROJECT_STATE.md`
- `memory/TASKS.json`
- `memory/sessions/2026-07-14-masterdata-reference-integrity.md`
- `ruoyi-business/src/main/java/com/ruoyi/business/masterdata/mapper/MasterDataMapper.java`
- `ruoyi-business/src/main/java/com/ruoyi/business/masterdata/service/impl/MasterDataServiceImpl.java`
- `ruoyi-business/src/main/resources/mapper/masterdata/MasterDataMapper.xml`
- `ruoyi-business/src/test/java/com/ruoyi/business/masterdata/service/MasterDataReferenceMySqlIT.java`
- `ruoyi-business/src/test/java/com/ruoyi/business/masterdata/service/MasterDataServiceTest.java`
- `sql/masterdata.ownership.md`
- `sql/migrations/V20260628_005_masterdata_r10_schema.sql`
- `sql/validation/masterdata_runtime_validation.sql`
- `tests/masterdata-runtime.test.js`

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

## Verification

- [local] Node masterdata tests passed 34/34; Maven reactor unit tests passed 58/58, including 21/21 focused service tests.
- [local] MySQL 8.0.36 Testcontainers integration passed 1/1 and exercised real Spring transactions, production service code, MyBatis mappings, and migration SQL.
- [local] The integration test observed the hierarchy mutex lock wait and proved both concurrent first category inserts commit after serialization.
- [local] The cycle/depth corruption scenario asserted exact validation rows `40/41 = unreachable_or_cycle, depth 0` and `46 = depth_exceeds_3, depth 4`, failed closed without retaining the mutex, and returned zero violations after repair.
- [local] Each of the seven real orphan statements parsed from `sql/validation/masterdata_runtime_validation.sql` detected its own positive bad-data fixture with the exact `check_name`, child row, and missing-parent id; cleanup then returned all seven statements to zero.
- [local] The eight-module backend reactor compiled successfully; scan, context, review, and Java/Node ownership gates pass.
- [local] The complete project gate passed with 381/381 Node tests and the finalized change set matches exactly 29 actual paths.

## Risks

- Existing databases still require the updated V005 migration followed by the complete `sql/validation/masterdata_runtime_validation.sql` before future runtime acceptance or deployment; mutex, category root-reachability/cycle/depth, seven orphan, and model/series consistency checks must all pass.
- Direct SQL writers remain outside the service lock protocol and must run that complete validation script after every direct write.
- Category hierarchy locking is an intentional consistency/throughput tradeoff.
- Testcontainers `mysql` 1.21.3 currently resolves transitive `jdbc`/core 1.21.4; align those versions in a separate dependency/governance change rather than editing POM files in this business batch.

## Next Actions

- Finalize the exact change set, run the complete project gate, stage and independently review this batch, then commit it.
- Continue the separate system-notice, production-profile/checker, Testcontainers alignment, and frontend dependency-migration remediations.
- Push only after every reviewed batch passes; do not release or deploy.
