# Verification

Status: [local] passed

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

## Evidence

[local] `npm run rule:preflight -- before-sales-order-phase-gate customer-fund-deposit-entry customer-sample-rebate-generation public-customer-invariant`, `npm run scan:all`, `npm run context:build -- customer`, `npm run build:graph`, `npm run check:graph`, `npm run check:high-risk-governance`, `npm run check:components`, `npm run check:component-similarity`, and `npm run check:ownership` passed.

[local] Focused tests passed: `tests/high-risk-governance.test.js` 43/43, `tests/component-scan.test.js` 2/2, `tests/graph.test.js` 10/10, `tests/customer-risk-gate.test.js` 17/17, `tests/boundary-lint.test.js` 9/9, and `tests/registry-checker.test.js` 5/5.

[local] First full `npm test` attempt failed only because inherited RuoYi router/tool-generator boundary exceptions had not yet been recorded for this new CR. Added exact-path `boundary-exception.md` and `component-exception.md`, then reran `npm test` successfully with 222/222 Node tests after the registry route-shape regression test was added.

[local] Final `npm run check` and final `git diff --check` passed after memory, context, handover, changelog, and change-record evidence were updated.

[local] Generated evidence confirmed `graph/ui-graph.json` uses real screen files only, high-risk customer POST APIs in `graph/api-graph.json` carry dedicated permissions and risk domains, Vue template global tags are recorded in `ai/generated/component-usage.json`, customer feature ownership no longer owns `idempotent_request`, and platform owns the idempotency table plus `sql/validation/idempotency_runtime_validation.sql`.

[not-run] Backend runtime API calls, browser validation, Maven compile, frontend production build, database migration execution, and CI were not run because R-09A.3 is governance graph/validation cleanup rather than runtime behavior change.
