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

CR-2 baseline CI coverage is already published on `master` at `84886464f7dda693fe16af15f1491e03903c150c`. GitHub Actions passed the real `governance`, `backend-compile`, and `frontend-build` jobs after the Maven fallback repair.

Governance change `CR-20260625T130657Z-high-risk-semantic-governance-framework` is CR-3. It adds high-risk semantic governance registries, JSON schemas, a real checker, package script wiring, and temp-root tests. This is a governance/rule-change batch only: it does not modify customer runtime code, does not create sales-order runtime code, does not change business database table structure, and does not open `beforeSalesOrder`. Its commit is recorded on `master` as `a49b678644dddc16ce45f094bff5459fd9a716e2` with message `governance: add high-risk semantic framework`.

CR-3 blocking is intentionally narrow. Schema/registry format errors, malformed machine evidence manifests, missing covered evidence files, incomplete required entries, executable migration violations, generic edit permissions on required high-risk APIs, and invalid state-machine transitions fail. Missing evidence manifests do not fail. Stale evidence hashes warn unless explicitly declared blocking. The historical customer markdown baseline warning was resolved by R-06 executable customer migration baseline.

Previous governance change `CR-20260625T143256Z-pre-release-breaking-change-policy` adds the pre-release breaking-change policy. Because the project is not released yet, Codex should replace old code/data contracts by default during feature iteration instead of adding compatibility layers. Development data may be reset or rebuilt when recorded in the active change; compatibility layers require explicit user approval, and production or already-released data still needs migration and rollback evidence.

Previous governance change `CR-20260625T155756Z-post-push-handover-consistency-fix` is R-01. It fixed only CR-3 post-push handover consistency by replacing stale no-commit/no-push wording with the recorded CR-3 commit and conservative CI wording. CI result was not confirmed in that evidence pass.

Completed governance change `CR-20260625T162821Z-production-safety-baseline` is R-02. It removes `/druid/**` from explicit Spring Security anonymous access, adds `application-prod.yml` with environment-variable production configuration, disables production Druid console and Swagger UI by default, adds blocking `check:prod-safety`, adds explicit `verify:release`, and documents that default/dev configuration is not production release configuration. It does not modify customer runtime code, sales-order runtime code, customer fund model code, migration/idempotency registry, or business database table structure.

Current governance/context cleanup `CR-20260625T170213Z-customer-fund-vocabulary-source-cleanup` is R-03. It cleans current customer fund vocabulary sources so the active context is two-account only: `CUSTOMER_DEPOSIT` for 客户级定金 and `SAMPLE_REBATE` for 样品返现. It does not modify customer runtime code, sales-order runtime code, production safety config, Java/Vue customer fund runtime, migration/idempotency registry, or business database table structure.

Completed governance/runtime clarification `CR-20260626T004832Z-governance-runtime-verification-boundary` is R-04. It documents the boundary between local governance checks, runtime checker detection, production safety checks, CI scaffold jobs, release verification, and manual/runtime acceptance. `npm run check` is governance consistency plus Node structural tests; it is not production readiness, runtime business correctness, database migration safety, browser acceptance, money-flow idempotency, or complete high-risk semantic coverage. `check:runtime` detects tooling by default and does not execute Maven/Vite builds unless `--execute` or policy enables execution. `scaffold-ci` passing is not a manual business acceptance pass. This change does not modify customer runtime code, sales-order runtime code, production safety config, customer fund model, migration/idempotency registry, database business table structure, package scripts, tools, or tests.

Completed customer runtime change `CR-20260626T011624Z-salesman-candidate-hardening` is R-05. It fixes the customer salesman candidate boundary so `CustomerServiceImpl.selectSalesmanCandidates` returns only normal users with sales/business roles and returns an empty list when none match instead of falling back to all normal users. The customer UI now warns `未找到销售/业务员角色用户，请先配置销售角色。` when users enter SALESMAN owner selection or submit without configured candidates, while remote search input does not warn on every keystroke. Customer feature/API/UI contracts and `tests/customer-risk-gate.test.js` record the strict no-fallback rule. Local Git shows `master` and `origin/master` at `818108c fix: restrict salesman candidates to sales roles`.

R-05 does not modify customer funds, sales-order runtime, security configuration, migration/idempotency registry, SQL ownership, mapper XML, controller, API client, database business table structure, package scripts, or tools. Its focused and full local gates passed before R-06 started.

Current customer migration change `CR-20260626T115131Z-executable-customer-migration-baseline` is R-06. It adds executable SQL baselines for the existing customer schema, the two built-in PUBLIC seed customers, RuoYi business/customer menu and `business:customer:*` permissions, and read-only runtime validation SQL. `ai/registry/migration-registry.json` now treats `customer-schema-baseline`, `customer-public-seed-baseline`, `customer-menu-permission-baseline`, and `customer-runtime-validation` as blocking entries with existing `.sql` files, rollback plans, and verification notes. `sql/customer.ownership.md` remains the ownership document, but it is no longer the only baseline DDL source.

R-06 also includes `ai/registry/features.json` because scan/ownership sync registered the new customer executable SQL baseline, validation SQL, and menu permission SQL files under the customer feature ownership.

R-06 does not modify customer Java/Vue runtime code, customer fund runtime code, sales-order runtime, security configuration, package scripts, tools, idempotency registry, `idempotent_request`, or non-customer business table structure. MySQL execution of the R-06 SQL files has not been performed in this environment unless a later verification note says otherwise.

For future module boundaries, sales-order may select customer, carry default contact/address and owner snapshots, and show `CUSTOMER_DEPOSIT` status during submit, but must not directly deduct customer funds. Delivery / finance contracts must later define `CUSTOMER_DEPOSIT` deduction/refund/adjustment/reversal and `SAMPLE_REBATE` deduction. Every customer-fund mutation must write `customer_fund_flow`.

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

`TASK-CUSTOMER` is the active customer task in `memory/TASKS.json` for `CR-20260626T115131Z-executable-customer-migration-baseline`. `TASK-0002` remains the platform/governance tracking task. `beforeSalesOrder` remains blocked and R-06 must not be treated as sales-order readiness.

## Latest Session

`memory/sessions/2026-06-25-pre-release-breaking-change-policy.md`

## Next Actions

- Finish R-06 executable customer migration baseline verification and closeout.
- Then choose R-07 customer fund idempotency or R-09 sales-order pre-implementation contract package.
- Keep `beforeSalesOrder` blocked unless required contracts and review explicitly unlock it later.
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

For `CR-20260626T115131Z-executable-customer-migration-baseline`, [local] `npm run resume`, [local] `npm run impact -- 客户管理`, [local] `npm run check:high-risk-governance`, [local] `node --test tests/high-risk-governance.test.js` with 39/39 tests, [local] `npm run scan:all`, [local] `npm run context:build -- customer`, [local] `npm test` with 191/191 tests, [local] `npm run check` with 191/191 tests, and [local] `git diff --check` passed. [not-run] MySQL execution of the R-06 SQL files was not performed in this environment.

For `CR-20260626T011624Z-salesman-candidate-hardening`, [local] `npm run resume`, [local] `npm run impact -- 客户管理`, [local] `npm run scan:all`, [local] `node --test tests/customer-risk-gate.test.js` with 11/11 tests, [local] `node --test tests/high-risk-governance.test.js`, [local] `npm test`, [local] `npm run check`, [local] `git diff --check`, and [local] configured Maven compile passed. [not-run] Plain `mvn -pl ruoyi-admin -am -DskipTests compile` is unavailable on PATH. Local Git shows `master` and `origin/master` at `818108c fix: restrict salesman candidates to sales roles`.

For `CR-20260626T004832Z-governance-runtime-verification-boundary`, R-04 required verification was `npm run resume`, `npm run check:runtime`, `npm run check:high-risk-governance`, `npm test`, `npm run check`, and `git diff --check`. `npm run verify:release` was intentionally not required for this documentation/governance boundary clarification; do not claim release verification passed until that script itself passes.

For `CR-20260625T170213Z-customer-fund-vocabulary-source-cleanup`, [local] `npm run resume` passed and confirmed the active current change. [local] Required old-fund-vocabulary scan attempts first failed with unavailable `grep` and unsupported `Select-String -Recurse`, then the equivalent recursive PowerShell scan completed. [local] Current-doc old-fund-vocabulary scan found no active matches in current customer brief, context, contracts, README, handover, project state, changelog, or tasks. [local] Remaining matches are historical evidence only under old change records, runtime logs, and one historical session note. [local] `npm run scan:all` passed. [local] `npm run check:high-risk-governance` passed with the expected non-blocking customer baseline DDL warning. [local] `npm run context:build -- customer` passed. [local] `npm test` passed with 185/185 Node tests after scoped current-CR baseline exceptions and context regeneration. [local] `npm run finalize:change -- --summary "客户资金口径上下文源清理"` passed. [local] `npm run check` passed with 185/185 Node tests. [local] `git diff --check` passed. No customer runtime code, sales-order runtime code, production safety config, Java/Vue customer fund runtime code, migration/idempotency registry, or business database table structure was modified.

For `CR-20260625T162821Z-production-safety-baseline`, [local] `npm run resume` passed before the new change record was created. [local] `npm run start:change -- --mode rule-change production-safety-baseline` created the current CR. [local] `node --test tests/production-safety.test.js` passed with 7 tests. [local] `npm run check:config-safety` passed with development/default warnings only. [local] `npm run check:prod-safety` passed. [local] `npm test` passed with 185/185 Node tests. [local] `npm run check` passed with 185/185 Node tests after provenance handover correction. [local] `git diff --check` passed. [not-run] Plain `mvn -pl ruoyi-admin -am -DskipTests compile` is not runnable on local PATH. [local] `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests compile` passed with reactor `BUILD SUCCESS`. [local] `npm --prefix ruoyi-ui run build:prod` passed with Vite production build success. [inconclusive] `npm run verify:release` ran `npm run check` and `npm run check:prod-safety` successfully, then failed because plain `mvn` is not available on PATH; do not claim release verification passed until the script itself passes. No customer runtime code, sales-order runtime code, customer fund model code, migration/idempotency registry, or business database table structure was modified.

For `CR-20260625T155756Z-post-push-handover-consistency-fix`, [local] `npm run resume` passed before the new change record was created. [local] `npm run start:change -- --mode rule-change post-push-handover-consistency-fix` created the current CR. [local] `git show -s --format="%H%n%s%n%D" a49b678644dddc16ce45f094bff5459fd9a716e2` confirmed commit `a49b678644dddc16ce45f094bff5459fd9a716e2` with message `governance: add high-risk semantic framework`. [local] `git branch --contains a49b678644dddc16ce45f094bff5459fd9a716e2` confirmed the commit is contained by local `master`. [inconclusive] `npm run check:after-push` exited non-zero with `check:after-push: inconclusive` because the working tree is not clean during this R-01 development pass. [local] `npm run context:build -- customer` passed. [local] `npm run check` passed with 178/178 Node tests after fixing handover Verification wording and regenerating current context; existing warnings remained warning-only. [local] `git diff --check` passed. [inconclusive] CI result not confirmed in this evidence pass. Do not claim GitHub Actions passed until actual run id and conclusion are recorded. This R-01 change does not modify customer runtime code, sales-order runtime code, production safety config, fund model code, migrations, package/tool/test code, or business database table structure.

For `CR-20260625T143256Z-pre-release-breaking-change-policy`, [local] `npm run resume` passed. [local] `npm run rule:propose -- "pre-release breaking change policy" --reason "..."` created `ai/rule-proposals/2026-06-25-pre-release-breaking-change-policy.json`. [local] `npm run start:change -- --mode rule-change "pre-release breaking change policy"` created the current CR. [local] `npm run context:build -- customer` regenerated current context. [local] `node --test tests/pre-release-policy.test.js` passed with 4 tests. [local] `npm run check:pre-release-policy` passed. [local] `node --test tests/boundary-lint.test.js` passed with 9 tests after current-CR baseline exception files. [local] `node --test tests/component-checker.test.js` passed with 8 tests after current-CR baseline exception files. [local] `npm test` passed with 178 tests. [local] `npm run check` passed with 178 tests after provenance markers were recorded. [local] `git diff --check` passed. [local] forbidden-path audit returned `FORBIDDEN_PATH_AUDIT_OK`. This rule-change did not modify customer runtime code, sales-order runtime code, customer business rules, or business database table structure.

For `CR-20260625T130657Z-high-risk-semantic-governance-framework`, [local] `npm run resume` passed during startup and final verification. [local] `npm run rule:propose -- "high-risk semantic governance framework" --reason "..."`
created `ai/rule-proposals/2026-06-25-high-risk-semantic-governance-framework.json`. [local] `npm run start:change -- --mode rule-change "high-risk semantic governance framework"` created the current CR. [local] `node --test tests/high-risk-governance.test.js` passed with 36 tests. [local] `npm test` passed with 174 tests. [local] `npm run check:high-risk-governance` passed with one expected non-blocking warning for the existing customer baseline DDL document in `sql/customer.ownership.md`. [local] `npm run check` passed with the new high-risk gate wired into the existing gate sequence and `npm test` with 174 tests. [not-run] `mvn -pl ruoyi-admin -am -DskipTests compile` because plain `mvn` is not runnable on local PATH; [local] `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests compile` passed with reactor `BUILD SUCCESS`. [local] `npm --prefix ruoyi-ui run build:prod` passed with Vite production build success. [local] `git diff --check` passed. [local] forbidden-path audit returned `FORBIDDEN_PATH_AUDIT_OK`. [local] Post-push consistency correction recorded commit `a49b678644dddc16ce45f094bff5459fd9a716e2` / `governance: add high-risk semantic framework`. [inconclusive] CI result not confirmed in this evidence pass. Do not claim GitHub Actions passed until actual run id and conclusion are recorded.

For `CR-20260625T112646Z-ci-backend-frontend-governance-checks`, [local] `npm run resume`, [local] `npm run start:change -- --mode rule-change "ci backend frontend governance checks"`, [local] `npm run context:build -- customer`, [local] `node --test tests/governance-gates.test.js` with 16 tests, [local] `npm test` with 138 Node tests, [local] `npm run check:ci-coverage-declaration`, [local] `npm run check:verification-provenance`, [local] `npm run check` with 138 Node tests and existing config-safety warnings only, [local] `mvn -pl ruoyi-admin -am -DskipTests compile` with `BUILD SUCCESS`, and [local] `npm --prefix ruoyi-ui run build:prod` with Vite build success passed. This governance change did not modify customer runtime code, sales-order implementation code, customer business rules, or business database table structure. The pushed CR-2 GitHub Actions baseline passed before CR-3 started.

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
