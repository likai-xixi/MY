# Handover

## Summary

Active change `CR-20260714T022937Z-change` restores and revalidates the masterdata reference-integrity batch on top of governance commit `d659a09531813b9e7591fda2058baddf2af4291c`. It is approved by `RV-20260714T012241Z-review`, remains unreleased, and does not publish or deploy.

## Impact

The change hardens masterdata parent/reference locks, seven deletion guards, exact affected-row checks, category hierarchy serialization, and series/model category consistency. Scope remains masterdata-only plus required evidence, generated scan/context, registry, and memory files. `beforeSalesOrder` remains blocked.

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

- [local] Node masterdata suite passed 34/34.
- [local] Maven unit suite passed 58/58, including focused masterdata service tests at 21/21.
- [local] MySQL 8.0.36 Testcontainers integration passed 1/1 and observed a real wait on the permanent hierarchy mutex before both concurrent first-root inserts committed.
- [local] Direct SQL cycle/depth corruption produced two cycle-node and one over-depth violation; the service failed closed within the timeout, released locks for a new transaction, and validation returned clean after repair.
- [local] Backend reactor compile, regenerated scans/context, review binding, impact scope, and Java/Node test ownership checks pass.
- [local] The complete project gate passed with 381/381 Node tests; finalization matches exactly 29 recorded and actual paths.

## Risks

- Existing databases need the updated V005 migration followed by the complete `sql/validation/masterdata_runtime_validation.sql` before future runtime acceptance or deployment; mutex, category root-reachability/cycle/depth, seven orphan, and model/series consistency checks must all pass.
- Direct database writers remain outside the service locking protocol and must execute that complete validation script after every direct write.
- Product-category hierarchy writes intentionally serialize for integrity.
- Testcontainers `mysql` 1.21.3 resolves transitive `jdbc`/core 1.21.4; align the Maven dependency versions in a separate governance/dependency record because POM files are outside the masterdata business scope.

## Next Actions

- Finalize, run the complete project gate, stage exactly, independently review, and commit the masterdata batch.
- Complete the separate system notice, production profile/checker, Testcontainers alignment, and frontend dependency migration batches.
- Push the reviewed commit series only after the final repository gate; do not release or deploy.
