# Request

功能迭代：客户管理

本轮只修正和校验客户管理问题，不新增销售订单、发货、财务、对账、生产或提成模块。

重点问题：

- P0-1：回归验证归属变更链路，确认 `ASSIGN_MAINTENANCE`、`MARK_SALESMAN_SELF`、`RETURN_FACTORY` 能更新客户当前归属和日志。
- P0-2：收紧 `/business/customer/{customerId}/fund/deposit`，该接口只允许入金：空 `flowType` 或 `DEPOSIT_IN`；拒绝 `DEPOSIT_DEDUCT`、`DEPOSIT_REFUND`、`DEPOSIT_ADJUST`、`DEPOSIT_REVERSE`。
- P0-3：继续收口 PUBLIC 公共客户固定分类口径；普通新增/编辑入口不能新增或修改 PUBLIC，运行库如有历史 PUBLIC 验证行必须如实记录并给出清理/重建 SQL。
- P1-1：保留编辑 REAL 客户时默认勾选同步到默认联系人/默认收货地址，用户取消后后端不得同步。
- P1-2：手机号校验增加 trim 口径，REAL 主手机号、联系人电话、收货地址联系电话保存前 trim；重复提醒不对明显非法手机号做电话重复查询。
- P1-3：同步 `ruoyi-ui/src/api/customer.contract.md`，让 API client 合同匹配 `ruoyi-ui/src/api/customer.js` 的真实导出。
