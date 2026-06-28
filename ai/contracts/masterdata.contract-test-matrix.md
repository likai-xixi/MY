# Masterdata Contract Test Matrix

Change: `R-09 configurable modeling contract package`
Status: contract-only.

## Purpose

本矩阵记录 R-09 合同必须被后续测试和门禁覆盖的点。

| Contract Area | Must Hold | Future Evidence |
|---|---|---|
| Product | 产品分类、系列、型号由用户配置 | R-10 masterdata tests |
| Material | 材料和配件由用户配置 | R-10 material tests |
| Sales Option | 单开、对开、拉手、锁具等由配置提供 | R-10 option tests |
| Sales Process | 销售配置工艺决定字段方案 | R-11 process-field tests |
| Field Library | 字段是可配置定义，非固定订单列 | R-11 field tests |
| Field Scheme | 不同产品/工艺加载不同字段方案 | R-11 scheme tests |
| Versioning | 已发布且被使用版本不能原地覆盖 | R-11/R-12 version tests |
| Formula | 公式变量和公式组版本化 | R-12 rule tests |
| Glass/Offset | 玻璃规则和偏花规则版本化 | R-12 rule tests |
| Decomposition | 技术阶段按模板生成零件 | R-13 template tests |
| Snapshot | 订单和技术结果保存快照 | R-14/R-16 snapshot tests |
| Boundary | R-09 不创建 runtime、SQL、sales-order、customer/idempotency/security/package/tools 修改 | R-09 verification |

## R-09 Current Evidence

R-09 只创建合同文件和变更记录。本矩阵不声称 runtime tests 已存在。
