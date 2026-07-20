# QA Review

## Position

QA recommends conditional `Allow Implementation` for R-12A only after all review conditions are frozen. Release remains `NO-SHIP` until real MySQL, API, browser, rollback, reverse-audit, and CI evidence pass.

R-12A is a destructive persisted-identity, API-resource, menu/route, permission-evidence, and operator-language cutover. Static wording changes cannot prove it complete.

## Frozen Test Contract

- New resource keys: `option-set` and `option-value` on the existing `/business/masterdata/{resource}` surface.
- New relation: `optionValue.optionSetId`; the old sales-option `categoryId` meaning must not survive in the new API/DDL.
- `optionSet.selectionMode` accepts exactly `SINGLE` or `MULTIPLE`.
- New generated prefixes are `OS` and `OV`; migrated historical codes are preserved as data, but the new runtime never generates `SOC`/`SOV`.
- Product/material/accessory tables and behavior remain; R-12A does not execute the later whole engineering-core cutover.
- Live inventory selects deterministic migration Strategy A: preserve four old category rows and two old value rows, map every old set to `SINGLE` because the old schema had no cardinality field, validate the mapping, then drop both old tables.

## Verification Matrix

| Layer | Required execution | Passing evidence |
| --- | --- | --- |
| Review/scope | `npm run check:review`; exact base/allowed/forbidden audit | Approved five-role review bound to the CR and present in the committed implementation base |
| Governance/static | `npm run scan:all`; finalize; full check; close; diff check | Registry, ownership, API/UI graphs, scans, context, memory, and handover agree |
| Focused static | `node --test tests/masterdata-runtime.test.js` | New vocabulary/labels/routes/tables/invariants and negative old-surface/forbidden-runtime checks |
| Java unit | configured Maven masterdata tests | Option ownership/delete/status/code/row-count validation plus preserved product hierarchy/reference tests |
| Real MySQL integration | integration-test profile on MySQL 8 | Parent-child locking, disabled-child delete protection, concurrent writes, hierarchy mutex/depth/cycle checks |
| Backend build | `mvn.cmd -pl ruoyi-admin -am -DskipTests package` or equivalent compile | Controller/service/mapper/domain and reactor compile together |
| Vue | frontend tests and `build:prod` | New page/labels/forms/permissions/API client build; grouped pages and product tree regress |
| Migration | Backup, execute R-12A SQL, then both validation files | Counts reconcile 4 -> 4 and 2 -> 2; new constraints are present; old tables absent; no orphan/duplicate/invalid mode |
| API positive | Authenticated list/options/detail/create/edit/status/export/delete | All retained resources plus option-set/value work; generated/immutable codes and delete protection pass |
| API negative/auth | Missing/limited token, invalid mode/set, disabled set selection, old keys | Expected denial/non-2xx and zero unintended mutation; old resource keys never succeed |
| Browser | Login, four grouped menus, CRUD/status/delete/tree and regression flows | `产品型号` and `选项配置`; old labels/menu/route absent; least-privilege buttons and server denial verified |
| Reverse audit | Targeted active-source/runtime/DB scan | No process meaning in product-model, no old sales-option runtime, compatibility path, forbidden adjacent runtime, or customer-fund change |
| Rollback | Restore pre-cutover dump with matching pre-cutover code | Restore transcript/checksum and old-schema smoke; no mixed-version rollback claim |
| Publication | Exact-SHA GitHub Actions and clean-worktree after-push check | `[ci]` only after the user later authorizes commit/push and the actual jobs pass |

## Runtime Acceptance Details

- Prefer the existing local `my_ry_vue_runtime` acceptance database only after writers are stopped and a checksum-backed dump is captured.
- API evidence must include `option-set` and `option-value` full CRUD/status/options/export, required ownership, same-set duplicate rejection, disabled-set options filtering, delete protection, old-key rejection, and backend permission denial.
- Browser evidence must cover direct navigation/reload of `/masterdata/option-config`, absence of `/masterdata/sales-option-config`, product tree default collapse and targeted expansion, product series/model relationships, option mode and membership, material/accessory regression, and customer-management basic regression.
- Use `[local]`, `[runtime-local]`, `[ci-planned]`, `[ci]`, and `[not-run]` without conflating layers.

## QA Decision

Conditional implementation Go only for the approved masterdata roots. Any compatibility path, forbidden-root change, uncommitted review base, missing backup, failed focused/Maven/Vue/MySQL/API/browser/reverse/rollback evidence, or inaccurate provenance returns the change to `Implementation blocked`.

`engineeringCoreReady` and `beforeSalesOrder` remain blocked. No release or publication is authorized by this review.
