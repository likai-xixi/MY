# Changelog

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
- Verified no legacy `长期定金`, `滚动定金`, `来源订单号`, `LONG_TERM_DEPOSIT`, or `ROLLING_ORDER_DEPOSIT` text remains in the customer scope.
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
- Feature: `platform`.## 2026-06-23 — governance
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
- No sales-order, delivery, finance, deduction, refund, adjustment, reversal, governance-rule, or SQL business table structure change was made. No commit or push has been made.
- Feature: `customer`.
