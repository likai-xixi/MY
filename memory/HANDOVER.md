# Handover

## Summary

R-09 configurable modeling contract package is the current change.

Current change record: `ai/changes/CR-20260628-r-09-configurable-modeling-contract-package`.

## Purpose

R-09 records the user's configurable ERP direction before sales-order or technical runtime work. The local reconcile keeps the remote `masterdata.*`, `rule.*`, and `tech.*` contract structure, then folds missing f959 `r09-*` clauses into those files without creating a second contract set.

## Impact

This change affects R-09 contracts and closeout evidence only. It strengthens configurable modeling clauses for product/category/series/model, material/accessory data, sales options, sales configuration processes, field library and field schemes, option schemes, snapshots, formula variables/groups, process/glass/offset rules, technical decomposition templates, part templates, calculation snapshots, and the R-10 through R-17 roadmap boundary.

## Key Boundary

- `门`, `门匾`, `栅栏`, `护栏`, `钣金件`, `异形件`, `工程定制`, `庭院门`, `入户门`, `玻璃拼接门`, `整拼门`, `铝卡门`, `型材门`, `单开`, `对开`, `子母`, `连体子母`, `玻璃拼接`, `整拼`, `铝卡`, `型材`, `发光字`, `铁艺栅栏`, `钣金折弯`, `拉手`, `锁具`, and `铰链` are configurable data examples, not hard-coded runtime models.
- R-09 remains contract-only.
- No `r09-*` files were created.
- No sales-order runtime was created.
- No Java service/controller/mapper/domain was created or modified.
- No Vue page or API client was created or modified.
- No SQL migration was created.
- No customer runtime was changed.
- No idempotency runtime was changed.
- No security config was changed.
- No `package.json`, `tools/`, or `.github/workflows` file was changed.

## Reconciled Contract Areas

- `masterdata.product.md`, `masterdata.material.md`, `masterdata.sales-option.md`, and `masterdata.process.md` now explicitly keep product, material, option, and sales-configuration-process concepts configurable.
- `masterdata.field-library.md`, `masterdata.option-schema.md`, `masterdata.snapshot-versioning.md`, and `masterdata.contract-test-matrix.md` now carry field scheme, option scheme, snapshot, and audit expectations without creating `masterdata.field-scheme.md`.
- `rule.formula-variable.md`, `rule.formula-group.md`, `rule.process-calculation.md`, `rule.glass-rule.md`, and `rule.offset-rule.md` now carry versioned formula/rule requirements, examples, and old-system concept mapping.
- `tech.decomposition-template.md`, `tech.part-template.md`, `tech.calculation-snapshot.md`, and `tech-review.boundary.md` now carry the sales-vs-technical boundary, generated part list, calculation snapshot content, and R-10 through R-17 roadmap boundary.

## Changed Files

- `ai/contracts/masterdata.contract-test-matrix.md`
- `ai/contracts/masterdata.field-library.md`
- `ai/contracts/masterdata.material.md`
- `ai/contracts/masterdata.option-schema.md`
- `ai/contracts/masterdata.process.md`
- `ai/contracts/masterdata.product.md`
- `ai/contracts/masterdata.sales-option.md`
- `ai/contracts/masterdata.snapshot-versioning.md`
- `ai/contracts/rule.formula-group.md`
- `ai/contracts/rule.formula-variable.md`
- `ai/contracts/rule.glass-rule.md`
- `ai/contracts/rule.offset-rule.md`
- `ai/contracts/rule.process-calculation.md`
- `ai/contracts/tech-review.boundary.md`
- `ai/contracts/tech.calculation-snapshot.md`
- `ai/contracts/tech.decomposition-template.md`
- `ai/contracts/tech.part-template.md`
- `ai/changes/CR-20260628-r-09-configurable-modeling-contract-package/*`
- `ai/context/current-context.md`
- `ai/context/current-context.json`
- `memory/CHANGELOG.md`
- `memory/HANDOVER.md`
- `memory/TASKS.json`

## Commands

- [local] `git status --short --branch` before reset showed `master...origin/master [ahead 1, behind 30]`.
- [local] `git log --oneline backup/r09-local-f959 -1` returned `f959233 docs: add configurable modeling contracts`.
- [local] `git fetch origin` failed with the known HTTPS reset; `git -c http.proxy= -c https.proxy= fetch origin` passed.
- [local] `git diff --name-status origin/master..backup/r09-local-f959` and `git diff origin/master..backup/r09-local-f959 -- ai/contracts` were used for reconcile intake without merge/rebase.
- [local] `git reset --hard origin/master` aligned local master to `6f30739 docs: update current context json for R-09 contracts`.
- [local] `npm run resume` passed after reconcile edits.
- [local] JSON parse audit passed.
- [local] `R09_CONTRACT_AUDIT_OK count=19` passed.
- [local] `SALES_ORDER_RUNTIME_ABSENT_OK` passed.
- [local] `FORBIDDEN_RUNTIME_DIFF_ABSENT_OK` passed.
- [not-run] final `npm run check`: rerun after this handover structure fix.
- [local] `git diff --check` passed before this handover structure fix.

## Verification

- [local] `npm run resume` passed after reconcile edits.
- [local] JSON parse audit passed for `memory/TASKS.json`, `ai/context/current-context.json`, `impact.json`, and `changed-files.json`.
- [local] `R09_CONTRACT_AUDIT_OK count=19` passed.
- [local] `SALES_ORDER_RUNTIME_ABSENT_OK` passed.
- [local] `FORBIDDEN_RUNTIME_DIFF_ABSENT_OK` passed for Java/Vue/API/SQL/customer/idempotency/security/package/tools/workflow roots.
- [local] `npm run context:build -- customer` passed and restored generated current-context idempotence.
- [local] Current-CR component and boundary exceptions passed for exact inherited RuoYi system/tool/generator baseline paths; no Vue/router/checker file was edited.
- [local] `npm run check` passed end to end; final `npm test` passed 233/233.
- [local] `git diff --check` passed.
- [not-run] GitHub Actions: not checked in this local closeout pass yet.
- [not-run] `verify:release`: not required for this contract-only reconcile.
- [not-run] runtime acceptance: not required because no API, browser, DB, Java, Vue, or SQL runtime changed.

## Risks

- [local] The f959 branch had stronger clauses, but its `r09-*` file structure was intentionally not adopted.
- [not-run] Runtime API/browser/DB/Maven/frontend-build acceptance was not run because this reconcile changes only contracts and memory/evidence.
- [local] `beforeSalesOrder` remains blocked; sales-order implementation still requires a later approved contract/review gate.
- [not-run] GitHub Actions was not checked in this local closeout pass.

## Next Actions

After R-09 local gates pass and this change is accepted, R-10A product/material/sales-option master data MVP may be opened as a separate change. This reconcile does not start R-10A and must not create sales-order runtime.
