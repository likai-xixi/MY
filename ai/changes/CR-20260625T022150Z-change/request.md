# Request

功能迭代：客户管理

目标：收口客户资金入口安全。不要开发销售订单，不提交、不推送。

问题：`/business/customer/{customerId}/fund/deposit` 是“录入定金”接口，必须只能写 `CUSTOMER_DEPOSIT`。

要求：

- 禁止通过请求体 `accountType=SAMPLE_REBATE` 或其他非 `CUSTOMER_DEPOSIT` 值写入样品返现账户。
- 样品返现只能通过 `/business/customer/{customerId}/sample-rebate` 创建 `sample_rebate_record` 后由内部服务写 `SAMPLE_REBATE` 流水。
- 修改后端服务，确保外部定金接口只允许 `CUSTOMER_DEPOSIT`。
- 增加测试覆盖默认、显式 `CUSTOMER_DEPOSIT`、`SAMPLE_REBATE` 拒绝、其他 `accountType` 拒绝，以及拒绝发生在账户余额/流水变更前。
- 更新 customer feature、API contract、API catalog、change record、handover 和 verification。

限制：

- 不开发销售订单。
- 不修改治理规则。
- 不降低现有门禁。
- 不提交、不推送。
