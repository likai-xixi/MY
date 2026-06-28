# Handover

## Summary

R-10B implements the masterdata MVP runtime for the nine approved product, material, accessory, and sales-option masterdata resources: product category, product series, product model, material category, material item, accessory category, accessory item, sales option category, and sales option value.

[local] R-10C live acceptance executed the masterdata MySQL migrations, validation SQL, nine-resource API acceptance, and browser UI acceptance on the local stack. The accepted canonical RuoYi menu route `/business/masterdata` passed browser acceptance; direct `/masterdata` returned RuoYi 404, is recorded as non-canonical, and is not an R-10D trigger.

Sales-order remains blocked by the `beforeSalesOrder` gate. R-11 has not started.

## Impact

This change affects 54 recorded path(s). See changed-files.json for the complete coverage list, which is aligned with the current git diff.

## Changed Files

- `ai/changes/CR-20260628-r-10b-masterdata-mvp-runtime/changed-files.json`
- `ai/changes/CR-20260628-r-10b-masterdata-mvp-runtime/boundary-exception.md`
- `ai/changes/CR-20260628-r-10b-masterdata-mvp-runtime/component-exception.md`
- `ai/changes/CR-20260628-r-10b-masterdata-mvp-runtime/handover.md`
- `ai/changes/CR-20260628-r-10b-masterdata-mvp-runtime/impact.json`
- `ai/changes/CR-20260628-r-10b-masterdata-mvp-runtime/plan.md`
- `ai/changes/CR-20260628-r-10b-masterdata-mvp-runtime/request.md`
- `ai/changes/CR-20260628-r-10b-masterdata-mvp-runtime/verification.md`
- `ai/changes/CURRENT_CHANGE.json`
- `ai/context/current-context.json`
- `ai/context/current-context.md`
- `ai/contracts/masterdata.api.md`
- `ai/contracts/masterdata.db.md`
- `ai/contracts/masterdata.delete-ownership.md`
- `ai/contracts/masterdata.permission.md`
- `ai/contracts/masterdata.r10-contract-test-matrix.md`
- `ai/contracts/masterdata.r10-implementation-boundary.md`
- `ai/contracts/masterdata.ui.md`
- `ai/generated/backend-routes.json`
- `ai/generated/component-usage.json`
- `ai/generated/db-schema.json`
- `ai/generated/frontend-routes.json`
- `ai/generated/permissions.json`
- `ai/registry/feature-id-dictionary.json`
- `ai/registry/features.json`
- `ai/registry/migration-registry.json`
- `ai/registry/modules.json`
- `features/masterdata.md`
- `graph/api-graph.json`
- `graph/module-graph.json`
- `graph/render-graph.mmd`
- `graph/ui-graph.json`
- `memory/API_CATALOG.md`
- `memory/CHANGELOG.md`
- `memory/HANDOVER.md`
- `memory/MODULE_MAP.md`
- `memory/TASKS.json`
- `ruoyi-admin/src/main/java/com/ruoyi/web/controller/business/masterdata/MasterDataController.java`
- `ruoyi-business/src/main/java/com/ruoyi/business/masterdata/domain/MasterDataRecord.java`
- `ruoyi-business/src/main/java/com/ruoyi/business/masterdata/domain/MasterDataResource.java`
- `ruoyi-business/src/main/java/com/ruoyi/business/masterdata/mapper/MasterDataMapper.java`
- `ruoyi-business/src/main/java/com/ruoyi/business/masterdata/service/IMasterDataService.java`
- `ruoyi-business/src/main/java/com/ruoyi/business/masterdata/service/impl/MasterDataServiceImpl.java`
- `ruoyi-business/src/main/resources/mapper/masterdata/MasterDataMapper.xml`
- `ruoyi-ui/src/api/masterdata.contract.md`
- `ruoyi-ui/src/api/masterdata.js`
- `ruoyi-ui/src/views/masterdata/README.md`
- `ruoyi-ui/src/views/masterdata/index.vue`
- `ruoyi-ui/src/views/masterdata/screen.md`
- `sql/masterdata.ownership.md`
- `sql/migrations/V20260628_005_masterdata_r10_schema.sql`
- `sql/migrations/V20260628_006_masterdata_r10_menu_permission.sql`
- `sql/validation/masterdata_runtime_validation.sql`
- `tests/masterdata-runtime.test.js`

## Commands

- [local] `npm run resume`
- [local] `git -c http.proxy= -c https.proxy= fetch origin master`
- [local] `node --test tests/masterdata-runtime.test.js`
- [local] `npm run scan:all`
- [local] `npm run build:graph`
- [local] `npm run sync:memory`
- [local] `npm run context:build -- masterdata`
- [local] `npm run finalize:change`
- [local] `npm run check:registry`
- [local] `npm run check:graph`
- [local] `npm run build:graph:check`
- [local] `npm run sync:memory:check`
- [local] `npm run check:high-risk-governance`
- [local] `git diff --check`
- [local] `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests compile`
- [local] `npm --prefix ruoyi-ui run build:prod`
- [local] `npm run check`
- [local] R-10C `git -c http.proxy= -c https.proxy= fetch origin master`
- [local] R-10C `git rev-parse HEAD origin/master FETCH_HEAD`
- [local] R-10C MySQL execution of `sql/migrations/V20260628_005_masterdata_r10_schema.sql`
- [local] R-10C MySQL execution of `sql/migrations/V20260628_006_masterdata_r10_menu_permission.sql`
- [local] R-10C MySQL execution of `sql/validation/masterdata_runtime_validation.sql`
- [local] R-10C `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests package`
- [local] R-10C backend start on `http://localhost:18080` with database `my_ry_vue_runtime` and Redis DB `1`
- [local] R-10C frontend start on `http://127.0.0.1:5173` with `RUOYI_API_BASE=http://localhost:18080`
- [local] R-10C inline API acceptance script for all nine masterdata resources
- [local] R-10C in-app browser acceptance on `/business/masterdata`

## Verification

[local] R-10B focused runtime guard passed 7/7 and verifies the exact nine resources, generic backend routes, code/name/status/logical-delete service rules, executable SQL scope, generic frontend API/page behavior, and absence of forbidden sales-order runtime paths.
[local] Backend Maven compile passed for `ruoyi-admin -am -DskipTests compile`; frontend `build:prod` passed.
[local] `git diff --check` passed.
[local] Full `npm run check` passed with 240/240 Node tests after regenerating the context pack with `npm run context:build -- customer`; existing config-safety warnings remain development/default warnings only.
[local] R-10C MySQL validation passed on `my_ry_vue_runtime`: all nine masterdata tables exist, masterdata list/publish permissions exist, and duplicate-code validation queries returned no rows.
[local] R-10C API acceptance passed for all nine resources: list/add/detail/edit/changeStatus/options/logical remove/deleted-list/deleted-detail behavior, required code/name, trim, uniqueness, and dependency validation.
[local] R-10C browser acceptance passed on the canonical RuoYi route `/business/masterdata`: login session established, nine tabs visible, every tab displayed a list/table, product category add/edit/disable/delete worked, and forbidden future-runtime entry text did not appear.
[local] R-10C non-canonical route evidence: direct `/masterdata` returned RuoYi 404 while canonical `/business/masterdata` worked; this is accepted and does not require R-10D.

## Risks

- Direct frontend route `/masterdata` returned RuoYi 404 because it is not the accepted canonical route; canonical `/business/masterdata` passed, so no masterdata API/browser blocker remains and no R-10D is opened.
- R-10C browser login used an authenticated local session token because the page contains a local captcha; the UI page behavior was still validated in a real browser session.
- R-11 runtime work is intentionally not part of this change.

## Next Actions

- R-10C evidence closeout only: commit and push the live acceptance evidence after `npm run check` and `git diff --check` pass.
- Do not enter R-11/R-11A in this pass; any later R-11A contract pre-review must be opened by a separate user request and still must not create runtime until the gate allows it.
