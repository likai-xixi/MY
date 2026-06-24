# Session: Customer Factory Ownership And Salesman Maintenance

## Task

`TASK-0003 / TASK-CUSTOMER` - Implement `CR-20260623T155049Z-change` for real-customer factory ownership defaults, salesman maintenance/self-owned ownership modes, owner profit-mode recording, owner effective time, and owner-change logs.

## Status

`in_progress` - Customer implementation, backend compile/package, frontend production build, generated scans, runtime DB/API validation, browser validation, captcha restore, `finalize:change`, and `git diff --check` have passed. Final `npm run check` and `npm test` are blocked by unrelated existing RuoYi scaffold component/boundary governance findings in `system/tool` frontend files.

## Goal

Keep the current `REAL`/`PUBLIC` customer model and unified `CUSTOMER_DEPOSIT`/`SAMPLE_REBATE` fund model intact while adding customer ownership口径:

- REAL defaults to factory pool.
- Factory customers can be assigned to a salesman for maintenance.
- Salesman-self customers use sales-commission口径.
- Public customers remain order-classification customers with no fixed owner.

## Changed Files

- `ruoyi-ui/src/views/customer/index.vue`
- `ruoyi-admin/src/main/java/com/ruoyi/web/controller/business/customer/CustomerController.java`
- `ruoyi-business/src/main/java/com/ruoyi/business/customer/domain/Customer.java`
- `ruoyi-business/src/main/java/com/ruoyi/business/customer/domain/CustomerOwnerTransfer.java`
- `ruoyi-business/src/main/java/com/ruoyi/business/customer/domain/CustomerSalesmanBindLog.java`
- `ruoyi-business/src/main/java/com/ruoyi/business/customer/service/impl/CustomerServiceImpl.java`
- `ruoyi-business/src/main/resources/mapper/customer/CustomerMapper.xml`
- `sql/customer.ownership.md`
- `features/customer.md`
- `ai/contracts/customer.api.md`
- `ai/contracts/customer.db.md`
- `ai/contracts/customer.ui.md`
- `memory/API_CATALOG.md`
- `memory/PROJECT_STATE.md`
- `memory/TASKS.json`
- `memory/HANDOVER.md`
- `memory/CHANGELOG.md`
- `memory/sessions/2026-06-23-customer-owner-factory-salesman.md`

## Commands

- `npm run resume`
- `npm run ai:do -- "功能迭代：客户管理"` timed out in the shell but created `CR-20260623T155049Z-change`.
- `npm run impact -- 客户管理`
- `mvn -pl ruoyi-admin -am -DskipTests compile` failed because `mvn` is not on PATH.
- `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests compile`
- `npm --prefix ruoyi-ui run build:prod`
- `npm run scan:all`
- `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests package`
- Runtime DB adjustment and API validation against `http://localhost:18080/business/customer`
- Browser validation on `http://127.0.0.1:5174/business/customer`
- `npm run finalize:change -- --summary "客户管理厂内归属与业务员维护口径"`
- `npm run check`
- `npm test`
- `git diff --check`

## Verification

- Backend compile passed with cached Maven.
- Frontend `build:prod` passed.
- `npm run scan:all` passed.
- Runtime DB was adjusted with final owner fields and public seed rows verified as `NONE / NONE / NONE`.
- API validation passed for REAL factory default, REAL salesman-self, REAL factory-assigned maintenance, owner-change assign-maintenance, return-factory, PUBLIC owner clearing, and PUBLIC owner-change rejection.
- DB validation confirmed customer owner fields and old/new owner logs.
- Browser validation confirmed owner filter/table columns, add-dialog factory default, salesman source/profit controls, and PUBLIC owner controls hidden.
- Captcha was restored to true and `/captchaImage` returned `captchaEnabled=true`.
- `npm run finalize:change -- --summary "客户管理厂内归属与业务员维护口径"` passed.
- `git diff --check` passed.

Failed/blocked by unrelated scaffold baseline:

- `npm run check` fails at `check:components` because existing RuoYi built-in `system/role/selectUser.vue` and `tool/*` dialog/form files are flagged as reusable controls.
- `npm test` fails `boundary-lint.test.js` and `component-checker.test.js` because existing RuoYi router/tool imports and built-in controls are flagged by governance tests.

## Risks

- Runtime DB was adjusted in place for validation; a clean development DB should be rebuilt from `sql/customer.ownership.md` for broader manual QA.
- Browser validation covered the visible list/add-dialog owner behavior, not every edit/detail permutation.
- Full closeout requires a separate governance/base-adapter decision for the existing RuoYi `system/tool` component and boundary findings.

## Next Entry Point

Run `npm run resume`, inspect `ai/changes/CR-20260623T155049Z-change/verification.md` and `runtime-validation.md`, then address the existing RuoYi scaffold governance baseline separately or rerun `npm run check` and `npm test` after that baseline is fixed. Do not add sales-order, delivery, finance, maintenance-fee calculation, commission calculation, or order-level deposit behavior to this customer-management change.

## Boundaries

This change does not add sales-order, delivery, finance, maintenance-fee calculation, commission calculation, performance reports, salesman-management tables, customer public pool, automatic deduction, receipt claiming, reconciliation, order-level deposit, or buyer snapshots. Later sales-order work should freeze customer ownership snapshots at order submission time.
