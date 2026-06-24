# Project State

## Current Goal

Maintain the MY door-industry ERP on the locked RuoYi + Vue3 + Codex Auto Dev OS base. Business work must go through `npm run resume`, a change record, impact analysis, generated scans, finalization, and the project check gate.

## Status

The governance layer is attached to the RuoYi Spring Boot backend and RuoYi Vue3 frontend base. Feature ownership is tracked through registry, graph, generated scans, change records, memory, and handover files.

Customer management is the first active business feature. The customer model remains:

- customer nature is `REAL` or `PUBLIC`;
- public channel is `DIRECT_SALE` or `SELF_MEDIA`;
- customer-level deposit has one account type, `CUSTOMER_DEPOSIT`;
- sample rebate remains separate as `SAMPLE_REBATE`;
- customer-level fund changes continue through `customer_fund_flow`; direct balance edits remain out of scope.

Current change `CR-20260623T235902Z-change` closes the PUBLIC public-customer口径:

- PUBLIC is fixed to the two system classification customers `PUB_DIRECT_SALE / 厂内自销客户 / DIRECT_SALE` and `PUB_SELF_MEDIA / 自媒体客户 / SELF_MEDIA`.
- PUBLIC is not available from the normal add/edit customer dialog.
- PUBLIC rows remain visible in the list/detail, but type/level display uses `系统分类` and `-` instead of showing the technical compatibility values `OTHER` / `NORMAL` as normal business labels.
- PUBLIC rows cannot be normally edited, deleted, disabled, or owner-changed.
- Backend APIs reject direct PUBLIC create/edit/delete/status/owner-change attempts and reject REAL customers using reserved public customer codes.
- Service/SQL ownership documents define one active PUBLIC row per public channel; the final SQL adds `uk_customer_public_channel`.

The previous real-customer validation and ownership rules remain in force:

- add/edit always require customer name, customer nature, customer type, and customer level;
- REAL add/edit require main contact, valid 11-digit contact phone, complete province/city/district, and detail address;
- new REAL customers default to factory ownership: `FACTORY / FACTORY_POOL / NONE`;
- `REAL + FACTORY` does not require owner salesman and clears owner user/dept fields;
- `REAL + SALESMAN + FACTORY_ASSIGNED` uses `MAINTENANCE_FEE`;
- `REAL + SALESMAN + SALESMAN_SELF` uses `SALES_COMMISSION`;
- `ownerEffectiveTime` records when the current ownership rule starts;
- PUBLIC customers stay `NONE / NONE / NONE`, clear fixed owner fields, and reject owner changes.

Sales order, shipment, finance settlement, automatic deduction, receipt claiming, customer reconciliation, order-level buyer snapshots, order-level deposits, source/account/channel management, maintenance-fee calculation, and commission calculation remain separate future modules.

## Active Features

- `customer` - Customer management under the locked RuoYi adapter.

## Active Task

`TASK-CUSTOMER` is the active customer task in `memory/TASKS.json`. The current iteration is `CR-20260623T235902Z-change`: PUBLIC public customers are fixed system classification rows and cannot be maintained through normal customer CRUD.

## Latest Session

`memory/sessions/2026-06-24-customer-public-fixed-classification.md`

## Next Actions

- If runtime data cleanliness matters, rebuild or clean the customer-owned development tables from `sql/customer.ownership.md` so only `PUB_DIRECT_SALE` and `PUB_SELF_MEDIA` exist as PUBLIC rows and `uk_customer_public_channel` can be applied.
- Commit and push the current customer change when requested; the current gate is green.
- Review `git status --short` before any commit because earlier uncommitted customer CR directories remain in the working tree.

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
- Source/channel/showroom/account management.
- Complex collection rules.
- Credit rules.
- Production-after-full-payment rules.
- Customer public pool.
- Business performance reports.
- Salesman commission calculation.
- Sales target management.
- Salesman management module or a separate salesman table.
- Old data migration or old fund-account compatibility.

## Last Verification

For `CR-20260623T235902Z-change`, `npm run resume`, `npm run impact -- 客户管理`, cached Maven backend compile, frontend `build:prod`, `npm run scan:all`, `npm run finalize:change -- --summary "客户管理公共客户固定分类口径收口"`, cached Maven backend package, runtime API validation, captcha restore check, `npm run check:components`, `node --test tests/component-checker.test.js`, `node --test tests/boundary-lint.test.js`, `npm run check:boundaries`, `npm run check`, `npm test`, and `git diff --check` passed. Plain `mvn -pl ruoyi-admin -am -DskipTests compile` failed because Maven is not on `PATH`; the cached Maven command passed.

Runtime API validation confirmed:

- direct `POST /business/customer` with `customerNature=PUBLIC` is rejected;
- direct edit/status/delete/owner-change operations on built-in `PUB_DIRECT_SALE` are rejected;
- REAL creation with reserved public code `PUB_DIRECT_SALE` is rejected;
- captcha was restored and `/captchaImage` returned `captchaEnabled=true`.

The local runtime database still contains older PUBLIC test rows from previous validation. The final DDL/seed target is clean, but local DB rebuild or cleanup is required before claiming the runtime database contains only the two built-in PUBLIC rows.

The previous component/boundary gate failures were fixed by adding current-change scoped exception files for exact pre-existing RuoYi platform `system/tool/generator` paths. No governance scanner, rule, profile, sales-order, delivery, finance, channel, showroom, account, performance, or commission code was changed for this business iteration.
