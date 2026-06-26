# Verification

Status: [local] verified

## Commands

- [local] `npm run resume`
- [local] `git status --short`
- [local] `git diff -- ai/registry/features.json`
- [local] `git diff -- memory/API_CATALOG.md`
- [local] `git diff -- ruoyi-ui/src/views/customer/index.vue`
- [local] `Select-String -Path ruoyi-ui/src/views/customer/index.vue,ruoyi-ui/src/api/customer.js -Pattern "idempotentKey"`
- [local] `npm run impact -- 客户管理`
- [local] `npm run scan:all`
- [local] `npm run context:build -- customer`
- [local] `node --test tests/customer-risk-gate.test.js`
- [local] `npm --prefix ruoyi-ui run build:prod`
- [local] `npm run check:high-risk-governance`
- [local] `node --test tests/high-risk-governance.test.js`
- [local] `npm test`
- [not-run] `mvn -pl ruoyi-admin -am -DskipTests compile`
- [local] `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests compile`
- [local] `npm run check`
- [local] `git diff --check`

## Evidence

- [local] `npm run resume` passed.
- [local] Final scope audit found two changed files that were previously not in the final allow-list: `ai/registry/features.json` and `memory/API_CATALOG.md`.
- [local] `ai/registry/features.json` diff only updates the customer feature registry with R-07 idempotent ownership: `idempotent_request` and `sql/migrations/V20260625_004_idempotent_request.sql`.
- [local] `memory/API_CATALOG.md` diff only updates customer fund API semantics for `POST /business/customer/{customerId}/fund/deposit` and `POST /business/customer/{customerId}/sample-rebate`: both require `idempotentKey`, same-key/same-hash success replays the existing result, same-key/same-hash processing is rejected as still processing, and same-key/different-hash is rejected.
- [local] `ai/changes/CR-20260626T124443Z-customer-fund-idempotency/changed-files.json` already includes `ai/registry/features.json` and `memory/API_CATALOG.md`.
- [local] Scope audit conclusion: both files belong only to R-07 idempotency ownership/API catalog sync.
- [local] Scope audit found no sales-order/salesorder runtime, security config, production config, old three-account fund model, deduction/refund/adjustment/reversal runtime, non-`idempotent_request` new table, package.json, or tools changes.
- [local] Frontend precheck confirmed `ruoyi-ui/src/views/customer/index.vue` had no `idempotentKey` diff and `ruoyi-ui/src/api/customer.js` had no `idempotentKey` before the R-07 frontend closeout.
- [local] Customer page now creates a hidden stable `idempotentKey` when the deposit or sample-rebate dialog opens, reuses it on submit, and leaves `ruoyi-ui/src/api/customer.js` unchanged.
- [local] `npm run impact -- 客户管理` passed with no blockers.
- [local] `npm run scan:all` passed.
- [local] `npm run context:build -- customer` passed.
- [local] Permission scan completed with no contract changes; no menu, auth, or permission ownership changes were introduced by R-07.
- [local] `node --test tests/customer-risk-gate.test.js` passed with 15/15 tests.
- [local] `npm --prefix ruoyi-ui run build:prod` passed with Vite production build success.
- [local] `npm run check:high-risk-governance` passed.
- [local] `node --test tests/high-risk-governance.test.js` passed with 40/40 tests.
- [local] `npm test` passed with 196/196 tests.
- [not-run] Plain `mvn -pl ruoyi-admin -am -DskipTests compile` is unavailable on PATH.
- [local] Configured Maven path `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests compile` passed with `BUILD SUCCESS`.
- [not-run] `idempotent_request` migration was statically checked by governance tests; runtime MySQL execution was not performed in this environment.
- [not-run] Browser/manual click and real HTTP replay tests were not run in this environment. The R-07 idempotency behavior was covered by structural governance tests, frontend build, and backend compile evidence, but real browser submission, duplicate-click replay, HTTP retry replay, and runtime MySQL execution remain future integration/manual verification items.
- [local] `npm run check` passed with 196/196 Node tests.
- [local] `git diff --check` passed.
