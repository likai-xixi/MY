# Handover

## Summary

客户管理公共客户与统一定金模型

## Impact

This change stays inside the existing customer-management module. It adds final customer nature fields, defines public-customer behavior, and unifies customer-level deposits to `CUSTOMER_DEPOSIT`.

Public customers are classification records only. They do not auto-create contacts or shipping addresses, do not bind fixed owner salesmen, do not expose customer-level deposit entry, and do not use customer-level sample policy or sample rebate. Real customers keep contacts, shipping addresses, owner salesmen, unified customer deposit, sample policy, and sample rebate.

No sales-order, shipment, finance, automatic deduction, receipt claiming, customer reconciliation, order-level deposit, buyer snapshot, workstation, mini-program, DXF, old-data migration, or legacy deposit compatibility code was added.

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
- `memory/sessions/2026-06-23-customer-public-unified-deposit.md`
- `ai/changes/CR-20260623T105432Z-change/*`

`npm run scan:all` passed; graph and generated scan files were refreshed by the scanner but route/API/UI topology did not require a content diff.

## Verification

- `npm run resume` passed.
- `npm run ai:do -- "功能迭代：客户管理"` passed.
- `npm run impact -- 客户管理` passed with no blockers.
- Local cached Maven compile passed: `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests compile`.
- `npm --prefix ruoyi-ui run build:prod` passed.
- `npm run scan:all` passed.
- `npm run finalize:change -- --summary "客户管理公共客户与统一定金模型"` passed.
- Static source checks passed for removal of legacy deposit enums/labels/buttons/source-order deposit fields from the current customer code, contracts, SQL, feature docs, and current memory handoff/session scope.
- `npm run check` passed, including `check:change` and 97 Node tests.
- Standalone `npm test` passed with 97 Node tests.
- Runtime validation passed after rebuilding customer-owned development tables from final `sql/customer.ownership.md` DDL.
- Runtime evidence is recorded in `runtime-validation.md`.

## Runtime Validation

- Seeded public customers `PUB_DIRECT_SALE` and `PUB_SELF_MEDIA` were initialized and verified.
- Runtime REAL customer `KH202606000001` created default contact/address records, edited successfully, displayed detail contact/address data, and accepted unified deposit entry.
- Runtime PUBLIC customer `KH202606000002` saved and edited without contact/address data, returned no fund accounts, hid contact/address tabs and fund-policy actions, and displayed the required order-classification notice.
- Public customer deposit/sample-policy/sample-rebate APIs were rejected with explicit service messages.
- DB evidence confirmed `CUSTOMER_DEPOSIT`, `SAMPLE_REBATE`, `DEPOSIT_IN`, and `CUSTOMER_DEPOSIT_BATCH`; invalid legacy enum counts were all `0`.
- Browser evidence on `/business/customer` confirmed customer nature and public channel filters, public customer tags/channel values, REAL funds as `定金` + `样品返现`, and no `长期定金` / `滚动定金` / `来源订单号` text.

## Runtime Fix

PUBLIC detail initially lacked the required base-tab order-classification notice. `ruoyi-ui/src/views/customer/index.vue` now shows the same warning alert used by the add/edit form in PUBLIC detail. No backend model, SQL model, API path, or non-customer module was changed.

## Risks

- No unresolved runtime acceptance risk remains for the customer public-customer/unified-deposit scope.
- Existing old customer/fund rows remain intentionally unsupported because this is a clean development-stage refactor.

## Next Actions

- Commit and push when the user approves. Keep sales-order, delivery, finance, automatic deduction, receipt claiming, order-level deposit, and buyer-snapshot work out of customer management.
