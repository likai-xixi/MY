# Handover

## Summary

R-09 configurable modeling contract package is the current change.

Current change record: `ai/changes/CR-20260628-r-09-configurable-modeling-contract-package`.

## Purpose

R-09 records the user's configurable ERP direction before sales-order or technical runtime work. Product categories, product series, product models, sales options, sales configuration processes, field library entries, option schemas, formula variables, formula groups, calculation rules, glass rules, offset rules, technical decomposition templates, part templates, and calculation snapshots must be configuration/version/snapshot driven.

## Key Boundary

- `门`, `门匾`, `栅栏`, `护栏`, `钣金件`, `异形件`, `工程定制`, `单开`, `对开`, `子母`, `连体子母`, `玻璃拼接`, `整拼`, `铝卡`, `型材`, `拉手`, `锁具`, and `铰链` are configurable data examples, not hard-coded runtime models.
- R-09 created contracts only.
- No sales-order runtime was created.
- No process/material/formula/drawing runtime was created.
- No SQL migration was created.
- No customer runtime was changed.
- No idempotency runtime was changed.
- No security config was changed.
- No `package.json` or `tools/` files were changed.

## Contract Files

- `ai/contracts/masterdata.product.md`
- `ai/contracts/masterdata.material.md`
- `ai/contracts/masterdata.sales-option.md`
- `ai/contracts/masterdata.process.md`
- `ai/contracts/masterdata.field-library.md`
- `ai/contracts/masterdata.option-schema.md`
- `ai/contracts/rule.formula-variable.md`
- `ai/contracts/rule.formula-group.md`
- `ai/contracts/rule.process-calculation.md`
- `ai/contracts/rule.glass-rule.md`
- `ai/contracts/rule.offset-rule.md`
- `ai/contracts/tech.decomposition-template.md`
- `ai/contracts/tech.part-template.md`
- `ai/contracts/tech.calculation-snapshot.md`
- `ai/contracts/tech-review.boundary.md`
- `ai/contracts/masterdata.snapshot-versioning.md`
- `ai/contracts/masterdata.permission.md`
- `ai/contracts/masterdata.migration-plan.md`
- `ai/contracts/masterdata.contract-test-matrix.md`

## Verification

- [github-connector] Contract files and change-record files were created on `master`.
- [not-run] `npm run check`: not run in this environment.
- [not-run] GitHub Actions: not checked in this evidence pass.
- [not-run] `verify:release`: not run.
- [not-run] runtime acceptance: not run.

## Next Actions

Run a local Codex closeout pass: `npm run resume`, inspect R-09 files, run `npm run check`, and run `git diff --check`. After R-09 is accepted, continue to R-10 product/material/sales-option master data MVP. Do not start sales-order runtime before its later contract package is approved.
