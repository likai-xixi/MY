# Request

功能迭代：客户管理

本轮做第二批：客户资金并发安全收口。

## Goal

- 修复客户资金账户并发安全风险。
- 只拆出 `CustomerFundService`，不做全量客户服务重构。
- 保留现有外部 API 路径和业务口径不变。
- 不实现销售订单、发货、财务、扣减、退款、调整、冲正。

## Required Runtime Boundary

- `POST /business/customer/{customerId}/fund/deposit` 保持不变，只允许客户级定金入金。
- `/fund/deposit` 接受 omitted 或 explicit `CUSTOMER_DEPOSIT`。
- `/fund/deposit` 接受 omitted 或 explicit `DEPOSIT_IN`。
- `/fund/deposit` 拒绝 `SAMPLE_REBATE`、非 `CUSTOMER_DEPOSIT` accountType，以及 `DEPOSIT_DEDUCT`、`DEPOSIT_REFUND`、`DEPOSIT_ADJUST`、`DEPOSIT_REVERSE`。
- `/sample-rebate` 必须先创建 `sample_rebate_record`，再写内部 `SAMPLE_REBATE / SAMPLE_REBATE_GENERATE` 资金流水，且不得创建 `customer_deposit_batch`。
- PUBLIC 客户不允许客户级定金、样品政策、样品返现。

## Required Implementation

- 新增 `ICustomerFundService`。
- 新增 `CustomerFundServiceImpl`。
- `CustomerFundServiceImpl` 负责资金账户初始化/确保存在、行锁读取、余额计算和更新、资金流水写入、定金批次写入、样品返现资金流写入，以及 `flow_no` / `deposit_batch_no` 唯一键冲突重试。
- 新增 `selectFundAccountForUpdate(customerId, accountType)`，XML 使用 `limit 1 for update`。
- 资金入账必须在 Spring 事务代理调用链内执行，禁止 self-invocation 导致 `@Transactional` 失效。
- 并发账户创建必须捕获 `DuplicateKeyException` 并重新锁行读取。
- `insertFundFlow` 和 `insertDepositBatch` 必须捕获唯一键冲突，重新生成编号并 bounded retry，最大重试建议 8 次。

## Required Evidence

- `npm run resume`
- `npm run context:build -- customer`
- `npm run ai:do -- "功能迭代：客户管理"`
- `npm run impact -- 客户管理`
- `npm run review:feature -- "功能预审：客户管理资金并发安全收口" --feature customer`
- Review decision must contain `Allow Implementation` before business implementation.
- `node --test tests/customer-risk-gate.test.js`
- Maven compile for Java/XML changes.
- `npm run scan:all`
- `npm run finalize:change -- --summary "客户管理资金并发安全收口"`
- `npm run check`
- `npm test`
- `git diff --check`
- Live API/DB concurrency validation if local backend/MySQL/Redis are available; otherwise verification/handover must say live concurrency validation was not completed and why.
