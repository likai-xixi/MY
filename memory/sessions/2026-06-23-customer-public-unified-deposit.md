# Session: Customer Public Customers And Unified Deposit

## Task

`TASK-0003 / TASK-CUSTOMER` - Implement customer public-customer model and unified customer deposit model in `CR-20260623T105432Z-change`.

## Status

`runtime-verified` for source, backend compile, frontend production build, scan, API/DB/browser runtime validation, and change-record evidence. Development customer tables were rebuilt from the final DDL and runtime validation passed for REAL/PUBLIC customer behavior and the unified deposit model.

## Goal

Refactor customer management to the final development-stage business model: customer nature is `REAL` or `PUBLIC`, public channels are `DIRECT_SALE` and `SELF_MEDIA`, customer-level deposit is one `CUSTOMER_DEPOSIT` account, and sample rebate remains independent as `SAMPLE_REBATE`.

## Changed Files

- `ruoyi-business/src/main/java/com/ruoyi/business/customer/domain/Customer.java`
- `ruoyi-business/src/main/java/com/ruoyi/business/customer/domain/CustomerDepositBatch.java`
- `ruoyi-business/src/main/java/com/ruoyi/business/customer/domain/CustomerFundEntry.java`
- `ruoyi-business/src/main/java/com/ruoyi/business/customer/service/impl/CustomerServiceImpl.java`
- `ruoyi-business/src/main/resources/mapper/customer/CustomerMapper.xml`
- `ruoyi-ui/src/views/customer/index.vue`
- `ruoyi-ui/src/api/customer.contract.md`
- `sql/customer.ownership.md`
- `features/customer.md`
- `ai/contracts/customer.api.md`
- `ai/contracts/customer.db.md`
- `ai/contracts/customer.ui.md`
- `ai/contracts/customer.permission.md`
- `ai/contracts/customer.delete-ownership.md`
- `ai/registry/features.json`
- `ai/registry/modules.json`
- `memory/API_CATALOG.md`
- `memory/PROJECT_STATE.md`
- `memory/TASKS.json`
- `memory/HANDOVER.md`
- `memory/CHANGELOG.md`
- `ai/changes/CR-20260623T105432Z-change/`

## Commands

- `npm run resume`
- `npm run ai:do -- "功能迭代：客户管理"`
- `npm run impact -- 客户管理`
- `mvn -pl ruoyi-admin -am -DskipTests compile` failed because `mvn` was not on `PATH`
- `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests compile`
- `npm --prefix ruoyi-ui run build:prod`
- `npm run scan:all`
- `npm run finalize:change -- --summary "客户管理公共客户与统一定金模型"`
- `npm run check`
- `npm test`
- Rebuilt customer-owned development tables from `sql/customer.ownership.md` in `my_ry_vue_runtime`
- Browser/API/DB runtime validation for `/business/customer`
- `rg` legacy deposit/source-order text scan over customer backend/frontend/SQL/contracts/feature scope
- `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests compile`
- `npm --prefix ruoyi-ui run build:prod`
- `npm run scan:all`

## Verification

- Backend compile passed with local cached Maven.
- Frontend production build passed.
- `npm run scan:all` passed.
- `npm run check` passed, including change closeout and 97 Node tests.
- Standalone `npm test` passed with 97 Node tests.
- Development DB was rebuilt to the final customer structure with seeded public customers `PUB_DIRECT_SALE` and `PUB_SELF_MEDIA`.
- REAL runtime customer `KH202606000001` created default contact/address records, edited successfully, displayed contact/address detail, and accepted one unified `CUSTOMER_DEPOSIT` deposit.
- PUBLIC runtime customer `KH202606000002` saved and edited without contact/address data, returned no fund accounts, hid contact/address tabs and fund-policy actions, and displayed the order-classification notice in detail.
- Public customer deposit/sample-policy/sample-rebate APIs rejected customer-level operations with explicit messages.
- DB checks confirmed only `CUSTOMER_DEPOSIT` and `SAMPLE_REBATE` account types, only `CUSTOMER_DEPOSIT` deposit batch type, and `DEPOSIT_IN` flow for runtime deposit entry.
- Browser `/business/customer` confirmed customer nature and public channel filters, public customer tags/channel values, REAL funds as `定金` + `样品返现`, and no `长期定金` / `滚动定金` / `来源订单号` text.
- Static source checks found no remaining legacy deposit enum, legacy deposit label, legacy deposit button, source-order deposit field, or source-order property terms in the current customer code, contracts, SQL, feature docs, and current handoff/session scope.
- `CustomerServiceImpl` skips public-customer default child generation and rejects public-customer customer-level deposit, sample-policy, and sample-rebate operations.
- `ruoyi-ui/src/views/customer/index.vue` hides public-customer contacts, addresses, sync options, and customer-level deposit entry; the fund view uses only deposit and sample rebate labels.
- Runtime fix: PUBLIC detail base tab now shows `公共客户仅用于订单归类，实际购买人、联系电话、收货地址、接待业务员请在销售订单中填写。`
- Runtime closeout gates passed: `npm run finalize:change -- --summary "客户管理公共客户与统一定金模型运行验收"`, `npm run check`, standalone `npm test`, and `git diff --check`.

## Business Decisions

- Built-in public customers are `PUB_DIRECT_SALE` and `PUB_SELF_MEDIA`.
- Public customers are classification records only, not real buyers.
- Real buyer, phone, shipping address, receiving salesman, and source channel are reserved for the future sales-order module.
- This change intentionally includes no old-data migration and no legacy deposit compatibility path.

## Risks

- Existing old customer/fund rows are intentionally unsupported by this clean refactor.
- No unresolved runtime acceptance risk remains for the customer public-customer/unified-deposit scope.

## Next Entry Point

Run `npm run resume`, then use `ai/changes/CR-20260623T105432Z-change/runtime-validation.md` for runtime evidence. The change is ready for user-approved commit and push; do not add sales-order, delivery, finance, automatic deduction, receipt claiming, order-level deposit, or buyer-snapshot scope to customer management.
