# Project State

## Current Goal

Maintain the MY door-industry ERP on the locked RuoYi + Vue3 + Codex Auto Dev OS base. Business work must go through `npm run resume`, a change record, impact analysis, generated scans, finalization, and the project check gate.

## Status

The governance layer is attached to the RuoYi Spring Boot backend and RuoYi Vue3 frontend base. Feature ownership is tracked through registry, graph, generated scans, change records, memory, and handover files.

Governance change `CR-20260624T152423Z-governance-sales-order-handoff-gate` adds the sales-order-before handoff mechanism. This is a `governance/rule-change` batch: it does not implement sales order, does not modify customer-management business code, and does not change database business table structure. Future sales-order work must pass `beforeSalesOrder` and multi-role pre-review before any sales-order code, route, API client, SQL table, or permission is created.

The same governance change closes the M1/L1 review gaps found after the initial batch: the default `check:review` package script runs context-aware with `--require-allow`, requiring `Allow Implementation` only when the current changed files touch business implementation paths, and `check:phase-gate` recognizes common sales-order implementation naming variants only under real implementation roots.

New Codex windows should start from `AGENTS.md`, `ai/context/current-context.md`, and `memory/HANDOVER.md`, then follow `ai/context/current-context.json` must-read reasons instead of bulk-reading all historical change records, reviews, feature files, or source code.

Customer management is the first active business feature. The customer model remains:

- customer nature is `REAL` or `PUBLIC`;
- public channel is `DIRECT_SALE` or `SELF_MEDIA`;
- customer-level deposit has one account type, `CUSTOMER_DEPOSIT`;
- sample rebate remains separate as `SAMPLE_REBATE`;
- customer-level fund changes continue through `customer_fund_flow`; direct balance edits remain out of scope.

Current governance change `CR-20260625T112646Z-ci-backend-frontend-governance-checks` adds CR-2 baseline CI coverage. The GitHub Actions workflow now contains real jobs for Node governance (`npm run check`), backend Maven compile (`mvn -pl ruoyi-admin -am -DskipTests compile`), and ruoyi-ui production build (`npm --prefix ruoyi-ui run build:prod`). CI coverage and provenance checkers now parse actual workflow `run:` commands and support `[ci-planned]` without treating it as passed CI evidence. The first pushed Actions run failed only in `governance` because clean Linux checkout lacked the ignored `ruoyi-ui/src/views/tool/build/*.vue` route source files already referenced by generated route artifacts; the follow-up repair tracks those pre-existing RuoYi tool sources with a narrow `.gitignore` exception. The second pushed Actions run passed the frontend route scan but failed because root `npm install` generated an untracked `package-lock.json`; CI install commands now use `--package-lock=false` while still running real npm installs because no committed lockfiles exist.

Current customer fund concurrency change `CR-20260625T042041Z-change`:

- extracts customer fund mutation from `CustomerServiceImpl` into `CustomerFundServiceImpl` behind `ICustomerFundService`;
- keeps external customer API paths and frontend API clients unchanged;
- adds `CustomerMapper.selectFundAccountForUpdate(customerId, accountType)` and mapper SQL with `limit 1 for update`;
- calculates fund balances only after the locked account read;
- handles concurrent first fund-account creation through `DuplicateKeyException` plus locked re-read;
- retries `flow_no` and `deposit_batch_no` unique collisions with bounded insert retry;
- does not add sales-order, delivery, finance, deduction, refund, adjustment, reversal, governance-rule, or SQL business table structure changes.

Previous closeout change `CR-20260625T035514Z-change` reconciled handoff, context, README, feature brief, registry ownership, memory, changelog, and task state after the pushed deposit-boundary commit; it did not modify customer runtime code, customer fund business logic, SQL, Java, XML, Vue, or API client files.

Previous customer business change `CR-20260625T022150Z-change` closes the deposit account boundary for `/business/customer/{customerId}/fund/deposit`:

- omitted `accountType` and explicit `CUSTOMER_DEPOSIT` remain valid and are stamped as `CUSTOMER_DEPOSIT`;
- `SAMPLE_REBATE` and any other non-`CUSTOMER_DEPOSIT` `accountType` are rejected before account balance, deposit batch, or fund flow mutation;
- sample rebate remains separate through `/business/customer/{customerId}/sample-rebate`, which creates `sample_rebate_record` before the internal service writes `SAMPLE_REBATE_GENERATE`;
- no sales-order code, governance-rule change, or SQL business table structure change is included.

Current change `CR-20260624T010638Z-change` tightens customer runtime validation and evidence:

- `/business/customer/{customerId}/fund/deposit` is入金-only: omitted `flowType` or `DEPOSIT_IN` writes `DEPOSIT_IN`; `DEPOSIT_DEDUCT`、`DEPOSIT_REFUND`、`DEPOSIT_ADJUST`、`DEPOSIT_REVERSE` are rejected with a clear service message.
- REAL customer master phone, contact phone, and receiver phone values are trimmed before validation/save.
- Duplicate-warning trims input and ignores obviously invalid mobile phone input for phone duplicate lookup.
- Owner-log queries order by `change_time desc, log_id desc` so same-second owner changes show the latest log first.
- PUBLIC fixed-classification rules remain: normal PUBLIC create/edit/status/delete/owner-change remains blocked, SQL ownership includes runtime validation plus development cleanup SQL, and the local development database `my_ry_vue_runtime` has been cleaned back to only the two built-in PUBLIC seed rows.
- `tests/customer-risk-gate.test.js` now guards the key customer risks through `npm test`, which is already included in `npm run check`: deposit-in-only `/fund/deposit`, customer API contract/export parity, edit-sync user-requirement docs, and fixed PUBLIC seed invariants.

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

`TASK-0002` is the active governance/platform task in `memory/TASKS.json` for `CR-20260625T112646Z-ci-backend-frontend-governance-checks`. The customer concurrency CR remains historical context; this rule-change batch must not modify customer runtime code.

## Latest Session

`memory/sessions/2026-06-25-ci-backend-frontend-governance-checks.md`

## Next Actions

- Review `CR-20260625T112646Z-ci-backend-frontend-governance-checks`, then handle commit/push and post-push GitHub Actions confirmation as a separate publish step.
- Keep sales order, delivery, finance, source/channel/account, maintenance-fee calculation, commission calculation, automatic deduction, receipt claiming, reconciliation, and order-level deposit behavior in separate future feature changes.
- Before any future runtime claim about PUBLIC data cleanliness, rerun the invariant SQL in `sql/customer.ownership.md` to confirm only `PUB_DIRECT_SALE` and `PUB_SELF_MEDIA` exist as active PUBLIC rows.

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

For `CR-20260625T112646Z-ci-backend-frontend-governance-checks`, [local] `npm run resume`, [local] `npm run start:change -- --mode rule-change "ci backend frontend governance checks"`, [local] `npm run context:build -- customer`, [local] `node --test tests/governance-gates.test.js` with 16 tests, [local] `npm test` with 137 Node tests, [local] `npm run check:ci-coverage-declaration`, [local] `npm run check:verification-provenance`, [local] `npm run check` with 137 Node tests and existing config-safety warnings only, [local] `mvn -pl ruoyi-admin -am -DskipTests compile` with `BUILD SUCCESS`, and [local] `npm --prefix ruoyi-ui run build:prod` with Vite build success passed. [ci-planned] GitHub Actions workflow includes Node governance, Maven compile, ruoyi-ui build, and lockfile-free install commands; actual CI result is determined after push. This governance change did not modify customer runtime code, sales-order implementation code, customer business rules, or business database table structure.

For `CR-20260625T042041Z-change`, `npm run resume`, `npm run context:build -- customer`, `npm run ai:do -- "功能迭代：客户管理"`, `npm run impact -- 客户管理`, `npm run review:feature -- "功能预审：客户管理资金并发安全收口" --feature customer`, `node --test tests/customer-risk-gate.test.js`, cached Maven compile, cached Maven package, runtime API/DB validation, `npm run scan:all`, `npm run finalize:change -- --summary "客户管理资金并发安全收口"`, regenerated current context, `npm run check` with 121 Node tests, standalone `npm test` with 121 Node tests, and `git diff --check` passed.

Runtime validation for `CR-20260625T042041Z-change` used backend `http://127.0.0.1:18080`, database `my_ry_vue_runtime`, Redis DB1, and test customer `26 / RT_FUND_CONCURRENCY_202606250432`. It confirmed omitted and explicit customer deposit entry, rejection of `SAMPLE_REBATE` and invalid account types through `/fund/deposit` without mutation, sample rebate record-before-flow behavior without deposit batch, PUBLIC customer deposit rejection without mutation, and 10 concurrent one-yuan deposits with no lost update, no duplicate `flow_no`, and no duplicate `deposit_batch_no`.

No sales-order implementation, delivery, finance, deduction, refund, adjustment, reversal, governance-rule change, or SQL business table structure change was made. Current Git/push state is intentionally not hand-written in project memory; use Git and CI as the source of truth.

For `CR-20260625T022150Z-change`, `npm run resume`, `npm run context:build -- customer`, `npm run ai:do -- "功能迭代：客户管理"`, `npm run review:feature -- "功能预审：客户管理定金入口资金边界收口" --feature customer`, `node --test tests/customer-risk-gate.test.js`, `node --test tests/governance-sales-order-handoff-gate.test.js`, `npm run scan:all`, `npm run finalize:change -- --summary "客户管理定金入口资金边界收口"`, `npm run check` with 120 Node tests, standalone `npm test` with 120 Node tests, and `git diff --check` passed.

The change confirmed that external `/business/customer/{customerId}/fund/deposit` now accepts omitted `accountType` or explicit `CUSTOMER_DEPOSIT`, rejects `SAMPLE_REBATE` and other non-`CUSTOMER_DEPOSIT` values before account/batch/flow mutation, and preserves internal sample rebate creation through `/business/customer/{customerId}/sample-rebate`.

No sales-order implementation, governance-rule change, or SQL business table structure change was made.

For `CR-20260624T010638Z-change`, `npm run resume`, `npm run ai:do -- "功能迭代：客户管理"`, `npm run impact -- 客户管理`, cached Maven backend compile, frontend `build:prod`, cached Maven package after stopping the MY backend jar lock, runtime API/DB validation, captcha restore check, `npm run scan:all`, `npm run finalize:change -- --summary "客户管理资金入金与公共客户口径校验收口"`, `npm run check`, standalone `npm test`, and `git diff --check` passed. After adding the risk gate, `node --test tests/customer-risk-gate.test.js`, `npm run scan:all`, `npm run finalize:change -- --summary "客户管理风险防复发门禁"`, `npm run check` with 102 Node tests, standalone `npm test` with 102 Node tests, and final `git diff --check` also passed.

Runtime API validation confirmed:

- customer deposit entry accepts omitted `flowType` and `DEPOSIT_IN`, both producing `DEPOSIT_IN`;
- customer deposit entry rejects `DEPOSIT_DEDUCT`、`DEPOSIT_REFUND`、`DEPOSIT_ADJUST`、`DEPOSIT_REVERSE` with `定金录入接口只允许入金，扣减、退款、调整、冲正请走独立资金处理流程。`;
- invalid deposit-flow attempts did not change the deposit balance;
- DB evidence for validation customer `22` showed only `CUSTOMER_DEPOSIT / DEPOSIT_IN / CUSTOMER_DEPOSIT_BATCH`;
- REAL phone values are trimmed before save; invalid master and child phones are rejected;
- duplicate-warning does not run phone duplicate lookup for obvious invalid mobile phone input;
- owner assign-maintenance and return-factory both update current owner fields, and owner-log ordering now returns the latest same-second log first;
- built-in public customer deposit entry is rejected;
- captcha was restored and `/captchaImage` returned `captchaEnabled=true`.

The local runtime database was cleaned on 2026-06-24 after older PUBLIC validation rows were found (`public_count=8`). Six non-seed PUBLIC rows were backed up and deleted, both seed rows were normalized, and post-clean SQL confirmed PUBLIC total `2`, non-seed PUBLIC count `0`, duplicate `public_channel` count `0`, both seed invariants `MATCH`, and PUBLIC child dirty counts `0`.

No governance scanner, rule, profile, sales-order, delivery, finance, channel, showroom, account, performance, or commission code was changed for this business iteration. `package.json` was not changed; the equivalent customer risk gate runs through the existing `npm test` script.
