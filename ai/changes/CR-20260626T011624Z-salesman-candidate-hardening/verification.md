# Verification

Status: [local] passed

## Commands

- [local] `npm run resume`
- [local] `npm run impact -- 客户管理`
- [local] `npm run scan:all`
- [local] `node --test tests/customer-risk-gate.test.js`
- [local] `node --test tests/high-risk-governance.test.js`
- [local] `npm test`
- [local] `npm run check`
- [local] `git diff --check`
- [not-run] `mvn -pl ruoyi-admin -am -DskipTests compile` because plain `mvn` is unavailable on PATH.
- [local] `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests compile`

## Evidence

- [local] `npm run resume` passed and confirmed current change `CR-20260626T011624Z-salesman-candidate-hardening`.
- [local] `npm run impact -- 客户管理` passed with no blockers and identified the customer runtime/API/UI surface; edits stayed inside the user-approved R-05 subset.
- [local] `npm run scan:all` passed; no extra generated file changes appeared after the scan.
- [local] `node --test tests/customer-risk-gate.test.js` passed with 11/11 tests, including the salesman-candidate no-fallback assertions.
- [local] `node --test tests/high-risk-governance.test.js` passed with 37/37 tests after committed governance CR `CR-20260626T013800Z-high-risk-active-impact-scope` made the repo-level customer runtime guard respect active impact scope.
- [local] `npm test` passed with 189/189 tests.
- [local] `npm run check` passed after the R-05 verification evidence was updated.
- [local] `git diff --check` passed.
- [not-run] Plain `mvn -pl ruoyi-admin -am -DskipTests compile` is unavailable on PATH; configured Maven path compile passed.
- [local] `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests compile` passed with Maven reactor `BUILD SUCCESS`.
- [local] Permission surface has no semantic changes: no auth, menu, or permission contract changed in this R-05 fix.

## Scope Confirmation

- [local] This R-05 change did not edit customer fund logic.
- [local] This R-05 change did not add or edit sales-order / salesorder runtime, SQL, Vue, API, permission, or route files.
- [local] This R-05 change did not edit security config.
- [local] This R-05 change did not edit migration or idempotency registries.
- [local] This R-05 change did not edit database business table structure.
- [local] This R-05 change did not edit `package.json` or `tools/**`.
