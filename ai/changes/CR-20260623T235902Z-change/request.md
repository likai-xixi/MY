# Request

功能迭代：客户管理

本次做 PUBLIC 公共客户口径收口：

- PUBLIC 公共客户固定为两个系统内置分类客户：`PUB_DIRECT_SALE` / 厂内自销客户、`PUB_SELF_MEDIA` / 自媒体客户。
- 普通新增客户入口不再允许创建 PUBLIC 公共客户。
- PUBLIC 公共客户不展示/不编辑客户类型、客户等级，后端仅保留 `OTHER` / `NORMAL` 技术兼容值。
- PUBLIC 公共客户不允许普通编辑、删除、停用、归属变更。
- 保持 REAL 真实客户必填、红星、手机号 11 位格式校验、厂内归属/业务员维护口径和 `CUSTOMER_DEPOSIT` / `SAMPLE_REBATE` 资金模型不变。
- 不新增 sales-order、渠道、展厅、账号、业绩或提成模块。
