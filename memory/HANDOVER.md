# Handover
## Summary
修复客户详情权限、查询写入、样品返现伪造与重复入账、归属并发审计和角色校验风险
Current change record: `ai/changes/CR-20260714T013244Z-change`.
## Impact
Current change `CR-20260714T013244Z-change` affects 54 recorded files. See `ai/changes/CR-20260714T013244Z-change/changed-files.json` for exact coverage.
## Changed Files
- `ai/changes/CR-20260714T013244Z-change/boundary-exception.md`
- `ai/changes/CR-20260714T013244Z-change/changed-files.json`
- `ai/changes/CR-20260714T013244Z-change/component-exception.md`
- `ai/changes/CR-20260714T013244Z-change/handover.md`
- `ai/changes/CR-20260714T013244Z-change/impact.json`
- `ai/changes/CR-20260714T013244Z-change/plan.md`
- `ai/changes/CR-20260714T013244Z-change/request.md`
- `ai/changes/CR-20260714T013244Z-change/split-plan.md`
- `ai/changes/CR-20260714T013244Z-change/verification.md`
- `ai/changes/CURRENT_CHANGE.json`
- `ai/context/current-context.json`
- `ai/context/current-context.md`
- `ai/contracts/customer.api.md`
- `ai/contracts/customer.db.md`
- `ai/contracts/customer.delete-ownership.md`
- `ai/contracts/customer.permission.md`
- `ai/contracts/customer.ui.md`
- `ai/generated/api-clients.json`
- `ai/generated/backend-routes.json`
- `ai/generated/component-usage.json`
- `ai/generated/db-schema.json`
- `ai/generated/frontend-routes.json`
- `ai/generated/permissions.json`
- `ai/registry/features.json`
- `ai/registry/high-risk-permission-coverage.json`
- `ai/registry/modules.json`
- `ai/reviews/RV-20260714T012241Z-review/architecture-review.md`
- `ai/reviews/RV-20260714T012241Z-review/backend-review.md`
- `ai/reviews/RV-20260714T012241Z-review/context.md`
- `ai/reviews/RV-20260714T012241Z-review/decision.md`
- plus 24 additional files in the current change record.
## Commands
- `[local] npm run scan:all`
- `[local] node --test tests/customer-risk-gate.test.js`
- `[local] mvn -pl ruoyi-admin -am test`
- `[local] mvn -pl ruoyi-business -am -Pintegration-test verify`
- `[local] npm test`
- `[local] npm --prefix ruoyi-ui run build:prod`
- `[local] git diff --check`
- `[inconclusive] npm run check` (stopped at the governance context-build idempotency test)
## Verification
- [local] Customer risk 19/19, Maven unit 37/37, MySQL 8 Testcontainers 1/1, standalone Node 265/265 before the final context refresh, frontend build (2554 modules), scans, high-risk governance, and `git diff --check` passed.
- [inconclusive] The later full `npm run check` reached the final Node suite and stopped at 264/265 on the governance context-build idempotency test. Customer-specific verification stayed green; project closure remains blocked until the governance repair.
## Risks
- The authenticated browser role matrix is [not-run] and remains for final cross-batch runtime review.
- Existing development databases must be rebuilt or audited before future sample-rebate authority enablement; current creation is fail-closed.
## Next Actions
- Commit the bounded customer batch with the governance blocker recorded, then open the separate masterdata change. The final push remains blocked until the governance batch restores a clean full gate.
