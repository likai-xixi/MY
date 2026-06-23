# Handover
## Summary
客户管理公共客户与统一定金模型运行验收
Current change record: `ai/changes/CR-20260623T105432Z-change`.
## Impact
Current change `CR-20260623T105432Z-change` affects 50 recorded path(s). See `ai/changes/CR-20260623T105432Z-change/changed-files.json` for exact coverage.
## Changed Files
- `ai/changes/CR-20260623T105432Z-change/boundary-exception.md`
- `ai/changes/CR-20260623T105432Z-change/changed-files.json`
- `ai/changes/CR-20260623T105432Z-change/component-exception.md`
- `ai/changes/CR-20260623T105432Z-change/handover.md`
- `ai/changes/CR-20260623T105432Z-change/impact.json`
- `ai/changes/CR-20260623T105432Z-change/plan.md`
- `ai/changes/CR-20260623T105432Z-change/request.md`
- `ai/changes/CR-20260623T105432Z-change/runtime-validation.md`
- `ai/changes/CR-20260623T105432Z-change/verification.md`
- `ai/changes/CURRENT_CHANGE.json`
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
- `ai/registry/modules.json`
- `features/customer.md`
- `graph/api-graph.json`
- `graph/module-graph.json`
- `graph/ui-graph.json`
- `memory/API_CATALOG.md`
- `memory/CHANGELOG.md`
- `memory/HANDOVER.md`
- plus 20 additional files in the current change record.
## Commands
- `npm run scan:all`
- `npm run close:change`
- `npm run check`
## Verification
Use `npm run check` as the full governance gate. Read the current change record for the complete changed-files list and command evidence.
## Risks
- Runtime behavior still needs stack-specific tests when real code exists.
## Next Actions
- Continue the next concrete task from `memory/TASKS.json`.
