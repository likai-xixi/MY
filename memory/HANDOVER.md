# Handover

## Summary

R-12A review-only baseline `f28e3d12358bdc35ac1782fd50be7850f937bc1b` is committed locally and not pushed. Its immutable review approves only the destructive catalog/option migration. The implementation, Strategy A migration, API/browser/database acceptance, and rollback rehearsal are complete locally; the implementation diff is intentionally uncommitted and unpushed.

## Impact

- Current change: `CR-20260720T134007Z-change`.
- Current review: `RV-20260720T134134Z-r-12a-option-set-option-value-masterdata`; `Decision: Allow Implementation`.
- `impact.baseRevision` is the review-only commit; the current runtime diff contains no review-package self-authorization.
- Strategy A result: 4 option sets, 2 option values, four `SINGLE` modes, zero old tables, zero orphans, and zero duplicate same-set codes.
- Current resources are product category/series/model, material category/item, accessory category/item, option set/value. Product model means 产品型号 only.
- Old sales-option API/resource/table/menu/permission/runtime paths are removed with no compatibility layer.
- No field/process/order/formula/BOM/production/DXF or customer-fund runtime was added or changed.
- `engineeringCoreReady = blocked`; `beforeSalesOrder = blocked`.

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

- [local] Review-baseline checks, impact/phase gates, focused Node/Java/UI tests, Maven package, Vue production build, scans, `npm run finalize:change`, `npm run check`, `npm run close:change`, and diff audits.
- [runtime-local] Strategy A migration, dedicated/shared validation, real API/browser/menu/permission acceptance, final clean snapshot restore, and whole-state rollback rehearsal.

## Verification

- [ci] R-11 run `29745362302` remains successful.
- [local] Focused and build checks pass: Node 39/39, Java unit 65/65, MySQL integration 2/2, UI 7/7, Maven/Vue builds, and scans.
- [local] Full `npm run check` passes with 491/491 Node tests; `npm run close:change` and `git diff --check` pass.
- [runtime-local] Migration/validation/API/browser/rollback evidence is persisted under the active change.
- [local] Review package diff=0; forbidden runtime diff=0; phase gates remain blocked.
- [not-run] R-12A implementation commit, push, and CI.

## Risks

- The generated DB scanner is lexical over migration history and can list historical CREATE tokens; live MySQL validation is the runtime authority.
- Local acceptance is not CI. Implementation is not yet immutable or remotely backed up.

## Next Actions

- User reviews the uncommitted R-12A implementation and evidence.
- Commit/push only on explicit instruction. Do not modify the review decision or begin R-12B.
