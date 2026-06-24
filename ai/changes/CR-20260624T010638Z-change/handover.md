# Handover

## Summary

`CR-20260624T010638Z-change` tightens customer management runtime behavior without adding new modules.

The customer deposit entry endpoint is now入金-only. REAL customer phone handling now trims phone values before validation/save and avoids duplicate-phone lookup for obviously invalid mobile numbers. PUBLIC customer fixed-classification rules remain in force, and the local development database `my_ry_vue_runtime` has been cleaned so runtime PUBLIC data now contains only `PUB_DIRECT_SALE` and `PUB_SELF_MEDIA`.

This handover also records the customer risk regression gate added during the same open change record: `tests/customer-risk-gate.test.js`.

## Impact

Changed surfaces stay inside the customer impact boundary:

- backend customer service and mapper XML;
- customer page phone normalization;
- API/UI/frontend-client contracts;
- feature brief, SQL ownership, API catalog, memory, and current change record;
- `tests/customer-risk-gate.test.js`, reached through the existing `npm test` script included by `npm run check`.

No sales-order, delivery, finance, reconciliation, production, commission, scanner, rule, profile, or new module code was added.

## Important Code Changes

- `CustomerServiceImpl.recordFundEntry` now resolves customer-deposit flow type as:
  - empty `flowType` -> `DEPOSIT_IN`;
  - `DEPOSIT_IN` -> `DEPOSIT_IN`;
  - `DEPOSIT_DEDUCT`, `DEPOSIT_REFUND`, `DEPOSIT_ADJUST`, `DEPOSIT_REVERSE` -> service error `定金录入接口只允许入金，扣减、退款、调整、冲正请走独立资金处理流程。`
- `CustomerServiceImpl.checkDuplicate` trims phone/name and ignores invalid phone input for phone duplicate lookup.
- `CustomerServiceImpl` trims REAL master/child phone fields before validation and save.
- PUBLIC internal normalization now validates fixed code/name/channel pair if a PUBLIC save path is ever used internally.
- `CustomerMapper.xml` owner logs now sort by `change_time desc, log_id desc` to avoid same-second ordering ambiguity.
- `index.vue` trims master/contact/address phone fields before save and validates with the trimmed value.
- `ruoyi-ui/src/api/customer.contract.md` now matches the actual exports in `customer.js`.
- `tests/customer-risk-gate.test.js` prevents regression of:
  - `/business/customer/{customerId}/fund/deposit` accepting deduction/refund/adjust/reversal flow types;
  - `ruoyi-ui/src/api/customer.contract.md` Client Methods drifting from `ruoyi-ui/src/api/customer.js` exports;
  - docs losing the user requirement that REAL customer edit sync starts checked by default;
  - docs/SQL losing the fixed `PUB_DIRECT_SALE` and `PUB_SELF_MEDIA` PUBLIC invariant.

## Verification

Passed:

- `npm run resume`
- `npm run ai:do -- "功能迭代：客户管理"`
- `npm run impact -- 客户管理`
- cached Maven compile
- `npm --prefix ruoyi-ui run build:prod`
- cached Maven package after stopping the MY backend process that locked the jar
- runtime API/DB validation on `http://localhost:18080`
- captcha restored to true and `/captchaImage` returned `captchaEnabled=true`
- `npm run scan:all`
- `npm run finalize:change -- --summary "客户管理资金入金与公共客户口径校验收口"`
- `npm run check`
- `npm test`
- `git diff --check`
- `node --test tests/customer-risk-gate.test.js`
- `npm run scan:all`
- `npm run finalize:change -- --summary "客户管理风险防复发门禁"`
- `git diff --check` after the risk-gate update
- `npm run check` after the risk-gate update, including 102 Node tests
- standalone `npm test` after the risk-gate update, with 102 Node tests
- final `git diff --check` after standalone tests
- local development DB PUBLIC cleanup for `my_ry_vue_runtime`: pre-clean PUBLIC count `8`, backup suffix `20260624_211203`, 6 non-seed PUBLIC rows deleted, post-clean PUBLIC count `2`
- post-clean SQL invariant checks: non-seed PUBLIC count `0`, duplicate `public_channel` count `0`, both seed rows `MATCH`, all PUBLIC child dirty counts `0`
- post-clean runtime API validation: PUBLIC create, seed edit, seed status change, seed delete, and owner transfer all rejected; captcha restored to `true` in `sys_config` and Redis DB0/DB1

Runtime validation details are in `runtime-validation.md`.

## Risks

- The local runtime database has been cleaned for the PUBLIC seed invariant as of 2026-06-24. Future manual DB writes or validation scripts can still introduce drift, so rerun the SQL invariant checks before relying on runtime PUBLIC data cleanliness.
- This iteration did not add deduction/refund/adjust/reversal business flows; those remain future dedicated fund-processing work.
- There is no standalone `check:customer-risk` package script in this customer update CR because `package.json` is a protected governance file. The equivalent gate is `tests/customer-risk-gate.test.js` under the existing `npm test` script, which `npm run check` already executes.

## Next Actions

- Commit and push only if the user explicitly asks.
- Before any future runtime claim about PUBLIC rows, rerun the SQL invariant checks in `sql/customer.ownership.md`.
