# Current Context

Current change: `CR-20260628-r-09-configurable-modeling-contract-package`
Repository: RuoYi + Vue3 + Codex Auto Dev OS
Profile: adapter `ruoyi`, locked `true`

## Current Work

R-09 is a contract-only configurable modeling package. It captures the future ERP direction before any sales-order, process, material, formula, drawing, or technical-review runtime work.

## Core Decision

Product category, product series, product model, sales options, sales configuration processes, field library entries, option schemas, formula variables, formula groups, calculation rules, glass rules, offset rules, decomposition templates, part templates, and calculation snapshots must be configuration/version/snapshot driven.

`门`, `门匾`, `栅栏`, `护栏`, `钣金件`, `异形件`, `工程定制`, `单开`, `对开`, `子母`, `连体子母`, `玻璃拼接`, `整拼`, `铝卡`, `型材`, `拉手`, `锁具`, and `铰链` are configurable data examples, not fixed runtime models.

## Allowed Edit Roots For This Change

- `ai/contracts/masterdata.*.md`
- `ai/contracts/rule.*.md`
- `ai/contracts/tech*.md`
- `ai/changes/CR-20260628-r-09-configurable-modeling-contract-package`
- `ai/changes/CURRENT_CHANGE.json`
- `ai/context/current-context.md`
- `ai/context/current-context.json`
- `memory/HANDOVER.md`

## Forbidden Edit Roots For This Change

- `ruoyi-business/src/main/java`
- `ruoyi-admin/src/main/java`
- `ruoyi-business/src/main/resources/mapper`
- `ruoyi-ui/src/views`
- `ruoyi-ui/src/api`
- `sql/migrations`
- `sql/validation`
- `package.json`
- `tools`
- `.github/workflows`
- production or development security configuration files

## Must Read Files

- `AGENTS.md`
- `memory/HANDOVER.md`
- `ai/changes/CR-20260628-r-09-configurable-modeling-contract-package/impact.json`
- `ai/contracts/masterdata.snapshot-versioning.md`
- `ai/contracts/masterdata.contract-test-matrix.md`

## Verification Boundary

R-09 was created through the GitHub connector. Local commands were not run in this evidence pass. A local closeout should run `npm run resume`, `npm run check`, and `git diff --check` before treating this batch as locally verified.

## Next Step

After R-09 acceptance and local gate verification, continue to R-10 product/material/sales-option master data MVP. Do not create sales-order runtime before the later sales-order contract package is approved.
