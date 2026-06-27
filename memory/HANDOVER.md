# Handover

## Summary

Current change record: `ai/changes/CR-20260627T120650Z-r-09a-1-governance-false-green-hardening`.

R-09A.1 is a governance/rule-change batch for false-green hardening. It does not implement sales-order and does not modify customer fund business logic.

## Impact

The change hardens six governance surfaces:

- `check:diff` now enforces `impact.forbiddenEditRoots`, fails allowed/forbidden overlaps, and gives forbidden roots priority over allowed roots.
- `check:phase-gate` now detects sales-order runtime bypasses in RuoYi shared/runtime-capable roots such as `ruoyi-system`, `ruoyi-generator`, `ruoyi-quartz`, admin SQL, router, `permission.js`, and store.
- `scan:permissions` now maps RuoYi `business:<feature-id>:<action>` permissions to the second segment feature id, so `business:customer:*` scans to `customer`.
- `check:ownership` now requires every `features.json` registered permission to exist in `ai/generated/permissions.json`.
- `rule:preflight` without explicit rule object ids is audit-only and fails in rule-change mode.
- `check:rule-objects` now validates `createdByChange` / `updatedByChange` directories and owned-file ownership or explicit exception reasons.

## Changed Files

- `tools/diff-checker.js`
- `tools/phase-gate-checker.js`
- `tools/scan-permissions.js`
- `tools/ownership-checker.js`
- `tools/rule-object-checker.js`
- `scripts/rule-change-preflight.js`
- `tests/diff-checker.test.js`
- `tests/governance-sales-order-handoff-gate.test.js`
- `tests/permission-scan.test.js`
- `tests/ownership-checker.test.js`
- `tests/rule-object-governance.test.js`
- `ai/generated/permissions.json`
- `ai/registry/features.json`
- `ai/registry/rule-objects.json`
- `ai/roadmap/phase-gates.json`
- `ai/context/current-context.md`
- `ai/context/current-context.json`
- `memory/HANDOVER.md`
- `memory/PROJECT_STATE.md`
- `memory/CHANGELOG.md`
- `memory/TASKS.json`
- `ai/changes/CR-20260627T120650Z-r-09a-1-governance-false-green-hardening/*`

## Commands

- [local] `npm run resume`
- [local] `npm run rule:preflight -- before-sales-order-phase-gate customer-fund-deposit-entry customer-sample-rebate-generation public-customer-invariant`
- [local] `npm run scan:all`
- [local] `npm run check:diff`
- [local] `npm run check:phase-gate`
- [local] `npm run check:rule-objects`
- [local] focused Node governance tests passed 35/35
- [local] baseline boundary/component/ownership-sync tests passed 19/19
- [local] `npm test` passed 213/213
- [local] `npm run check` passed end to end with final `npm test` 213/213
- [local] final `git diff --check` passed with no whitespace errors

## Verification

[local] `beforeSalesOrder` remains `blocked`. [local] Explicit rule-object preflight passed for `before-sales-order-phase-gate`, `customer-fund-deposit-entry`, `customer-sample-rebate-generation`, and `public-customer-invariant`. [local] `scan:all`, `check:diff`, `check:phase-gate`, `check:rule-objects`, focused tests, baseline guard tests, and full `npm test` passed locally. [local] Final `npm run check` passed end to end with final `npm test` 213/213; existing config-safety development/default warnings remained warning-only. [local] Final `git diff --check` passed with no whitespace errors.

## Risks

This is governance-only. It does not prove business runtime behavior, Maven backend compile, frontend production build, browser acceptance, or CI status. Generated permission/ownership sync touched built-in RuoYi monitor/tool registry entries because the hardened scanner now attributes their permissions from real permission codes.

## Next Actions

Continue with R-09B sales-order pre-implementation contracts while keeping `beforeSalesOrder` blocked.
