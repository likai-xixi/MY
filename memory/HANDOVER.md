# Handover

## Summary

R-05 salesman candidate hardening is the current change.

Current change record: `ai/changes/CR-20260626T011624Z-salesman-candidate-hardening`.

The prerequisite governance fix `CR-20260626T013800Z-high-risk-active-impact-scope` has been committed. It makes the high-risk customer runtime diff guard respect active change-record `allowedEditRoots` and `forbiddenEditRoots`, so approved customer runtime diffs can pass while explicitly forbidden roots remain blocked.

## Impact

Customer salesman candidates are now strict: `CustomerServiceImpl.selectSalesmanCandidates` returns only normal users with sales/business roles and returns an empty list when no role-matched users exist. The customer Vue page shows `未找到销售/业务员角色用户，请先配置销售角色。` when entering SALESMAN owner selection or submitting without configured candidates, while avoiding warnings on every remote search input.

Contracts and feature docs state that `/business/customer/salesmen` does not fall back to all users. The customer risk gate asserts the backend no-fallback code shape, the `return salesmen` behavior, the doc contract, and the frontend prompt.

No customer fund logic, sales-order runtime, security config, migration/idempotency registry, package/tool code, SQL ownership, mapper XML, controller, API client, or database business table structure was changed. `beforeSalesOrder` remains blocked.

Permission surface has no semantic changes: no auth, menu, or permission contract changed in this R-05 fix.

## Changed Files

- `ai/changes/CR-20260626T011624Z-salesman-candidate-hardening/*`
- `ai/changes/CURRENT_CHANGE.json`
- `ai/context/current-context.md`
- `ai/context/current-context.json`
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

- [local] `npm run resume` confirmed current change `CR-20260626T011624Z-salesman-candidate-hardening`.
- [local] `npm run impact -- 客户管理` passed with no blockers.
- [local] `npm run scan:all` passed and produced no extra generated file changes.
- [local] `node --test tests/customer-risk-gate.test.js` passed with 11/11 tests.
- [local] `node --test tests/high-risk-governance.test.js` passed with 37/37 tests.
- [local] `npm test` passed with 189/189 tests.
- [local] `npm run check` passed after verification evidence was updated.
- [local] `git diff --check` passed.
- [not-run] Plain `mvn` is unavailable on PATH.
- [local] Configured Maven path compile passed with reactor `BUILD SUCCESS`.

## Risks

- Browser/runtime API acceptance was not run for this small candidate-list fix.
- R-05 stash still exists and should not be deleted until after R-05 is committed and the user approves cleanup.

## Next Actions

- Prepare the R-05 commit after final verification review.
- Do not start R-06 migration baseline or R-07 customer fund idempotency from this R-05 verification step.
