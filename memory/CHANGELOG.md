# Changelog

## 2026-06-28 - governance/r-10a-masterdata-contract-package

- Change: `ai/changes/CR-20260628-r-10a-masterdata-mvp-contract-package`.
- R-10A creates a contract/pre-review package for the later product/material/accessory/sales-option master-data MVP.
- R-10B scope is limited to product category, product series, product model, material category, material record, accessory category, accessory record, sales option category, and sales option value.
- Product examples such as `门`, `门匾`, `栅栏`, `护栏`, `钣金件`, `异形件`, `工程定制`, `庭院门`, `入户门`, `玻璃拼接门`, `整拼门`, `铝卡门`, and `型材门` are recorded as configurable data, not hard-coded models.
- Sales option examples such as `单开`, `对开`, `子母`, `连体子母`, `颜色`, `拉手`, `锁具`, `铰链`, `玻璃`, `表面处理`, `包装方式`, and `材料体系` are recorded as configurable data, not hard-coded enums.
- R-10A records stable code/display name/status/sort order/remark requirements, reference-safe delete/archive rules, snapshot code/name rules, R-10B executable MySQL migration requirement, and view/add/edit/remove/export/status/publish permission boundary.
- No sales-order runtime, Java service/controller/mapper/domain, Vue page, API client, SQL migration, SQL validation, customer runtime, package, tool, workflow, or production configuration file was created or modified.
- [local] `npm run context:build -- customer` passed after R-10A restored current-context generated idempotence.
- [local] Final `npm run resume`, `npm run check` with `npm test` 233/233, and `git diff --check` passed.

## 2026-06-28 - governance/r-09-contract-reconcile

- Change: `ai/changes/CR-20260628-r-09-configurable-modeling-contract-package`.
- R-09 reconcile keeps `origin/master` contract filenames as the source of truth: `masterdata.*`, `rule.*`, and `tech.*`.
- Backed up local f959 as `backup/r09-local-f959` and used its `r09-*` contracts only as a clause reference; no `r09-*` files were created.
- Strengthened product/material/sales-option/process, field scheme, option scheme, snapshot/versioning, formula/rule, technical decomposition, part template, calculation snapshot, and roadmap-boundary clauses.
- No sales-order runtime, Java service/controller/mapper/domain, Vue page, API client, SQL migration, customer runtime, idempotency runtime, security config, `package.json`, `tools/`, or `.github/workflows` file was created or modified.
- [local] Early closeout passed: `npm run resume`, JSON parse audit, `R09_CONTRACT_AUDIT_OK count=19`, `SALES_ORDER_RUNTIME_ABSENT_OK`, and forbidden runtime diff audit.
- [local] `npm run context:build -- customer` passed and restored generated current-context idempotence.
- [local] Final `npm run check` passed end to end with `npm test` 233/233, and `git diff --check` passed.
- [not-run] GitHub Actions and runtime acceptance were not checked because this is a local contract-only reconcile.

## 2026-06-25 - runtime-validation

- Change: `ai/changes/CR-20260625T022150Z-change`.
- Live API/DB validation passed on backend `http://127.0.0.1:18080`, database `my_ry_vue_runtime`, Redis DB1.
- Runtime test customer: `customer_id=25`, `customer_code=KH202606000021`, marker `RT_DEPOSIT_BOUNDARY_20260625031150`.
- Omitted and explicit `CUSTOMER_DEPOSIT` deposit requests wrote `CUSTOMER_DEPOSIT / DEPOSIT_IN / CUSTOMER_DEPOSIT_BATCH`.
- `SAMPLE_REBATE` and `INVALID_ACCOUNT` deposit requests failed before balance, fund-flow, or deposit-batch mutation.
- `/sample-rebate` created `sample_rebate_record` and then wrote internal `SAMPLE_REBATE_GENERATE` without creating a deposit batch.
- `PUB_DIRECT_SALE` deposit was rejected without creating funds data.
- Captcha was restored to `true` in `sys_config` and Redis DB0/DB1, and `/captchaImage` returned `captchaEnabled=true`.

## 2026-06-21 — Codex Auto Dev OS

- Completed chat-driven add, update preparation, deletion dry-run, and deletion apply workflows.
- Added automatic change-record finalization for changed files, verification, handover, changelog, and task memory.
- Added adapter-aware project configuration for generic and RuoYi project bases.
- Added RuoYi ownership paths for `ruoyi-business`, `ruoyi-admin`, `ruoyi-ui`, SQL, menu, and permission tracking.
- Added deletion ownership expansion for registry, graph, generated scans, database, permissions, SQL, mapper XML, menus, components, docs, orphan checks, and rollback notes.
- Added component catalog and similarity gates for generic and RuoYi shared component roots.
- Added `impact.allowedEditRoots` diff scope enforcement as part of `npm run check`.
- Added documentation for RuoYi adapter setup, change-record closure, deletion ownership, and component governance.
- Verified the full gate and separate fresh-copy workflows for generic add, deletion apply, and RuoYi add.

## 2026-06-21 — Baseline

- Established Codex App role routing, feature registry, project memory, module/API/UI graphs, validation tools, and a minimal inventory example.
- `npm run check` is the main governance gate.## 2026-06-22 — baseline
- Enhanced Codex App chat workflow governance with single ai:do entry, open update lifecycle, ownership auto-sync, RuoYi scanner coverage, runtime gate, and deletion rollback bundles.
- Feature: `template-governance`.## 2026-06-22 — baseline
- Hardened Windows runner, deletion closure, component governance, backend boundaries, source-truth checks, and CI matrix.
- Feature: `template-governance`.## 2026-06-22 — remove-dry-run
- Prepared deletion dry-run impact list for `inventory` (Inventory). No business files were deleted.
- Feature: `inventory`.
## 2026-06-22 — Feature Removal

- Removed feature `inventory` (Inventory) from feature registry, module registry, graph outputs, active task memory, project state, and handoff trail.
- Rebuilt generated scans and graph memory after the removal pass.## 2026-06-22 — remove-apply
- Applied feature deletion for `inventory` (Inventory) and updated registry, graph, scans, memory, changelog, and handover.
- Feature: `inventory`.## 2026-06-22 — profile-setup
- 接入 RuoYi + Vue3 项目底座，保留 Codex 治理目录，锁定 RuoYi profile，并刷新扫描、图谱和记忆。
- Feature: `project-base`.## 2026-06-22 — profile-setup
- 接入 RuoYi + Vue3 项目底座，登记 RuoYi 内置模块和共享组件 ownership，锁定 RuoYi profile，并刷新扫描、图谱和记忆。
- Feature: `project-base`.## 2026-06-22 — profile-setup
- 接入 RuoYi + Vue3 项目底座，登记内置模块和共享组件 ownership，补齐 RuoYi quartz/generator 扫描根，锁定 RuoYi profile，并刷新扫描、图谱和记忆。
- Feature: `project-base`.## 2026-06-22 — profile-setup
- Updated change record, registry, graph, generated scans, memory, and handover.
- Feature: `project-base`.## 2026-06-22 — profile-setup
- Updated change record, registry, graph, generated scans, memory, and handover.
- Feature: `project-base`.## 2026-06-22 — profile-setup
- Updated change record, registry, graph, generated scans, memory, and handover.
- Feature: `project-base`.## 2026-06-22 — profile-setup
- Updated change record, registry, graph, generated scans, memory, and handover.
- Feature: `project-base`.## 2026-06-22 — profile
- Updated change record, registry, graph, generated scans, memory, and handover.
- Feature: `project-base`.## 2026-06-22 — profile
- Updated change record, registry, graph, generated scans, memory, and handover.
- Feature: `project-base`.## 2026-06-22 — add
- 新增客户管理功能
- Feature: `customer`.

## 2026-06-23 - update

- Change: `ai/changes/CR-20260623T105432Z-change`.
- 客户管理公共客户与统一定金模型。
- Customer nature is final as `REAL` or `PUBLIC`; public channels are `DIRECT_SALE` and `SELF_MEDIA`.
- Customer-level deposit is unified as `CUSTOMER_DEPOSIT`; sample rebate remains `SAMPLE_REBATE`.
- Public customers do not enable customer-level deposits, contacts, shipping addresses, fixed owner salesmen, sample policies, or sample rebates.
- Sales order, shipment, finance, automatic deduction, receipt claiming, reconciliation, and old-data migration remain out of scope.
- Feature: `customer`.

## 2026-06-23 - runtime-validation

- Change: `ai/changes/CR-20260623T105432Z-change`.
- Rebuilt the development customer tables from final `sql/customer.ownership.md` DDL and initialized `PUB_DIRECT_SALE` / `PUB_SELF_MEDIA`.
- Runtime-validated `/business/customer` for REAL/PUBLIC add, edit, detail, default contact/address behavior, unified REAL customer deposit, and PUBLIC customer-level fund-policy rejection.
- Added the missing PUBLIC detail order-classification notice in `ruoyi-ui/src/views/customer/index.vue`.
- Verified no legacy multi-deposit account labels or source-order deposit text remained in the then-current customer scope.
- Feature: `customer`.

## 2026-06-22 — customer

- Implemented the RuoYi `customer` business module with customer archive CRUD/status/export, contacts, shipping addresses, owner assignment and transfer logs, fund accounts/flows, deposit entry, sample policy, rebate records, and SQL/menu/permission ownership.
- Updated customer registries, module/API/UI graphs, API catalog, memory, handover, and change record `CR-20260622T081827Z-change`.
- Verified `npm run check`, backend Maven compile, and frontend production build.## 2026-06-22 — add
- 客户管理运行偏差收口
- Feature: `customer`.## 2026-06-22 — update
- 客户管理编码字典与地址联动优化
- Feature: `customer`.## 2026-06-22 — update
- 客户管理省市区完整数据源修复
- Feature: `customer`.## 2026-06-22 — update
- 客户管理省市区行政区划编码补齐
- Feature: `customer`.## 2026-06-22 — update
- 客户管理默认联系人和默认收货地址自动生成及同步
- Feature: `customer`.## 2026-06-23 — governance
- Change: `ai/changes/CR-20260623T015344Z-governance-handoff-integrity-checker`.
- Governance handoff integrity checker
- Pre-commit closeout reran `node --test tests/change-handoff-integrity-checker.test.js`, `npm run check:change-handoff`, `npm run close:change`, `npm run check`, and standalone `npm test`; all passed.
- Feature: `platform`.

## 2026-06-23 — governance
- Change: `ai/changes/CR-20260623T031118Z-handoff-gate`.
- 治理增强：稳定第一批 handoff gate 使用体验
- Feature: `platform`.
- Closeout: wired the handoff integrity checker into the main `npm run check` gate through `check:handover-integrity` and `check:change`; retained `check:change-handoff` as a compatibility alias.## 2026-06-23 — update
- Change: `ai/changes/CR-20260623T055820Z-change`.
- 客户管理编辑同步选项默认勾选
- Feature: `customer`.## 2026-06-23 — update
- Change: `ai/changes/CR-20260623T071949Z-change`.
- 客户管理列表隐藏客户简称列
- Feature: `customer`.## 2026-06-23 — update
- Change: `ai/changes/CR-20260623T105432Z-change`.
- 客户管理公共客户与统一定金模型运行验收
- Feature: `customer`.## 2026-06-23 — update
- Change: `ai/changes/CR-20260623T134224Z-change`.
- 客户管理新增编辑非空校验
- Feature: `customer`.

## 2026-06-23 - update

- Change: `ai/changes/CR-20260623T134224Z-change`.
- 客户管理新增/编辑弹窗增加 REAL/PUBLIC 分口径非空校验，并在后端保存路径增加同口径兜底校验。
- REAL 客户必填主联系人、联系电话、归属业务员、完整省市区、详细地址；PUBLIC 客户必填公共渠道且仍不要求真实客户字段。
- 未改变 SQL 结构、API 路径、权限码、统一定金模型或销售订单/发货/财务等未来模块范围。
- Feature: `customer`.## 2026-06-23 — update
- Change: `ai/changes/CR-20260623T144532Z-change`.
- 客户管理联系电话手机号校验
- Feature: `customer`.

## 2026-06-23 - update

- Change: `ai/changes/CR-20260623T144532Z-change`.
- 客户管理新增/编辑 REAL 客户联系电话手机号格式校验，主联系电话必须为 11 位中国大陆手机号。
- 联系人电话和收货地址联系电话保持选填，但填写时必须符合同一手机号格式。
- PUBLIC 公共客户仍不校验联系人电话，并在保存前清空联系人、电话、联系人列表和收货地址列表。
- 后端 `CustomerServiceImpl` 增加同口径兜底校验，直接调用 API 也会拒绝非法 REAL 电话。
- 未改变 SQL 结构、API 路径、权限码、统一定金模型或销售订单/发货/财务等未来模块范围。
- Feature: `customer`.

## 2026-06-23 - update

- Change: `ai/changes/CR-20260623T155049Z-change`.
- 客户管理厂内归属与业务员维护口径。
- 新增真实客户默认归厂内客户池，不强制选择业务员。
- 真实客户可选择厂内分配维护（`FACTORY_ASSIGNED / MAINTENANCE_FEE`）或业务员自有客户（`SALESMAN_SELF / SALES_COMMISSION`）。
- 归属变更记录 `ownerEffectiveTime` 和 old/new owner type/source/profit/effectiveTime 日志。
- 公共客户保持 `NONE / NONE / NONE`，不允许归属变更；统一定金 `CUSTOMER_DEPOSIT` 和样品返现 `SAMPLE_REBATE` 规则不变。
- 本次只记录收益口径，不开发销售订单、维护费计算、业务提成计算、业绩报表、发货或财务模块。
- Feature: `customer`.

## 2026-06-23 - verification-note

- Change: `ai/changes/CR-20260623T155049Z-change`.
- Customer ownership implementation and runtime validation passed for REAL factory default, salesman self-owned, factory-assigned maintenance, owner-change logs, PUBLIC owner clearing/rejection, and browser-visible list/form behavior.
- `git diff --check` passed.
- Final `npm run check` and `npm test` are blocked by existing non-customer RuoYi scaffold governance findings in `system/tool` component detection and router/tool boundary lint. No scanner, rule, profile, sales-order, delivery, finance, fee, or commission code was changed for this business iteration.
- Feature: `customer`.

## 2026-06-24 — update
- Change: `ai/changes/CR-20260623T235902Z-change`.
- 客户管理公共客户固定分类口径收口
- Feature: `customer`.

## 2026-06-24 - verification-note

- Change: `ai/changes/CR-20260623T235902Z-change`.
- PUBLIC 公共客户固定为系统内置分类客户，普通新增/编辑入口只维护 REAL 真实客户。
- PUBLIC 行客户类型/客户等级不再显示为真实客户口径；列表和详情使用 `系统分类` / `-`。
- 后端直接拒绝 PUBLIC 普通新增、内置 PUBLIC 普通编辑、停用、删除、归属变更，以及 REAL 使用 `PUB_DIRECT_SALE` / `PUB_SELF_MEDIA` 保留编码。
- SQL ownership 记录最终口径：两个 PUBLIC seed、`OTHER` / `NORMAL` 技术兼容值、每个 publicChannel 一个有效 PUBLIC 客户、`uk_customer_public_channel` 唯一键。
- Runtime API validation passed after rebuilding and restarting the MY backend jar; captcha was restored to true afterward.
- Current local runtime DB still has older PUBLIC validation rows from previous iterations, so rebuild/cleanup is needed before claiming only two PUBLIC rows exist in the local data.
- Scoped current-change component/boundary exceptions were added for exact pre-existing RuoYi `system/tool/generator` baseline files; no scanner/rule/profile or future-module code was changed.
- `npm run check` and `npm test` now pass for the current change.
- Feature: `customer`.

## 2026-06-24 — update
- Change: `ai/changes/CR-20260624T010638Z-change`.
- 客户管理资金入金与公共客户口径校验收口
- Feature: `customer`.

## 2026-06-24 - verification-note

- Change: `ai/changes/CR-20260624T010638Z-change`.
- `/business/customer/{customerId}/fund/deposit` 收口为入金接口：空 `flowType` 或 `DEPOSIT_IN` 成功，`DEPOSIT_DEDUCT`、`DEPOSIT_REFUND`、`DEPOSIT_ADJUST`、`DEPOSIT_REVERSE` 统一拒绝并提示 `定金录入接口只允许入金，扣减、退款、调整、冲正请走独立资金处理流程。`
- REAL 主联系电话、联系人电话、收货地址联系电话保存前 trim；非法主电话和非法子联系人电话均被 API 拒绝。
- `duplicate-warning` 对明显非法手机号不做电话重复查询。
- 归属变更已回归验证，`ASSIGN_MAINTENANCE` 与 `RETURN_FACTORY` 均更新当前归属；owner log 查询增加 `log_id desc` 防止同一秒排序不稳定。
- Runtime DB evidence for validation customer `22` showed `CUSTOMER_DEPOSIT / DEPOSIT_IN / CUSTOMER_DEPOSIT_BATCH` only.
- 本地开发库仍有历史 PUBLIC 验证行（`public_count=8`），因此不能声称运行库只有两个 seed PUBLIC；`sql/customer.ownership.md` 已补运行验证 SQL 和开发库清理/重建 SQL。
- Captcha validation setting was restored to true after API validation.
- `npm run check`、standalone `npm test`（97 tests）和 `git diff --check` passed.
- Feature: `customer`.## 2026-06-24 — update
- Change: `ai/changes/CR-20260624T010638Z-change`.
- 客户管理风险防复发门禁
- Feature: `customer`.

## 2026-06-24 - verification-note

- Change: `ai/changes/CR-20260624T010638Z-change`.
- Cleaned local development database `my_ry_vue_runtime` historical PUBLIC validation data without changing business code.
- Pre-clean PUBLIC count was `8`; backup tables were created with suffix `20260624_211203`; non-seed PUBLIC customer codes deleted: `KH202606000002`, `KH202606000004`, `KH202606000006`, `KH202606000008`, `KH202606000013`, `KH202606000018`.
- Post-clean SQL invariant passed: PUBLIC total `2`, non-seed PUBLIC count `0`, duplicate `public_channel` count `0`, both built-in seed rows matched expected values, and PUBLIC child dirty counts were all `0`.
- Post-clean runtime API validation rejected PUBLIC create, seed edit, seed status change, seed delete, and owner transfer; captcha was restored to `true` in `sys_config` and Redis DB0/DB1.
- Feature: `customer`.## 2026-06-24 — update
- Change: `ai/changes/CR-20260624T010638Z-change`.
- 清理本地开发库历史 PUBLIC 验证数据
- Feature: `customer`.## 2026-06-24 — rule-change
- Change: `ai/changes/CR-20260624T152423Z-governance-sales-order-handoff-gate`.
- 新增销售订单前治理接手机制
- Feature: `platform`.
# Changelog Note - 2026-06-24 - governance/rule-change

- Change: `ai/changes/CR-20260624T152423Z-governance-sales-order-handoff-gate`.
- Added sales-order-before governance handoff mechanism: roadmap, `beforeSalesOrder`, refactor debt, current-context, multi-role review scaffold, document/read/context/file-weight gates, package check wiring, and tests.
- No sales-order implementation was added.
- No customer-management business code was modified.
- No database business table structure was modified.
- Future sales-order implementation must pass `beforeSalesOrder` and a multi-role review decision containing `Allow Implementation`.
- Verification passed: `npm run check` with 109 Node tests, standalone `npm test` with 109 Node tests, and `git diff --check`.

## 2026-06-25 - governance/rule-change follow-up

- Change: `ai/changes/CR-20260624T152423Z-governance-sales-order-handoff-gate`.
- Closed the M1 review-gate gap by wiring default `check:review` to context-aware `node tools/review-checker.js --require-allow`, so `npm run check` fails business implementation changes without an approved review but does not force `Allow Implementation` on governance/docs/context/review/memory-only changes.
- Closed the L1 phase-gate gap by expanding `tools/phase-gate-checker.js` sales-order implementation matching to common naming variants under real implementation roots, while keeping governance docs out of the block.
- Added regression coverage; targeted governance handoff test now passes with 12 tests.
- Follow-up verification passed: `npm run scan:all`, `npm run check` with 114 Node tests, standalone `npm test` with 114 Node tests, `git diff --check`, and forbidden-path audit.
- No sales-order implementation was added and no customer-management business code was modified.

## 2026-06-25 - governance/rule-change file-weight follow-up

- Change: `ai/changes/CR-20260624T152423Z-governance-sales-order-handoff-gate`.
- Fixed push-preflight `check:file-weight` EISDIR failure by making `tools/file-weight-checker.js` stat changed paths before reading and check only real files.
- Updated `scripts/finalize-change.js` so generated `changed-files.json` records exclude existing directories, while missing deleted-file paths remain safe to record.
- Corrected the current `changed-files.json` by removing directory entries and adding `scripts/finalize-change.js`.
- Added regression coverage for directory entries, deleted missing files, continued real-file checking, and overweight real-file rejection.
- Verification passed: `npm run check:file-weight`, `node --test tests/governance-sales-order-handoff-gate.test.js` with 16 tests, `npm run context:build -- customer`, `npm run check` with 118 Node tests, standalone `npm test` with 118 Node tests, and `git diff --check`.
- No customer-management business code, sales-order implementation, or database business table structure was modified.## 2026-06-25 — update
- Change: `ai/changes/CR-20260625T022150Z-change`.
- 客户管理定金入口资金边界收口
- Feature: `customer`.

## 2026-06-25 - verification-note

- Change: `ai/changes/CR-20260625T022150Z-change`.
- `/business/customer/{customerId}/fund/deposit` now routes through a deposit-only service method and can only write `CUSTOMER_DEPOSIT`.
- Omitted `accountType` and explicit `CUSTOMER_DEPOSIT` are accepted; `SAMPLE_REBATE` and other non-`CUSTOMER_DEPOSIT` values are rejected before account balance, deposit batch, or fund flow mutation.
- Sample rebate remains separate through `/business/customer/{customerId}/sample-rebate`, which creates `sample_rebate_record` before internal `SAMPLE_REBATE_GENERATE` fund flow.
- Verification passed: `npm run scan:all`, `npm run finalize:change -- --summary "客户管理定金入口资金边界收口"`, `npm run check` with 120 Node tests, standalone `npm test` with 120 Node tests, and `git diff --check`.
- No sales-order implementation, governance-rule change, or SQL business table structure change was made.

## 2026-06-25 - update
- Change: `ai/changes/CR-20260625T035514Z-change`.
- 客户管理交接状态收口.
- Reconciled README positioning, customer feature brief current change, current context, project state, handover, changelog, task memory, and customer test ownership after `d103b0d fix(customer): restrict deposit endpoint to customer deposit`.
- Registered `tests/customer-risk-gate.test.js` in customer `tests` and `ownership.tests` without editing the test assertion logic.
- No Java, XML, Vue, API client, SQL, customer fund business logic, or sales-order implementation files were changed.
- Verification passed after scoped current-CR baseline exceptions and context regeneration: `npm run check` with 120 Node tests, standalone `npm test` with 120 Node tests, and `git diff --check`.
- Feature: `customer`.

## 2026-06-25 - update
- Change: `ai/changes/CR-20260625T042041Z-change`.
- 客户管理资金并发安全收口.
- Extracted customer fund mutation into `ICustomerFundService` / `CustomerFundServiceImpl` and delegated fund-account initialization, deposit entry, generic fund entry, and sample rebate fund-flow writing from `CustomerServiceImpl`.
- Added `CustomerMapper.selectFundAccountForUpdate(customerId, accountType)` with `limit 1 for update`, so balance calculation happens after the account row is locked.
- Handled concurrent first fund-account creation through `DuplicateKeyException` and locked re-read, and added bounded retry for `flow_no` and `deposit_batch_no` unique collisions.
- Runtime API/DB validation passed for omitted/explicit `CUSTOMER_DEPOSIT`, invalid account rejection without mutation, sample rebate record-before-flow without deposit batch, PUBLIC customer rejection without mutation, and 10 concurrent one-yuan deposits without lost update or duplicate numbers.
- Verification passed: cached Maven compile/package, `node --test tests/customer-risk-gate.test.js` with 8 tests, `npm run scan:all`, `npm run finalize:change -- --summary "客户管理资金并发安全收口"`, regenerated current context, `npm run check` with 121 Node tests, standalone `npm test` with 121 Node tests, and `git diff --check`.
- No sales-order, delivery, finance, deduction, refund, adjustment, reversal, governance-rule, or SQL business table structure change was made.
- Feature: `customer`.

## 2026-06-25 - governance/rule-change

- Change: `ai/changes/CR-20260625T093416Z-p0-governance-stability-gates`.
- Added P0 governance gates for current-doc-state drift, feature test ownership, config safety, verification provenance, and CI coverage declarations.
- Added `check:after-push` for publish handover validation and intentionally kept it out of `npm run check`.
- Added real temp-root Node tests in `tests/governance-gates.test.js` and registered governance test ownership exceptions.
- No customer runtime code, sales-order implementation code, or business database table structure was changed.
- Verification passed: `npm test` with 131 Node tests, all five standalone P0 gates, full `npm run check`, and `git diff --check`.
- `check:config-safety` warns only on existing development/default values; `check:ci-coverage-declaration` warns that broader build workflow commands are not present and current docs must not claim that coverage.

## 2026-06-25 — rule-change
- Change: `ai/changes/CR-20260625T093416Z-p0-governance-stability-gates`.
- 新增 P0 治理稳定门禁
- Feature: `platform`.

## 2026-06-25 — rule-change
- Change: `ai/changes/CR-20260625T112646Z-ci-backend-frontend-governance-checks`.
- CI backend frontend governance checks
- Feature: `platform`.

## 2026-06-25 - governance/ci

- Change: `ai/changes/CR-20260625T112646Z-ci-backend-frontend-governance-checks`.
- Added GitHub Actions baseline jobs `governance`, `backend-compile`, and `frontend-build` with real `npm run check`, `mvn -pl ruoyi-admin -am -DskipTests compile`, and `npm --prefix ruoyi-ui run build:prod` commands.
- Hardened CI coverage and verification provenance checkers to parse workflow `run:` commands, reject echo-only build theater, accept `working-directory: ruoyi-ui` frontend builds, and distinguish `[ci-planned]` from passed CI evidence.
- Root and `ruoyi-ui` have no `package-lock.json`, so the CI workflow uses `npm install` without committing lockfile changes.
- Local verification passed: `npm test` with 137 Node tests, `npm run check:ci-coverage-declaration`, `npm run check:verification-provenance`, full `npm run check` with 137 Node tests, `mvn -pl ruoyi-admin -am -DskipTests compile`, `npm --prefix ruoyi-ui run build:prod`, `git diff --check`, and forbidden-path audit.
- [ci-planned] GitHub Actions workflow includes Node governance, Maven compile, and ruoyi-ui build; actual CI result is determined after push.
- No customer runtime code, sales-order implementation code, customer business rules, or business database table structure was changed.

## 2026-06-25 - governance/ci follow-up

- Change: `ai/changes/CR-20260625T112646Z-ci-backend-frontend-governance-checks`.
- First pushed GitHub Actions run `28168635884` failed only in `governance` at `scan:frontend-routes:check`; `backend-compile` and `frontend-build` passed.
- Root cause: `.gitignore` pattern `build/` ignored pre-existing `ruoyi-ui/src/views/tool/build/*.vue` source files while committed generated route artifacts already referenced those RuoYi tool routes.
- Repair: add a narrow `.gitignore` exception for `ruoyi-ui/src/views/tool/build/*.vue` and track those source files so clean GitHub Actions checkout matches local route scan input.
- Second pushed GitHub Actions run `28169688512` passed `scan:frontend-routes:check` but failed at `check:change-handoff` because root `npm install` generated an untracked `package-lock.json` in the clean runner checkout.
- Repair: keep real npm installs and add `--package-lock=false` to root and `ruoyi-ui` install commands until committed lockfiles exist.
- Local install verification confirmed both install commands completed without generating root or `ruoyi-ui` lockfiles.
- Third pushed GitHub Actions run `28170129447` passed route scan, handoff integrity, backend compile, and frontend build, then failed at `check:runtime` because `mvn` was unavailable in the Node-only governance job.
- Repair: set up Java 17 in the governance job before Node so `npm run check` can run the existing runtime checker without skipping it.
- Fourth pushed GitHub Actions run `28170484346` still failed at `check:runtime` because the runtime policy configured a Windows-local Maven path.
- Repair: `tools/runtime-checker.js` now falls back from an unavailable configured tool path to the standard command name such as `mvn`, with regression coverage in `tests/runtime-checker.test.js`.
- Local repair verification passed: `npm run scan:frontend-routes`, `npm run scan:frontend-routes:check`, `npm run check:ci-coverage-declaration`, `npm run check:verification-provenance`, `npm test`, `npm run check`, Maven compile, ruoyi-ui production build, and `git diff --check`.
- [ci-planned] A new GitHub Actions result is required after pushing this repair; do not treat the local checks as CI passed evidence.

## 2026-06-25 - governance/rule-change

- Change: `ai/changes/CR-20260625T130657Z-high-risk-semantic-governance-framework`.
- Added CR-3 high-risk semantic governance framework registries, JSON schemas, `tools/high-risk-governance-checker.js`, `check:high-risk-governance`, and `tests/high-risk-governance.test.js`.
- Blocking scope is schema/registry correctness and explicitly required entries; missing future sales-order/delivery/finance/production runtime evidence is not hard blocking in CR-3.
- `beforeSalesOrder` remains blocked; sales-order snapshot, state-machine, fund-boundary, idempotency, contract-to-test, and migration-plan contracts remain CR-4 scope.
- No customer runtime code, sales-order runtime code, customer business rules, or business database table structure was changed.
- [local] Verification passed: `node --test tests/high-risk-governance.test.js` with 36 tests, `npm test` with 174 tests, `npm run check:high-risk-governance` with the expected non-blocking customer baseline migration warning, full `npm run check`, cached Maven backend compile, ruoyi-ui production build, `git diff --check`, and forbidden-path audit.
- [not-run] Plain `mvn -pl ruoyi-admin -am -DskipTests compile` is not runnable on local PATH; [local] the project configured Maven command in `ai/rules/runtime-policy.json` passed with `BUILD SUCCESS`.

## 2026-06-25 - governance/pre-release policy

- Change: `ai/changes/CR-20260625T143256Z-pre-release-breaking-change-policy`.
- Added `ai/rules/pre-release-policy.json`, `tools/pre-release-policy-checker.js`, `tests/pre-release-policy.test.js`, and `check:pre-release-policy` in `package.json`.
- Default compatibility mode is now breaking-change while the project is unreleased: replace old code/data contracts by default, allow recorded development data reset/rebuild, and require explicit user approval before adding compatibility layers.
- Updated `AGENTS.md`, `docs/chat-driven-codex-workflow.md`, current context, handover, task memory, and session memory for the policy.
- No customer runtime code, sales-order runtime code, delivery/finance/production runtime code, customer business rules, or business database table structure was changed.
- [local] Verification passed: `node --test tests/pre-release-policy.test.js` with 4 tests, `npm run check:pre-release-policy`, `node --test tests/boundary-lint.test.js` with 9 tests, `node --test tests/component-checker.test.js` with 8 tests, `npm test` with 178 tests, `npm run check` with 178 tests after provenance markers were recorded, `git diff --check`, and forbidden-path audit.

## 2026-06-25 - governance/post-push handover consistency

- Change: `ai/changes/CR-20260625T155756Z-post-push-handover-consistency-fix`.
- R-01 corrected CR-3 handover and verification state from stale no-commit/no-push wording to commit-recorded wording.
- CR-3 commit: `a49b678644dddc16ce45f094bff5459fd9a716e2` / `governance: add high-risk semantic framework`.
- CI result not confirmed in this evidence pass. Do not claim GitHub Actions passed until actual run id and conclusion are recorded.
- Next action is R-02 production safety baseline, followed by customer fund vocabulary source cleanup, governance/runtime verification boundary clarification, and customer salesman candidate hardening.
- Local verification passed after context regeneration: `npm run check` with 178/178 Node tests and `git diff --check`. `npm run check:after-push` remained inconclusive because the R-01 worktree was not clean.
- No customer runtime code, sales-order runtime code, production safety config, fund model code, migrations, package/tool/test code, or business database table structure was changed.

## 2026-06-25 - governance/production safety

- Change: `ai/changes/CR-20260625T162821Z-production-safety-baseline`.
- R-02 removed `/druid/**` from explicit Spring Security anonymous `permitAll`.
- Added `ruoyi-admin/src/main/resources/application-prod.yml` with production DB, Redis, Druid login values, and token secret supplied through environment placeholders.
- Production Druid console and Swagger UI are disabled by default.
- Added `check:prod-safety` as the blocking production safety baseline and `verify:release` as the explicit release verification entry.
- Added `docs/production-readiness.md` and README/memory/context notes clarifying that default/dev config is not production release config and `npm run check` is not production safety approval.
- [local] Verification passed: `node --test tests/production-safety.test.js` with 7 tests, `npm run check:config-safety` with development/default warnings only, `npm run check:prod-safety`, `npm test` with 185 tests, `npm run check` with 185 tests, `git diff --check`, cached Maven compile with `BUILD SUCCESS`, and `npm --prefix ruoyi-ui run build:prod`.
- [inconclusive] `npm run verify:release` ran `npm run check` and `npm run check:prod-safety` successfully, then failed because plain `mvn` is not available on local PATH. Do not claim release verification passed until the script itself passes.
- No customer runtime code, sales-order runtime code, customer fund model code, migration/idempotency registry, or business database table structure was changed.

## 2026-06-26 - governance/customer context

- Change: `ai/changes/CR-20260625T170213Z-customer-fund-vocabulary-source-cleanup`.
- R-03 cleaned current customer fund vocabulary sources so active context uses only `CUSTOMER_DEPOSIT` for 客户级定金 and `SAMPLE_REBATE` for 样品返现.
- Documented that current customer management implements only customer-level deposit incoming funds, while delivery / finance must later define customer-level deposit deduction/refund/adjustment/reversal and sample-rebate deduction.
- Documented that sales-order may show customer-level deposit status during submit but must not directly deduct customer funds.
- Regenerated current context, added scoped RuoYi baseline exception notes for inherited boundary/component checker findings, and kept historical old-vocabulary evidence unchanged.
- [local] Verification passed: `npm run scan:all`, `npm run check:high-risk-governance` with the expected non-blocking customer baseline DDL warning, `npm test` with 185 tests, `npm run check` with 185 tests, and `git diff --check`.
- No customer runtime code, sales-order runtime code, production safety config, Java/Vue customer fund runtime code, migration/idempotency registry, or business database table structure was changed.

## 2026-06-26 - governance/runtime verification boundary

- Change: `ai/changes/CR-20260626T004832Z-governance-runtime-verification-boundary`.
- R-04 clarified that `npm run check` verifies governance consistency, registries, graphs, memory, handoff, component/boundary rules, high-risk framework schemas, and Node structural tests.
- Documented that `npm run check` does not prove production readiness, runtime business correctness, database migration safety, browser acceptance, money-flow idempotency, or complete high-risk semantic coverage.
- Added `docs/runtime-verification-boundary.md` and synchronized README, production readiness docs, high-risk semantic governance docs, current context, handover, project state, task memory, and the module registry description.
- Documented that `check:runtime` detects runtime projects/tooling but does not execute Maven/Vite builds by default, and that `scaffold-ci` pass is not manual business acceptance.
- `npm run verify:release` was not required for this R-04 boundary batch; do not claim release verification passed until that script itself passes.
- No customer runtime code, sales-order runtime code, production safety config, customer fund model, migration/idempotency registry, database business table structure, package scripts, tools, or tests were changed.

## 2026-06-26 - governance/rule-change

- Change: `ai/changes/CR-20260626T013800Z-high-risk-active-impact-scope`.
- Fixed the high-risk governance repo-level customer runtime diff guard so it reads the active change record impact scope instead of hardcoding a blanket customer runtime ban.
- `impact.forbiddenEditRoots` overrides `impact.allowedEditRoots`, so explicitly forbidden customer/API/SQL roots remain blocked even when related runtime roots are allowed.
- R-05 salesman candidate hardening was saved to `stash@{0}` before this rule-change CR and was not submitted here.
- [local] Verification passed: `node --test tests/high-risk-governance.test.js` with 37 tests, `npm test` with 186 tests, full `npm run check` with 186 tests inside the gate, and `git diff --check`.
- No customer runtime code, sales-order runtime code, customer fund model, migration/idempotency registry, database business table structure, package scripts, or tools were changed.

## 2026-06-26 - customer runtime hardening

- Change: `ai/changes/CR-20260626T011624Z-salesman-candidate-hardening`.
- R-05 hardened customer salesman candidates so `/business/customer/salesmen` returns only normal users with sales/business roles and does not fall back to all normal users when no roles match.
- The customer UI now prompts `未找到销售/业务员角色用户，请先配置销售角色。` when entering SALESMAN owner selection or submitting without configured candidates, while remote search input does not warn on every keystroke.
- Updated `features/customer.md`, `ai/contracts/customer.api.md`, `ai/contracts/customer.ui.md`, and `tests/customer-risk-gate.test.js` to document and enforce the no-fallback rule.
- The prerequisite governance fix `CR-20260626T013800Z-high-risk-active-impact-scope` was committed first, so high-risk governance now respects active impact allowed/forbidden roots.
- [local] Verification passed: `npm run resume`, `npm run impact -- 客户管理`, `npm run scan:all`, `node --test tests/customer-risk-gate.test.js` with 11 tests, `node --test tests/high-risk-governance.test.js` with 37 tests, `npm test` with 189 tests, `npm run check`, `git diff --check`, and configured Maven compile with `BUILD SUCCESS`.
- [not-run] Plain `mvn -pl ruoyi-admin -am -DskipTests compile` is unavailable on PATH.
- No customer funds, sales-order runtime, security config, migration/idempotency registry, package/tool code, SQL ownership, mapper XML, controller, API client, or database business table structure was changed.

## 2026-06-26 - customer migration baseline

- Change: `ai/changes/CR-20260626T115131Z-executable-customer-migration-baseline`.
- R-06 added executable customer SQL baselines for schema, PUBLIC seed rows, RuoYi menu/permissions, and runtime validation.
- `ai/registry/migration-registry.json` now registers `customer-schema-baseline`, `customer-public-seed-baseline`, `customer-menu-permission-baseline`, and `customer-runtime-validation` as blocking entries with existing `.sql` files, rollback plans, and verification notes.
- The previous customer markdown baseline warning is no longer a current expected high-risk governance warning; `sql/customer.ownership.md` remains the ownership document.
- [local] Verification passed: `npm run resume`, `npm run impact -- customer`, `npm run check:high-risk-governance`, `node --test tests/high-risk-governance.test.js` with 39 tests, `npm run scan:all`, `npm run context:build -- customer`, `npm test` with 191 tests, `npm run check` with 191 tests, and `git diff --check`.
- [not-run] MySQL execution of the new SQL files was not performed in this environment.
- No customer Java/Vue runtime, sales-order runtime, security config, customer fund runtime code, idempotency registry, `idempotent_request`, package scripts, tools, or non-customer business tables were changed.
- Feature: `customer`.

## 2026-06-26 - customer fund idempotency

- Change: `ai/changes/CR-20260626T124443Z-customer-fund-idempotency`.
- R-07 adds mandatory `idempotentKey` handling to `POST /business/customer/{customerId}/fund/deposit` and `POST /business/customer/{customerId}/sample-rebate`.
- Added platform-level `idempotent_request` migration with unique key `(biz_type, idempotent_key)` and `PROCESSING` / `SUCCESS` / `FAILED` status vocabulary.
- Added common idempotency service/mapper support, canonical request hashing, same-key/same-hash success replay, same-key processing rejection, and same-key/different-hash conflict rejection.
- Added customer page hidden stable `idempotentKey` generation for deposit and sample-rebate dialog submit payloads; `ruoyi-ui/src/api/customer.js` and API paths remain unchanged.
- Updated idempotency and migration registries, customer API/DB contracts, feature brief, API catalog, generated DB scan, current context, handoff memory, and customer/high-risk governance tests.
- [local] Verification passed: `npm run resume`, frontend `idempotentKey` precheck commands, `npm run impact -- 客户管理`, `npm run scan:all`, `npm run context:build -- customer`, `node --test tests/customer-risk-gate.test.js` with 15 tests, `npm --prefix ruoyi-ui run build:prod`, `npm run check:high-risk-governance`, `node --test tests/high-risk-governance.test.js` with 40 tests, `npm test` with 196 tests, `npm run check` with 196/196 Node tests, `git diff --check`, and configured Maven compile with `BUILD SUCCESS`.
- [not-run] Plain `mvn -pl ruoyi-admin -am -DskipTests compile` is unavailable on PATH.
- [not-run] MySQL execution of `sql/migrations/V20260625_004_idempotent_request.sql` and `sql/validation/customer_runtime_validation.sql` was not performed in this environment.
- No sales-order runtime, production safety config, package/tools, old three-account fund model, deduction/refund/adjustment/reversal runtime, or non-`idempotent_request` database table was changed.
- Feature: `customer`.

## 2026-06-26 - customer runtime tests

- Change: `ai/changes/CR-20260626T145150Z-customer-runtime-tests`.
- R-08 adds Java runtime tests for customer deposit/sample-rebate idempotency, `idempotent_request` conflict/replay behavior, PUBLIC customer fund-entry rejection, CUSTOMER_DEPOSIT/DEPOSIT_IN enforcement, SAMPLE_REBATE_GENERATE stamping, and salesman candidate no-fallback behavior.
- Added an opt-in `integration-test` Maven profile for MySQL/Testcontainers concurrent deposit and uniqueness verification.
- Updated customer/high-risk governance tests, idempotency and migration registries, customer feature docs/contracts, context, and memory to record runtime-test ownership.
- [local] Verification passed: `npm run resume`, `npm run impact -- 客户管理`, `npm run scan:all`, `node --test tests/customer-risk-gate.test.js` with 16 tests, `npm run check:high-risk-governance`, `node --test tests/high-risk-governance.test.js` with 40 tests, `npm test` with 197 tests, configured Maven `ruoyi-business` unit tests with 19 tests, configured Maven `ruoyi-business -Pintegration-test verify` with `CustomerFundMySqlIT` 1 test, configured Maven `ruoyi-admin -am -DskipTests compile`, `npm run check` with 197 tests, and `git diff --check`.
- [not-run] Plain `mvn` is unavailable on PATH; configured Maven path passed.
- No customer runtime behavior, sales-order runtime, production safety config, package scripts, tools, old three-account fund model, deduction/refund/adjustment/reversal runtime, production config, or database business table structure was changed.
- Feature: `customer`.

## 2026-06-27 - rule-change
- Change: `ai/changes/CR-20260627T101649Z-r-09a-business-rule-object-governance-core`.
- R-09A added the business rule-object governance kernel: contract, schema, registry, checker, preflight report, tests, and package script wiring.
- Registered `customer-fund-deposit-entry`, `customer-sample-rebate-generation`, `public-customer-invariant`, and `before-sales-order-phase-gate`.
- Strengthened existing `check:phase-gate` detection for sales-order runtime naming variants plus SQL/Vue/API/menu/permission content. No parallel `check:sales-order-gate` was created.
- [local] Verification passed: `npm run resume`, `npm run rule:preflight`, `npm run scan:all`, `npm run check:rule-objects`, focused Node tests 6/6 and 17/17, `npm test` with 204 tests, `npm run check` with 204 tests, and `git diff --check`.
- [local] Existing `check:config-safety` development/default warnings remained warning-only.
- No customer runtime code, sales-order runtime artifact, database business table structure, product/field/formula/tech/material registry family, or parallel sales-order gate was created.
- Feature: `platform`.

## 2026-06-27 - rule-change

- Change: `ai/changes/CR-20260627T120650Z-r-09a-1-governance-false-green-hardening`.
- R-09A.1 hardened false-green governance paths in `check:diff`, `check:phase-gate`, `scan:permissions`, `check:ownership`, `rule:preflight`, and `check:rule-objects`.
- `check:diff` now fails forbidden roots and allowed/forbidden overlaps before allowed roots can mask the violation.
- `beforeSalesOrder` remains blocked and now covers sales-order bypasses in RuoYi system/generator/quartz/admin SQL/router/permission/store paths.
- `business:customer:*` permissions now scan to `customer`; feature permissions must exist in generated permission scan output.
- Empty rule-change preflight is audit-only; closeout evidence must pass explicit rule object ids.
- Rule objects now require existing created/updated change records and owned-file ownership or explicit exception reasons.
- [local] Verification passed: explicit rule preflight passed, `npm run scan:all` passed, `npm run check:diff` passed, `npm run check:phase-gate` passed, `npm run check:rule-objects` passed, focused governance tests passed 35/35, baseline guard tests passed 19/19, standalone `npm test` passed 213/213, final `npm run check` passed with final `npm test` 213/213, and final `git diff --check` passed.
- No customer runtime code, customer fund business logic, sales-order runtime artifact, sales-order SQL/table/route/menu/permission, or customer business database structure was created or modified.
- Feature: `platform`.

## 2026-06-27 - governance/customer-permission

- Change: `ai/changes/CR-20260627T133559Z-r-09a-2-customer-high-risk-permission-granularit`.
- R-09A.2 split customer fund high-risk permissions into dedicated deposit and sample-rebate permissions
- Feature: `customer`.

## 2026-06-27 - governance/graph-validation-cleanup

- Change: `ai/changes/CR-20260627-r-09a-3-governance-graph-validation-cleanup`.
- R-09A.3 split customer runtime validation SQL from platform idempotency runtime validation and added validation migration `dependsOn` chain checks.
- Moved `idempotent_request` table and SQL validation ownership to the `platform` feature while keeping customer idempotency entries as endpoint usage of the platform capability.
- Rebuilt UI graph ownership from real frontend route/view files only; fake API-derived UI screens are no longer generated or accepted.
- Extended component scanning to record Vue template global component tags such as `right-toolbar`, `pagination`, and `svg-icon`.
- Added backend annotation permission extraction to generated backend routes and API graph permission/risk-domain checks for high-risk customer fund endpoints.
- [local] Verification passed: rule preflight, scan/build graph, graph/high-risk/component/similarity/ownership checks, focused tests, full `npm test` with 222 tests, final `npm run check`, and final `git diff --check`.
- [not-run] Backend runtime API calls, browser validation, Maven compile, frontend production build, database migration execution, and CI were not run for this governance graph/validation cleanup.
- No `CustomerFundServiceImpl`, `CustomerServiceImpl`, customer fund business behavior, production config, CI workflow, or sales-order runtime artifact was modified.
- Feature: `platform`.

## 2026-06-27 - governance/anti-false-green

- Change: `ai/changes/CR-20260627T154818Z-r-09a-4-anti-false-green-minimum-closure`.
- R-09A.4 adds the anti-false-green regression matrix, matrix checker, package script anti-theater tests, and four-light evidence rule.
- [local] Verification passed: `npm run check:false-green-matrix`, `node --test tests/false-green-matrix-checker.test.js` with 8 tests, `node --test tests/package-scripts.test.js` with 11 tests, `npm run resume`, `npm run scan:all`, `npm run context:build -- customer`, `npm run finalize:change`, `npm run check:components`, component focused tests 13/13, `npm run check:boundaries`, boundary focused tests 9/9, full `npm run check` with 233/233 Node tests, and `git diff --check`.
- [local] Current-CR component and boundary exceptions preserve the R-09A.3 exact-path handling for inherited RuoYi system/tool/generator findings without changing checker implementations.
- [not-run] GitHub Actions, `verify:release`, backend runtime API calls, browser acceptance, DB migration execution, Maven compile, and frontend production build were not run for this governance-only batch.
- No sales-order runtime, customer runtime business logic, `CustomerFundServiceImpl`, `CustomerServiceImpl`, `.github/workflows`, or production config was modified.
- Feature: `platform`.## 2026-06-28 — add-feature
- Change: `ai/changes/CR-20260628-r-10b-masterdata-mvp-runtime`.
- Updated change record, registry, graph, generated scans, memory, and handover.
- Feature: `masterdata`.

## 2026-06-28 - runtime-acceptance

- Change: `ai/changes/CR-20260628-r-10b-masterdata-mvp-runtime`.
- R-10C executed masterdata SQL migrations and validation SQL on local database `my_ry_vue_runtime`.
- Backend acceptance ran on `http://localhost:18080` with Redis DB `1`; frontend acceptance ran on `http://127.0.0.1:5173`.
- API acceptance passed for all nine masterdata resources: list, add, detail, edit, changeStatus, options, logical delete, deleted-list/detail behavior, required code/name, trim, uniqueness, and dependency validation.
- Browser acceptance passed on the accepted canonical RuoYi dynamic menu route `/business/masterdata`: nine tabs visible, each tab displayed a list/table surface, product category add/edit/disable/delete worked, and no forbidden future-runtime entry text appeared.
- Direct `/masterdata` returned RuoYi 404 and is recorded as non-canonical; no R-10D is opened for this route behavior.
- No sales-order, field-scheme, formula, technical-decomposition, inventory, BOM, production, scan, drawing, shipment, finance, or receipt runtime was created.
- Feature: `masterdata`.
