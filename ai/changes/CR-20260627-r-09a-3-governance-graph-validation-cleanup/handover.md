# Handover

## Summary

R-09A.3 governance graph validation cleanup

## Impact

This change affects 44 recorded path(s). See changed-files.json for the complete coverage list.

## Changed Files

- `README.md`
- `ai/changes/CR-20260627-r-09a-3-governance-graph-validation-cleanup/boundary-exception.md`
- `ai/changes/CR-20260627-r-09a-3-governance-graph-validation-cleanup/changed-files.json`
- `ai/changes/CR-20260627-r-09a-3-governance-graph-validation-cleanup/component-exception.md`
- `ai/changes/CR-20260627-r-09a-3-governance-graph-validation-cleanup/handover.md`
- `ai/changes/CR-20260627-r-09a-3-governance-graph-validation-cleanup/impact.json`
- `ai/changes/CR-20260627-r-09a-3-governance-graph-validation-cleanup/plan.md`
- `ai/changes/CR-20260627-r-09a-3-governance-graph-validation-cleanup/request.md`
- `ai/changes/CR-20260627-r-09a-3-governance-graph-validation-cleanup/rule-preflight.md`
- `ai/changes/CR-20260627-r-09a-3-governance-graph-validation-cleanup/verification.md`
- `ai/changes/CURRENT_CHANGE.json`
- `ai/context/current-context.json`
- `ai/context/current-context.md`
- `ai/context/features/customer.md`
- `ai/generated/backend-routes.json`
- `ai/generated/component-usage.json`
- `ai/generated/db-schema.json`
- `ai/generated/frontend-routes.json`
- `ai/generated/permissions.json`
- `ai/registry/features.json`
- `ai/registry/high-risk-permission-coverage.json`
- `ai/registry/idempotency-registry.json`
- `ai/registry/migration-registry.json`
- `features/customer.md`
- `graph/api-graph.json`
- `graph/ui-graph.json`
- `memory/CHANGELOG.md`
- `memory/HANDOVER.md`
- `memory/PROJECT_STATE.md`
- `memory/TASKS.json`
- `sql/validation/customer_runtime_validation.sql`
- `sql/validation/idempotency_runtime_validation.sql`
- `tests/component-scan.test.js`
- `tests/graph.test.js`
- `tests/high-risk-governance.test.js`
- `tests/registry-checker.test.js`
- `tools/dependency-checker.js`
- `tools/high-risk-governance-checker.js`
- `tools/ownership-syncer.js`
- `tools/registry-checker.js`
- `tools/scan-backend-routes.js`
- `tools/scan-components.js`
- `tools/scan-frontend-routes.js`
- `tools/scan-permissions.js`

## Commands

- `[local] npm run resume`
- `[local] npm run rule:preflight -- before-sales-order-phase-gate customer-fund-deposit-entry customer-sample-rebate-generation public-customer-invariant`
- `[local] npm run scan:all`
- `[local] npm run context:build -- customer`
- `[local] npm run build:graph`
- `[local] npm run check:graph`
- `[local] npm run check:high-risk-governance`
- `[local] npm run check:components`
- `[local] npm run check:component-similarity`
- `[local] npm run check:ownership`
- `[local] node --test tests/high-risk-governance.test.js`
- `[local] node --test tests/component-scan.test.js`
- `[local] node --test tests/graph.test.js`
- `[local] node --test tests/customer-risk-gate.test.js`
- `[local] node --test tests/boundary-lint.test.js`
- `[local] node --test tests/registry-checker.test.js`
- `[local] npm test`
- `[local] npm run check`
- `[local] git diff --check`

## Verification

[local] `npm run rule:preflight -- before-sales-order-phase-gate customer-fund-deposit-entry customer-sample-rebate-generation public-customer-invariant`, `npm run scan:all`, `npm run context:build -- customer`, `npm run build:graph`, graph/high-risk/component/similarity/ownership checks, focused tests including `tests/registry-checker.test.js` 5/5, full `npm test` with 222/222 tests, final `npm run check`, and final `git diff --check` passed.

[local] R-09A.3 evidence confirmed customer runtime validation no longer includes `idempotent_request`; platform owns `idempotent_request` and `sql/validation/idempotency_runtime_validation.sql`; UI graph screens are backed by real frontend files; global Vue component tags are scanned; and high-risk customer API graph entries carry dedicated permission and risk-domain metadata.

## Risks

- [not-run] Backend runtime API calls, browser validation, Maven compile, frontend production build, database migration execution, and CI were not run because this is governance graph/validation cleanup rather than runtime behavior change.
- [local] Current-CR boundary/component exceptions are exact-path exceptions for inherited RuoYi router/tool-generator files only; they do not permit customer runtime or sales-order runtime edits.

## Next Actions

- Continue R-09B sales-order pre-implementation contract work only through review/context workflow; `beforeSalesOrder` remains blocked.
- Keep future idempotency table validation under platform ownership and customer endpoint idempotency entries as usage of that platform capability.
