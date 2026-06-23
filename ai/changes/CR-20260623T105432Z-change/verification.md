# Verification

Status: runtime-verified

## Commands And Outcomes

- `npm run resume` passed and restored the MY project workflow context.
- `npm run ai:do -- "功能迭代：客户管理"` passed and opened `CR-20260623T105432Z-change`.
- `npm run impact -- 客户管理` passed with no blockers and allowed customer backend/frontend, SQL, contracts, registry, graph, generated scan, memory, feature, and test roots.
- `mvn -pl ruoyi-admin -am -DskipTests compile` was attempted first, but `mvn` was not on `PATH`.
- `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests compile` passed with Maven `BUILD SUCCESS`.
- `npm --prefix ruoyi-ui run build:prod` passed with Vite production build success.
- `npm run scan:all` passed: backend routes, frontend routes, API clients, DB schema scan, permissions, components, and ownership sync all completed with `ok`.
- Customer-owned development tables were rebuilt from final `sql/customer.ownership.md` DDL in `my_ry_vue_runtime`; no old deposit compatibility migration was used.
- Runtime stack was validated with Docker MySQL `mj-mysql`, Docker Redis `mj-redis`, backend `http://localhost:18080`, and frontend `http://127.0.0.1:5174`.
- Browser/API/DB validation passed for REAL add/edit/detail, PUBLIC add/edit/detail, unified REAL deposit entry, public-customer customer-level deposit rejection, public-customer sample-policy rejection, and public-customer sample-rebate rejection.
- A customer-scope runtime fix was applied: PUBLIC customer detail base tab now shows the required order-classification notice.
- After the runtime fix, cached Maven backend compile, frontend `build:prod`, and `npm run scan:all` passed again.
- `npm run finalize:change -- --summary "客户管理公共客户与统一定金模型"` passed.
- `npm run check` passed, including handoff integrity, change closeout, rule lock, diff, duplicate scan, runtime checker, and 97 Node tests.
- Standalone `npm test` passed with 97 Node tests.
- `npm run finalize:change -- --summary "客户管理公共客户与统一定金模型运行验收"` passed after runtime evidence updates.
- `npm run check` passed after runtime evidence updates, including 97 Node tests.
- Standalone `npm test` passed after runtime evidence updates with 97 Node tests.
- `git diff --check` passed.

## Evidence

- Current customer backend/frontend/contracts/SQL/feature/memory scope has no remaining legacy deposit enum, legacy deposit label, legacy deposit button, source-order deposit field, or source-order property terms.
- `Customer.java` includes `customerNature` and `publicChannel`.
- `CustomerMapper.xml` reads, writes, updates, and filters `customer_nature` and `public_channel`.
- `CustomerServiceImpl` normalizes `REAL`/`PUBLIC`, skips contact/address default generation for public customers, returns no customer-level deposit account for public customers, rejects public-customer customer-level deposit/sample-policy/sample-rebate calls, and initializes only `CUSTOMER_DEPOSIT` plus `SAMPLE_REBATE` for real customers.
- `CustomerFundEntry` and `CustomerDepositBatch` use `receiptNo`; source-order deposit fields are removed.
- `ruoyi-ui/src/views/customer/index.vue` exposes customer nature and public channel filters, marks public customers with a tag, hides contact/address tabs and sync options for public customers, hides customer-level deposit entry for public customers, and shows only `定金` and `样品返现` in funds/policy areas.
- The deposit-entry dialog no longer has an account-type selector or source-order field; it submits amount, optional receipt number, and remark through the unchanged deposit API path.
- `sql/customer.ownership.md` is final-structure DDL with `customer_nature`, `public_channel`, unified `CUSTOMER_DEPOSIT`, separate `SAMPLE_REBATE`, and public seed rows `PUB_DIRECT_SALE` and `PUB_SELF_MEDIA`.
- Runtime evidence is recorded in `ai/changes/CR-20260623T105432Z-change/runtime-validation.md`.

## Runtime Evidence Summary

- Development DB was rebuilt from the final DDL; seeded public customers were initialized and verified.
- REAL runtime customer `KH202606000001` created one default contact and one default shipping address, edited successfully, and accepted unified customer-level deposit entry.
- PUBLIC runtime customer `KH202606000002` saved without contact/address data, kept no contact/address children after edit, returned no fund accounts, and rejected customer-level deposit/sample policy/sample rebate APIs with explicit messages.
- Browser `/business/customer` showed customer nature and public channel filters, public customer tags/channel values, REAL funds as `定金` + `样品返现`, and PUBLIC restrictions.
- Frontend/customer source scan found no remaining `长期定金`, `滚动定金`, `录入长期定金`, `录入滚动定金`, `来源订单号`, `LONG_TERM_DEPOSIT`, or `ROLLING_ORDER_DEPOSIT` terms in the customer scope.
