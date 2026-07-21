# Verification

Status: verified [local]

## Commands

- [local] `npm run resume`; Git status/log and R-11 commit/push/post-push/CI verification.
- [local] Review-only baseline prechecks: `npm run check:review`, `check:handover-integrity`, `check:memory-quality`, `check:current-doc-state`, `check:file-weight`, and `git diff --check`.
- [local] Review-only commit `f28e3d12358bdc35ac1782fd50be7850f937bc1b`; later published to `origin/master` before implementation commit `9cb1f59d89949330cfe796ae2db25728d356038c`.
- [local] `npm run impact -- masterdata`, `npm run check:review`, and `npm run check:phase-gate` after rebasing `impact.baseRevision`.
- [local] `node --test tests/masterdata-runtime.test.js`.
- [local] Maven `-pl ruoyi-business -am verify` and `-Pintegration-test verify`.
- [local] Maven `-pl ruoyi-admin -am -DskipTests package`.
- [local] `npm run build` in `ruoyi-ui`.
- [runtime-local] MySQL V007 migration and both validation SQL files on `my_ry_vue_runtime`.
- [runtime-local] Real backend/frontend API and browser acceptance; whole-state rollback rehearsal with review-base code.
- [local] `npm run scan:all`.
- [local] Final `npm run finalize:change`, `npm run check` with 491/491 Node tests, `npm run close:change`, and `git diff --check` passed.
- [local] `git push origin master` published both R-12A commits without rewrite; `HEAD`, `origin/master`, and the remote master ref aligned at `9cb1f59d89949330cfe796ae2db25728d356038c`.
- [ci] `scaffold-ci` run `29792754518` for implementation SHA `9cb1f59d89949330cfe796ae2db25728d356038c` completed with overall `failure`: `governance` and `backend-tests` succeeded, while `frontend-build` failed.
- [ci] Frontend install and tests passed; the mandatory audit failed on high-severity `GHSA-3jxr-9vmj-r5cp` in transitive `brace-expansion@2.1.1`, so the production build step was skipped.
- [local] Clean-worktree `npm run check:after-push` passed; the same frontend audit failure and dependency chain were reproduced locally.

## Evidence

- [local] The review-only commit contains the R-12A decision with `Allow Implementation`; current `impact.baseRevision` equals that commit and the review package has no implementation-range diff.
- [local] Product catalog facts are 产品大类、产品系列、产品型号. Current Java/Vue/contracts do not give product-model field/process/formula/BOM/production/DXF behavior.
- [local] The only backend resources are product category/series/model, material category/item, accessory category/item, option set/value. No old resource key or compatibility branch remains.
- [runtime-local] Strategy A migrated 4 old categories to 4 option sets and 2 old values to 2 option values; all four selection modes are `SINGLE`.
- [runtime-local] Final validation reports both old tables absent, no orphans, no duplicate same-set codes, required CHECK/FK/unique indexes present, one new menu, no old menu/permission alias, and current product wording.
- [runtime-local] The missing reserved hierarchy mutex sentinel was explicitly corrected (`0 -> 1`, one reserved row); shared validation passed and no business row was silently repaired.
- [runtime-local] API acceptance covered option-set/value CRUD/status/ownership/options/delete protection, product hierarchy/relations/codes, authentication and 403 authorization, old API failure, and material/accessory/customer list regression.
- [runtime-local] Browser acceptance covered login, catalog wording/tree, option set/value add/edit/status/delete protection, menu/permission visibility, material/accessory/customer rendering, and old URL 404.
- [local] Browser-discovered repeated-edit number-input state was fixed with a per-form render sequence and a focused regression assertion.
- [local] Focused Node 39/39; Java unit 65/65 including masterdata 28/28; MySQL Testcontainers 2/2; UI 7/7; Maven package and Vue production build passed.
- [runtime-local] Pre-cutover backup and post-migration/pre-fixture backup hashes are recorded. Old review-base code started against restored old data and both old APIs returned 200; the isolated runtime/database/worktree were cleaned up.
- [runtime-local] Final database was restored to the clean post-migration snapshot and revalidated at 4 option sets, 2 values, 4 SINGLE modes, and zero old tables.
- [local] Customer business/fund runtime and all forbidden field/process/order/formula/BOM/production/DXF runtime paths have zero diff.
- [local] `engineeringCoreReady=blocked` and `beforeSalesOrder=blocked`.
- [local] Detailed runtime evidence is under `runtime-evidence/`.
- [local] R-12A did not change `package.json` or lock files; the advisory was published after the previous green baseline and requires a separate dependency-security repair batch.

## Residual Boundaries

- [local] The generated database scanner is lexical over migration history and may list historical V005/V006 CREATE tokens. Live MySQL and executable validation SQL are the runtime authority; no governance rule was changed in R-12A.
- [ci] R-12A source commits are published, but the implementation is not CI-green or release-successful because run `29792754518` failed. R-12B remains not started.
