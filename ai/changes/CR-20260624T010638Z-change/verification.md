# Verification

Status: passed.

## Commands Run

- `npm run resume`: passed.
- `npm run ai:do -- "功能迭代：客户管理"`: passed and opened `CR-20260624T010638Z-change`.
- `npm run impact -- 客户管理`: passed; no blockers.
- `git diff --check`: passed before finalize.
- Cached Maven compile: `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests compile`: passed.
- `npm --prefix ruoyi-ui run build:prod`: passed.
- Initial cached Maven package failed because the previous MY backend process held `ruoyi-admin/target/ruoyi-admin.jar`; after stopping only that MY backend process, cached Maven package passed.
- Runtime backend restart on `http://localhost:18080`: passed.
- Runtime API/DB validation: passed for the customer cases recorded in `runtime-validation.md`.
- Captcha restore check: `/captchaImage` returned `captchaEnabled=true`.
- `npm run scan:all`: passed.
- `npm run finalize:change -- --summary "客户管理资金入金与公共客户口径校验收口"`: passed.
- `npm run check`: passed, including 97 Node tests.
- Standalone `npm test`: passed with 97 Node tests.
- Final `git diff --check`: passed.
- `node --test tests/customer-risk-gate.test.js`: passed with 5 tests. This test-backed gate verifies deposit-in-only `/fund/deposit`, customer API contract/export parity, edit-sync user-requirement docs, and fixed PUBLIC seed invariants.
- `npm run scan:all`: passed after adding the risk gate.
- `npm run finalize:change -- --summary "客户管理风险防复发门禁"`: passed.
- `git diff --check`: passed after adding the risk gate.
- `npm run check`: passed after adding the risk gate, including 102 Node tests.
- Standalone `npm test`: passed after adding the risk gate with 102 Node tests.
- Final `git diff --check`: passed after standalone tests.
- Local development DB cleanup for `my_ry_vue_runtime`: passed. Pre-clean PUBLIC count was 8, backups were created with suffix `20260624_211203`, 6 non-seed PUBLIC rows were deleted, and post-clean PUBLIC count is 2.
- Post-clean SQL invariant check: passed. Non-seed PUBLIC count is 0, duplicate `public_channel` count is 0, both seed rows match expected values, and PUBLIC child dirty counts are all 0.
- Post-clean runtime API validation: passed. PUBLIC create, seed edit, seed status change, seed delete, and owner transfer were all rejected. Captcha was restored to `true` in `sys_config` and Redis DB0/DB1.

## Runtime Evidence

See `runtime-validation.md` for the detailed API and DB evidence.

Highlights:

- `/business/customer/{customerId}/fund/deposit` accepts omitted `flowType` and `DEPOSIT_IN` only.
- `DEPOSIT_DEDUCT`, `DEPOSIT_REFUND`, `DEPOSIT_ADJUST`, and `DEPOSIT_REVERSE` are rejected with `定金录入接口只允许入金，扣减、退款、调整、冲正请走独立资金处理流程。`
- Invalid deposit-flow attempts did not change the customer deposit balance.
- Fund DB evidence for validation customer `22` shows `CUSTOMER_DEPOSIT`, `DEPOSIT_IN`, and `CUSTOMER_DEPOSIT_BATCH` only.
- REAL phone values are trimmed before save; invalid master and child phones are rejected.
- Duplicate-warning ignores obvious invalid mobile phone input for phone duplicate lookup.
- Owner change succeeded for assign-maintenance and return-factory; owner-log ordering was stabilized with `change_time desc, log_id desc`.
- Built-in public customer deposit entry remains rejected.

## Runtime Data Cleanup

The local development database `my_ry_vue_runtime` has been cleaned for the fixed PUBLIC model.

- Pre-clean PUBLIC count: `8`.
- Deleted non-seed PUBLIC customer codes: `KH202606000002`, `KH202606000004`, `KH202606000006`, `KH202606000008`, `KH202606000013`, `KH202606000018`.
- Backup suffix: `20260624_211203`.
- Post-clean PUBLIC count: `2`.
- Post-clean non-seed PUBLIC count: `0`.
- Post-clean duplicate `public_channel` count: `0`.
- PUBLIC child dirty counts: `0` across contacts, addresses, fund accounts, fund flows, deposit batches, sample policies, sample rebate records, and owner logs.

## Final Gate

The project governance gate and standalone test suite passed after the risk-gate addition. `npm run check` includes the new customer risk gate through the existing `npm test` command.
