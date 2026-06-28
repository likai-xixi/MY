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
- R-09 不创建 Java service/controller/mapper/domain。
- R-09 不创建 Vue 页面或 API client。
- R-09 不创建 SQL migration。
- R-09 不修改 customer runtime、idempotency runtime、安全配置、`package.json`、`tools/` 或 `.github/workflows`。

## Roadmap Boundary

- R-10 只做产品/物料/配件/销售选项主数据 MVP。
- R-11 才做销售配置工艺、字段库、字段方案、版本发布 MVP。
- R-12 才做公式变量、公式组、工艺计算规则 MVP。
- R-13 才做技术拆解模板、零件模板、零件计算规则 MVP。
- R-14 才做销售订单合同包。
- R-15 才做销售订单 MVP。
- R-16 才做技术审核和计算快照 MVP。
- R-17 才做图纸任务和文件归档 MVP。

## Snapshot Rule

未来技术审核通过时，必须保存技术版本和计算快照。
