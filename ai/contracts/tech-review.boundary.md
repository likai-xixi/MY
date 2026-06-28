# Tech Review Boundary Contract

Change: `R-09 configurable modeling contract package`
Status: contract-only.

## Purpose

技术审核边界用于区分销售记录和工厂技术拆解。

## Hard Rules

- 销售订单记录客户要什么。
- 技术审核决定工厂怎么做。
- 技术阶段通过技术拆解模板、零件模板、公式组和规则生成零件结果。
- 技术结果必须保存计算快照。
- 技术人员可以在未来流程中人工确认或驳回，但不能破坏快照追溯。

## Boundary

- R-09 不创建销售订单 runtime。
- R-09 不创建技术审核 runtime。
- R-09 不创建图纸任务 runtime。
- R-09 只定义未来边界。

## Snapshot Rule

未来技术审核通过时，必须保存技术版本和计算快照。
