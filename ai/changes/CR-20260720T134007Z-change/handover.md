# Handover

## Summary

R-12A destructive catalog-option migration was implemented and locally accepted from immutable review base `f28e3d12358bdc35ac1782fd50be7850f937bc1b`. Review-only commit `f28e3d12358bdc35ac1782fd50be7850f937bc1b` and implementation commit `9cb1f59d89949330cfe796ae2db25728d356038c` are published on `origin/master`; implementation CI is not green.

## Impact

- Product catalog now means 产品大类 / 产品系列 / 产品型号 only.
- `sales-option-category/value`, their old tables, old page/menu, and old resource paths are replaced by `option-set/value` with no compatibility layer.
- Option sets support `SINGLE/MULTIPLE`; option values require `optionSetId`; effective referenced values protect set deletion.
- Existing product-category hierarchy, series/model relations, backend code generation, material/accessory catalog, and customer-fund boundary are preserved.
- `engineeringCoreReady` and `beforeSalesOrder` remain blocked.

## Changed Files

- `ai/changes/CR-20260720T134007Z-change/changed-files.json`
- `ai/changes/CR-20260720T134007Z-change/handover.md`
- `ai/changes/CR-20260720T134007Z-change/impact.json`
- `ai/changes/CR-20260720T134007Z-change/runtime-evidence/api-browser-acceptance.md`
- `ai/changes/CR-20260720T134007Z-change/runtime-evidence/build-test-results.md`
- `ai/changes/CR-20260720T134007Z-change/runtime-evidence/database-acceptance.md`
- `ai/changes/CR-20260720T134007Z-change/verification.md`
- `ai/context/current-context.json`
- `ai/context/current-context.md`
- `ai/context/features/masterdata.md`
- `ai/contracts/engineering-core.index.md`
- `ai/contracts/engineering-core.migration-plan.md`
- `ai/contracts/masterdata.api.md`
- `ai/contracts/masterdata.db.md`
- `ai/contracts/masterdata.delete-ownership.md`
- `ai/contracts/masterdata.migration-plan.md`
- `ai/contracts/masterdata.product.md`
- `ai/contracts/masterdata.r10-contract-test-matrix.md`
- `ai/contracts/masterdata.r10-implementation-boundary.md`
- `ai/contracts/masterdata.sales-option.md`
- `ai/contracts/masterdata.ui.md`
- `ai/generated/component-usage.json`
- `ai/generated/db-schema.json`
- `ai/generated/frontend-routes.json`
- `ai/generated/permissions.json`
- `ai/registry/features.json`
- `ai/registry/migration-registry.json`
- `features/masterdata.md`
- `graph/ui-graph.json`
- `memory/API_CATALOG.md`
- `memory/CHANGELOG.md`
- `memory/HANDOVER.md`
- `memory/PROJECT_STATE.md`
- `memory/TASKS.json`
- `memory/sessions/2026-07-21-r-12a-runtime.md`
- `ruoyi-business/src/main/java/com/ruoyi/business/masterdata/domain/MasterDataRecord.java`
- `ruoyi-business/src/main/java/com/ruoyi/business/masterdata/domain/MasterDataResource.java`
- `ruoyi-business/src/main/java/com/ruoyi/business/masterdata/mapper/MasterDataMapper.java`
- `ruoyi-business/src/main/java/com/ruoyi/business/masterdata/service/impl/MasterDataServiceImpl.java`
- `ruoyi-business/src/main/resources/mapper/masterdata/MasterDataMapper.xml`
- `ruoyi-business/src/test/java/com/ruoyi/business/masterdata/service/MasterDataReferenceMySqlIT.java`
- `ruoyi-business/src/test/java/com/ruoyi/business/masterdata/service/MasterDataServiceTest.java`
- `ruoyi-ui/src/api/masterdata.contract.md`
- `ruoyi-ui/src/views/masterdata/README.md`
- `ruoyi-ui/src/views/masterdata/index.vue`
- `ruoyi-ui/src/views/masterdata/option-config.vue`
- `ruoyi-ui/src/views/masterdata/sales-option-config.vue`
- `ruoyi-ui/src/views/masterdata/screen.md`
- `sql/masterdata.ownership.md`
- `sql/migrations/V20260720_007_masterdata_option_set_breaking_migration.sql`
- `sql/validation/masterdata_option_set_validation.sql`
- `sql/validation/masterdata_runtime_validation.sql`
- `tests/masterdata-runtime.test.js`

## Commands

- [local] `npm run resume`, `npm run impact -- masterdata`, review/phase gates, focused Node/Java/UI tests, Maven package, Vue build, scans, finalization, full check/close, and `git diff --check`.
- [runtime-local] V007 migration, dedicated/shared MySQL validation, API/browser/menu/permission acceptance, clean-snapshot restore, and old-code whole-state rollback rehearsal.
- [local] `git push origin master` published both R-12A commits without rewrite; local, tracking, and remote refs aligned at `9cb1f59d89949330cfe796ae2db25728d356038c`.
- [ci] GitHub Actions `scaffold-ci` run `29792754518` was queried through final completion and its failed frontend job log was read.
- [local] Clean-worktree `npm run check:after-push` passed; the CI dependency-audit failure was reproduced locally.

## Verification

- [local] Focused Node 39/39, Java unit 65/65, MySQL integration 2/2, UI 7/7, Maven package, Vue build, and scanner pass.
- [runtime-local] Strategy A migration and dedicated/shared validation pass at 4 sets / 2 values / 4 SINGLE; old tables/menu/permissions are absent and rollback is rehearsed.
- [runtime-local] API/browser/menu/permission acceptance passed, including old API/URL absence and delete protection.
- [local] Final full `npm run check` passed with 491/491 Node tests; `npm run close:change` and `git diff --check` passed.
- [local] Review-only and implementation commits are published to `origin/master` with no review-package diff in the implementation commit.
- [ci] Run `29792754518`: `governance=success`, repository backend job `backend-tests=success`, `frontend-build=failure`, overall `failure`.
- [ci] The frontend job passed install and UI tests, then failed the required audit on high-severity `GHSA-3jxr-9vmj-r5cp` affecting transitive `brace-expansion@2.1.1`; production build was skipped.
- [local] `engineeringCoreReady=blocked`; `beforeSalesOrder=blocked`; R-12B has not started.

## Risks

- Scanner history can mention dropped legacy tables; use live validation for runtime absence.
- R-12A is remotely immutable but not CI-green or release-successful. The CI blocker is a newly published transitive dependency advisory; R-12A changed no package or lock file.

## Next Actions

- Publish the evidence-only post-push truth sync, then open a separate frontend dependency-security baseline repair if authorized.
- Do not edit the review decision or begin R-12B while the dependency audit and release status remain blocked.
