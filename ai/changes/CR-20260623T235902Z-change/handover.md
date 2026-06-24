# Handover

## Summary

`CR-20260623T235902Z-change`收口 PUBLIC 公共客户口径：PUBLIC 固定为系统内置分类客户，不再从普通新增/编辑入口维护，不展示真实客户的客户类型/客户等级口径，并由后端拒绝普通 API 对 PUBLIC 的新增、编辑、删除、停用和归属变更。

## Impact

This change affects the customer add/edit/list/detail UI, customer service save/status/delete/owner-change protection, customer mapper uniqueness support, customer SQL ownership documentation, customer API/UI/DB contracts, API catalog, registry metadata, generated scans, and project memory. The submission-gate fix also adds current-change scoped exceptions for pre-existing RuoYi platform `system/tool/generator` files that are not customer-owned and were not introduced by this change.

## Business Rules

- PUBLIC 公共客户只保留两个内置分类客户：`PUB_DIRECT_SALE / 厂内自销客户 / DIRECT_SALE`、`PUB_SELF_MEDIA / 自媒体客户 / SELF_MEDIA`。
- PUBLIC 不代表真实买家，不维护客户类型、客户等级、联系人、电话、地址、固定归属、客户级定金、样品政策或样品返现。
- PUBLIC 的 `customerType=OTHER`、`customerLevel=NORMAL` 仅为技术兼容值；前端显示为`系统分类`和`-`。
- REAL 真实客户原有必填、红星、11 位手机号校验、厂内/业务员归属、`CUSTOMER_DEPOSIT` 和 `SAMPLE_REBATE` 资金模型保持不变。
- 展厅、抖音、快手、视频号、具体账号、接待业务员和真实买家信息仍属于后续销售订单来源/快照字段，本次不开发。

## Changed Files

本轮业务修改集中在：

- `ruoyi-ui/src/views/customer/index.vue`
- `ruoyi-ui/src/api/customer.js`
- `ruoyi-business/src/main/java/com/ruoyi/business/customer/service/impl/CustomerServiceImpl.java`
- `ruoyi-business/src/main/java/com/ruoyi/business/customer/mapper/CustomerMapper.java`
- `ruoyi-business/src/main/resources/mapper/customer/CustomerMapper.xml`
- `features/customer.md`
- `sql/customer.ownership.md`
- `ai/contracts/customer.api.md`
- `ai/contracts/customer.db.md`
- `ai/contracts/customer.ui.md`
- `memory/API_CATALOG.md`
- `ai/registry/features.json`
- change record, handover, changelog, task, and session memory files

`changed-files.json` also lists earlier uncommitted customer CR directories (`CR-20260623T134224Z-change`, `CR-20260623T144532Z-change`, `CR-20260623T155049Z-change`) because they remain in the working tree. They were not reverted.

## Verification

- Cached Maven backend compile passed.
- Frontend production build passed.
- `npm run scan:all` passed.
- `npm run finalize:change -- --summary "客户管理公共客户固定分类口径收口"` passed.
- Cached Maven package passed and the new jar was used for direct API validation on `http://localhost:18080`.
- Runtime API validation confirmed PUBLIC create/edit/status/delete/owner-change rejections and reserved public-code rejection for REAL.
- Captcha was restored after runtime API validation; `/captchaImage` returned `captchaEnabled=true`.
- `npm run check:components`, `node --test tests/component-checker.test.js`, `node --test tests/boundary-lint.test.js`, and `npm run check:boundaries` passed after adding exact current-change exceptions for the pre-existing RuoYi platform files.
- `npm run check` passed.
- `npm test` passed with 97 tests.
- `git diff --check` passed.

## Gate Status

- The gate failure was fixed with current-change scoped exception files only:
  - `ai/changes/CR-20260623T235902Z-change/component-exception.md`
  - `ai/changes/CR-20260623T235902Z-change/boundary-exception.md`
- No scanner, rule, profile, sales-order, delivery, finance, channel, showroom, account, performance, or commission files were changed to work around the failure.

## Risks

- The local runtime database still contains older PUBLIC validation rows from previous iterations. The final SQL ownership now defines only two seed PUBLIC rows plus `uk_customer_public_channel`, but the local development database needs rebuild or cleanup before it proves that exact data invariant.
- Browser-click validation was not rerun for this closeout; UI behavior was checked by code inspection plus successful production build.

## Next Actions

- Rebuild or clean the development customer tables from `sql/customer.ownership.md` if the next task needs runtime proof that only `PUB_DIRECT_SALE` and `PUB_SELF_MEDIA` exist as PUBLIC rows.
- Resolve or explicitly exempt the existing RuoYi `system/tool` governance baseline as a separate non-customer change, then rerun `npm run check` and `npm test`.
