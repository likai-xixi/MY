# Project State

## Current Goal

Maintain the MY door-industry ERP on the locked RuoYi + Vue3 + Codex Auto Dev OS base. Business work must go through `npm run resume`, a change record, impact analysis, generated scans, finalization, and the project check gate.

## Status

The governance layer is attached to the RuoYi Spring Boot backend and RuoYi Vue3 frontend base. Feature ownership is tracked through registry, graph, generated scans, change records, memory, and handover files.

Customer management is the first active business feature. Current change `CR-20260623T105432Z-change` refactors customer master data to the final development-stage model:

- customer nature is `REAL` or `PUBLIC`;
- public channel is `DIRECT_SALE` or `SELF_MEDIA`;
- built-in public customers are `PUB_DIRECT_SALE` and `PUB_SELF_MEDIA`;
- public customers are order-classification customers only and do not require contacts, shipping addresses, fixed owner salesmen, customer-level deposits, sample policies, or sample rebates;
- real customers still maintain contacts, shipping addresses, owner salesmen, unified customer deposit, sample policy, and sample rebate;
- deposit has one customer-level account type: `CUSTOMER_DEPOSIT`;
- sample rebate remains separate as `SAMPLE_REBATE`;
- customer-level fund changes continue through `customer_fund_flow`; direct balance edits remain out of scope.

Runtime acceptance for `CR-20260623T105432Z-change` has been completed after rebuilding customer-owned development tables from the final `sql/customer.ownership.md` DDL. Evidence is recorded in `ai/changes/CR-20260623T105432Z-change/runtime-validation.md`. The validation covered seeded public customers, REAL/PUBLIC add/edit/detail, REAL unified deposit entry, public-customer customer-level deposit/sample-policy/sample-rebate rejection, and browser checks for customer nature/public channel filters plus removal of legacy long-term/rolling deposit text.

Sales order, shipment, finance settlement, automatic deduction, receipt claiming, customer reconciliation, order-level buyer snapshots, and order-level deposits remain separate future modules.

## Active Features

- `customer` - Customer management under the locked RuoYi adapter.

## Active Task

`TASK-CUSTOMER` is the active customer task in `memory/TASKS.json`. The current iteration is `CR-20260623T105432Z-change`: customer public-customer model and unified deposit model.

## Latest Session

`memory/sessions/2026-06-23-customer-public-unified-deposit.md`

## Next Actions

- `CR-20260623T105432Z-change` runtime validation and closeout gates have passed; the current working tree is ready for user-approved commit and push.
- Keep sales order buyer/contact/address/salesman/source-channel snapshots in the future `sales-order` module; do not add them to customer management in this change.

## Deferred Scope

- Sales order module.
- Shipment module.
- Finance module.
- Automatic deposit deduction.
- Receipt claiming.
- Customer reconciliation.
- Order-level deposit table.
- Real buyer order fields.
- Individual direct-sale/self-media buyer customer archives.
- Complex collection rules.
- Credit rules.
- Production-after-full-payment rules.
- Customer public pool.
- Salesman commission.
- Old data migration or old fund-account compatibility.

## Last Verification

Before this change, customer runtime validation had covered the customer route `/business/customer`, CRUD/status/detail/export, contacts, addresses, owner transfer logs, default contact/address sync, sample policy, sample rebate, and customer funds. Current change `CR-20260623T105432Z-change` passed backend compile with cached Maven, frontend `build:prod`, `npm run scan:all`, `npm run finalize:change -- --summary "客户管理公共客户与统一定金模型"`, `npm run check`, and standalone `npm test`. Browser runtime validation remains after development database reinitialization to the final DDL.
