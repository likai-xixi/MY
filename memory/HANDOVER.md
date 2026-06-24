# Handover

## Summary

Current change record: `ai/changes/CR-20260624T010638Z-change`.

`CR-20260624T010638Z-change` tightens customer-management runtime behavior and cleanup evidence without adding new business modules. No commit or push has been performed.

The customer deposit entry endpoint remains deposit-in only, REAL phone values are trimmed before validation/save, invalid duplicate-warning phone lookup is ignored, owner-log ordering is stable for same-second changes, and PUBLIC customers remain fixed to the two built-in classification rows. The local development database `my_ry_vue_runtime` has been cleaned so runtime PUBLIC data now contains only `PUB_DIRECT_SALE` and `PUB_SELF_MEDIA`.

## Impact

Changed surfaces are limited to the customer module, customer contracts/docs, memory/change-record evidence, and one test-backed risk gate:

- backend customer service and mapper XML;
- customer page phone normalization;
- API/UI/frontend-client contracts;
- feature brief, SQL ownership, API catalog, memory, current change record;
- `tests/customer-risk-gate.test.js`, which is reached through the existing `npm test` script included by `npm run check`.

No sales-order, delivery, finance, reconciliation, production, commission, scanner, rule, profile, or new module code was added.

## Changed Files

See `ai/changes/CR-20260624T010638Z-change/changed-files.json` for the full tracked change list.

Key changed files include:

- `ruoyi-business/src/main/java/com/ruoyi/business/customer/service/impl/CustomerServiceImpl.java`
- `ruoyi-business/src/main/resources/mapper/customer/CustomerMapper.xml`
- `ruoyi-ui/src/views/customer/index.vue`
- `ruoyi-ui/src/api/customer.contract.md`
- `features/customer.md`
- `sql/customer.ownership.md`
- `ai/contracts/customer.api.md`
- `ai/contracts/customer.ui.md`
- `memory/API_CATALOG.md`
- `memory/PROJECT_STATE.md`
- `memory/TASKS.json`
- `memory/HANDOVER.md`
- `memory/CHANGELOG.md`
- `memory/sessions/2026-06-24-customer-fund-public-validation-tightening.md`
- `ai/changes/CR-20260624T010638Z-change/runtime-validation.md`
- `ai/changes/CR-20260624T010638Z-change/verification.md`
- `ai/changes/CR-20260624T010638Z-change/handover.md`
- `tests/customer-risk-gate.test.js`

## Commands

- `npm run resume`
- `npm run ai:do -- "功能迭代：客户管理"`
- `npm run impact -- 客户管理`
- cached Maven compile
- `npm --prefix ruoyi-ui run build:prod`
- cached Maven package after stopping the MY backend jar lock
- runtime API/DB validation on `http://localhost:18080`
- `node --test tests/customer-risk-gate.test.js`
- local development DB PUBLIC cleanup SQL against `my_ry_vue_runtime`
- post-clean SQL invariant checks
- post-clean runtime API rejection validation
- `npm run scan:all`
- `npm run finalize:change -- --summary "清理本地开发库历史 PUBLIC 验证数据"`
- `npm run check`
- `npm test`
- `git diff --check`

## Runtime Cleanup

- Target DB: local development database `my_ry_vue_runtime`.
- Pre-clean PUBLIC count: `8`.
- Deleted non-seed PUBLIC customer codes: `KH202606000002`, `KH202606000004`, `KH202606000006`, `KH202606000008`, `KH202606000013`, `KH202606000018`.
- Backup tables were created with suffix `20260624_211203`.
- Post-clean PUBLIC count: `2`.
- Post-clean non-seed PUBLIC count: `0`.
- Post-clean duplicate `public_channel` count: `0`.
- `PUB_DIRECT_SALE` and `PUB_SELF_MEDIA` seed rows matched expected values.
- PUBLIC child dirty counts are `0` across contacts, addresses, fund accounts, fund flows, deposit batches, sample policies, sample rebate records, and owner logs.
- PUBLIC create, seed edit, seed status change, seed delete, and owner transfer are rejected by the runtime API after cleanup.
- Captcha was restored to `true` in `sys_config` and Redis DB0/DB1 after API validation.

## Important Code Changes

- `CustomerServiceImpl.recordFundEntry` accepts only empty `flowType` or `DEPOSIT_IN` for `/business/customer/{customerId}/fund/deposit`.
- `CustomerServiceImpl.checkDuplicate` trims phone/name input and ignores invalid phone values for phone duplicate lookup.
- `CustomerServiceImpl` trims REAL master/child phone fields before validation and save.
- PUBLIC internal normalization validates the fixed code/name/channel pair if a PUBLIC save path is ever used internally.
- `CustomerMapper.xml` owner logs now sort by `change_time desc, log_id desc`.
- `index.vue` trims master/contact/address phone fields before save and validates with the trimmed value.
- `ruoyi-ui/src/api/customer.contract.md` matches the actual exports in `customer.js`.
- `tests/customer-risk-gate.test.js` prevents regression of deposit-in-only fund entry, customer API client contract/export parity, edit-sync user-requirement docs, and fixed PUBLIC seed invariants.

## Verification

Passed before this cleanup update:

- cached Maven compile
- `npm --prefix ruoyi-ui run build:prod`
- cached Maven package after stopping the MY backend jar lock
- runtime API/DB validation on `http://localhost:18080`
- captcha restore check
- `npm run scan:all`
- `npm run finalize:change`
- `npm run check`
- `npm test`
- `git diff --check`
- `node --test tests/customer-risk-gate.test.js`

Passed during this cleanup update:

- pre-clean SQL queries for PUBLIC rows, PUBLIC total, non-seed PUBLIC rows, duplicate channel rows, seed existence, and child-table counts
- backup table creation with suffix `20260624_211203`
- cleanup transaction deleting non-seed PUBLIC rows and PUBLIC child data, then normalizing both seed rows
- post-clean SQL invariant checks
- post-clean runtime API rejection validation
- `npm run scan:all`
- `npm run finalize:change -- --summary "清理本地开发库历史 PUBLIC 验证数据"`

Final `npm run check`, standalone `npm test`, and `git diff --check` still need to be rerun after this handover rewrite.

## Risks

- The local runtime database is clean for the PUBLIC seed invariant as of 2026-06-24. Future manual DB writes or validation scripts can still introduce drift, so rerun the SQL invariant checks before relying on runtime PUBLIC data cleanliness.
- This iteration did not add deduction/refund/adjust/reversal business flows; those remain future dedicated fund-processing work.
- There is no standalone `check:customer-risk` package script because `package.json` is a protected governance file in a customer update CR. The equivalent gate is `tests/customer-risk-gate.test.js` under the existing `npm test` script, which `npm run check` already executes.

## Next Actions

- Run final `npm run check`, `npm test`, and `git diff --check`.
- Commit and push only if the user explicitly asks.
- Before any future runtime claim about PUBLIC rows, rerun the SQL invariant checks in `sql/customer.ownership.md`.
