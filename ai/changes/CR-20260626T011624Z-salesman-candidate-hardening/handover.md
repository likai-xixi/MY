# Handover

## Summary

R-05 hardens customer salesman candidates. Backend candidate selection now returns only normal users with sales/business roles, and the customer UI warns clearly when no sales-role users are configured.

The prerequisite governance fix `CR-20260626T013800Z-high-risk-active-impact-scope` has been committed, so approved customer runtime diffs now pass the high-risk repo guard through active impact scope.

## Impact

The `/business/customer/salesmen` API path and payload shape are unchanged. `CustomerServiceImpl.selectSalesmanCandidates` no longer falls back to all normal users when role filtering returns empty. `ruoyi-ui/src/views/customer/index.vue` prompts `未找到销售/业务员角色用户，请先配置销售角色。` only at deliberate SALESMAN entry points or submit-time checks, not on every remote search keystroke.

Customer feature/API/UI contracts and the customer risk gate document and enforce the no-fallback rule.

No customer fund logic, sales-order code, security config, migration/idempotency registry, package/tool code, SQL ownership, mapper XML, controller, API client, or database business table structure was changed. `beforeSalesOrder` remains blocked.

Permission surface has no semantic changes: no auth, menu, or permission contract changed in this R-05 fix.

## Changed Files

- `ai/changes/CR-20260626T011624Z-salesman-candidate-hardening/boundary-exception.md`
- `ai/changes/CR-20260626T011624Z-salesman-candidate-hardening/changed-files.json`
- `ai/changes/CR-20260626T011624Z-salesman-candidate-hardening/component-exception.md`
- `ai/changes/CR-20260626T011624Z-salesman-candidate-hardening/handover.md`
- `ai/changes/CR-20260626T011624Z-salesman-candidate-hardening/impact.json`
- `ai/changes/CR-20260626T011624Z-salesman-candidate-hardening/plan.md`
- `ai/changes/CR-20260626T011624Z-salesman-candidate-hardening/request.md`
- `ai/changes/CR-20260626T011624Z-salesman-candidate-hardening/verification.md`
- `ai/changes/CURRENT_CHANGE.json`
- `ai/context/current-context.json`
- `ai/context/current-context.md`
- `ai/contracts/customer.api.md`
- `ai/contracts/customer.ui.md`
- `features/customer.md`
- `memory/CHANGELOG.md`
- `memory/HANDOVER.md`
- `memory/PROJECT_STATE.md`
- `memory/TASKS.json`
- `ruoyi-business/src/main/java/com/ruoyi/business/customer/service/impl/CustomerServiceImpl.java`
- `ruoyi-ui/src/views/customer/index.vue`
- `tests/customer-risk-gate.test.js`

## Commands

- [local] `npm run resume`
- [local] `npm run impact -- 客户管理`
- [local] `npm run scan:all`
- [local] `node --test tests/customer-risk-gate.test.js`
- [local] `node --test tests/high-risk-governance.test.js`
- [local] `npm test`
- [local] `npm run check`
- [local] `git diff --check`
- [not-run] `mvn -pl ruoyi-admin -am -DskipTests compile`
- [local] `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests compile`

## Verification

- [local] Focused customer risk gate passed with 11/11 tests.
- [local] Focused high-risk governance test passed with 37/37 tests and now respects active impact scope.
- [local] Full `npm test` passed with 189/189 tests.
- [local] Full `npm run check` passed after verification evidence was updated.
- [local] `git diff --check` passed.
- [not-run] Plain `mvn` is unavailable on PATH.
- [local] Configured Maven path compile passed with reactor `BUILD SUCCESS`.

## Risks

- Browser/runtime API acceptance was not run for this small candidate-list fix.
- Sales-order remains blocked by `beforeSalesOrder`; this CR does not open R-06/R-07.

## Next Actions

- Prepare the R-05 commit after final green verification review.
- Keep the R-05 stash until after R-05 is committed and the user approves deleting it.
