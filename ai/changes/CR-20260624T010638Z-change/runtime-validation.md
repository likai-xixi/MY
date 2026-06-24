# Runtime Validation

Date: 2026-06-24

Scope: customer management only. No sales-order, delivery, finance, reconciliation, production, or commission module code was added.

## Environment

- Backend package: `ruoyi-admin/target/ruoyi-admin.jar`
- Backend runtime: `http://localhost:18080`
- Database: `my_ry_vue_runtime`
- Redis database: `1`

The backend was restarted with this change's package for API validation. Captcha was temporarily disabled through `sys_config` for API login, then restored to `true`; `/captchaImage` returned `captchaEnabled=true` after the restore.

## API Evidence

Created REAL validation customer: `customerId=22`.

- REAL create accepted `contactPhone`, `contacts[].phone`, and `addresses[].receiverPhone` with surrounding spaces and saved them trimmed:
  - master phone: `18509163669`
  - child contact phone: `18609163669`
  - receiver phone: `18709163669`
- REAL create with master phone `1856584` was rejected with `联系电话必须为11位手机号`.
- REAL create with `contacts[0].phone=1856584` was rejected with `第1个联系人电话必须为11位手机号`.
- `GET /business/customer/duplicate-warning?contactPhone=1856584` returned `phoneDuplicate=false`, confirming invalid phone input does not participate in phone duplicate lookup.
- `POST /business/customer/22/fund/deposit` with omitted `flowType` succeeded and returned `flowType=DEPOSIT_IN`.
- `POST /business/customer/22/fund/deposit` with `flowType=DEPOSIT_IN` succeeded and returned `flowType=DEPOSIT_IN`.
- `POST /business/customer/22/fund/deposit` rejected each of:
  - `DEPOSIT_DEDUCT`
  - `DEPOSIT_REFUND`
  - `DEPOSIT_ADJUST`
  - `DEPOSIT_REVERSE`
- Rejection message for all invalid deposit flow types: `定金录入接口只允许入金，扣减、退款、调整、冲正请走独立资金处理流程。`
- Customer deposit balance stayed `3.33` after the invalid flow attempts, matching the balance after the two valid入金 entries.
- `POST /business/customer/{PUB_DIRECT_SALE}/fund/deposit` was rejected with `公共客户不启用客户级定金，请在销售订单中记录本单定金。`
- Owner change regression:
  - `ASSIGN_MAINTENANCE` updated customer `22` to `SALESMAN / FACTORY_ASSIGNED / MAINTENANCE_FEE`.
  - `RETURN_FACTORY` updated customer `22` back to `FACTORY / FACTORY_POOL / NONE` and cleared `ownerUserId`.
  - `selectOwnerLogsByCustomerId` now orders by `change_time desc, log_id desc`; detail aggregation returned the latest `SALESMAN -> FACTORY` return-factory log first.

## DB Evidence

For `customerId=22`:

- `customer_fund_account` contains `CUSTOMER_DEPOSIT` balance/frozen `3.33` and `SAMPLE_REBATE` zero balance.
- `customer_fund_flow` contains two `CUSTOMER_DEPOSIT` entries, both `flow_type=DEPOSIT_IN`, both related to `CUSTOMER_DEPOSIT_BATCH`.
- `customer_deposit_batch` contains two rows, both `deposit_type=CUSTOMER_DEPOSIT`.

PUBLIC runtime data cleanliness cleanup:

- Target database: local development database `my_ry_vue_runtime`.
- Pre-clean PUBLIC count: `8`.
- Pre-clean non-seed PUBLIC customer codes:
  - `KH202606000002`
  - `KH202606000004`
  - `KH202606000006`
  - `KH202606000008`
  - `KH202606000013`
  - `KH202606000018`
- Backup tables created before cleanup:
  - `customer_public_backup_20260624_211203`
  - `customer_contact_public_backup_20260624_211203`
  - `customer_address_public_backup_20260624_211203`
  - `customer_fund_account_public_backup_20260624_211203`
  - `customer_fund_flow_public_backup_20260624_211203`
  - `customer_deposit_batch_public_backup_20260624_211203`
  - `customer_sample_policy_public_backup_20260624_211203`
  - `sample_rebate_record_public_backup_20260624_211203`
  - `customer_salesman_bind_log_public_backup_20260624_211203`
- Cleanup deleted 6 non-seed PUBLIC customer rows and 1 historical PUBLIC owner log row. PUBLIC contact, address, fund-account, fund-flow, deposit-batch, sample-policy, and sample-rebate child backup counts were all 0 before cleanup.
- Seed normalization left exactly:
  - `PUB_DIRECT_SALE` / `厂内自销客户` / `DIRECT_SALE` / `OTHER` / `NORMAL` / `NONE` / `NONE` / `NONE` / `status=0` / `del_flag=0`
  - `PUB_SELF_MEDIA` / `自媒体客户` / `SELF_MEDIA` / `OTHER` / `NORMAL` / `NONE` / `NONE` / `NONE` / `status=0` / `del_flag=0`
- Post-clean SQL evidence:
  - PUBLIC total = `2`.
  - Non-seed PUBLIC count = `0`.
  - Duplicate `public_channel` count = `0`.
  - `PUB_DIRECT_SALE` invariant status = `MATCH`.
  - `PUB_SELF_MEDIA` invariant status = `MATCH`.
  - PUBLIC child dirty counts = `0` for `customer_contact`, `customer_address`, `customer_fund_account`, `customer_fund_flow`, `customer_deposit_batch`, `customer_sample_policy`, `sample_rebate_record`, and `customer_salesman_bind_log`.

PUBLIC runtime API rejection after cleanup:

- Captcha was temporarily set to `false` for API login, then restored to `true` in both `sys_config` and Redis DB0/DB1.
- `POST /business/customer` with `customerNature=PUBLIC` was rejected with `公共客户由系统初始化，不允许手工新增。`.
- `PUT /business/customer` for `PUB_DIRECT_SALE` was rejected with `内置公共客户不允许在普通客户编辑中修改。`.
- `PUT /business/customer/changeStatus` for `PUB_DIRECT_SALE` was rejected with `内置公共客户不允许停用。`.
- `DELETE /business/customer/1` was rejected with `内置公共客户不允许删除。`.
- `PUT /business/customer/transferOwner` for `PUB_DIRECT_SALE` was rejected with `公共客户不支持归属变更`.

## Result

- P0-1: Passed after adding stable owner-log ordering.
- P0-2: Fixed and runtime-verified.
- P0-3: Service and docs keep the fixed PUBLIC model; local runtime DB has been cleaned and revalidated to exactly the two seed PUBLIC rows.
- P1-1: Preserved by code inspection and contract docs; edit REAL still defaults both sync options to true and user cancellation remains honored by the backend flags.
- P1-2: Fixed and runtime-verified for trim, invalid master phone, invalid child phone, and duplicate-warning invalid phone behavior.
- P1-3: API client contract updated to match actual runtime exports.
