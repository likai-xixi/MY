# Masterdata Migration Plan Contract

Change: `R-09 configurable modeling contract package`
Status: contract-only.

## Purpose

本合同定义未来配置底座落库前的迁移规划边界。

## Hard Rules

- R-09 不创建 SQL migration。
- R-09 不创建数据库表。
- R-09 不修改 customer 表或 idempotent_request 表。
- 后续 R-10 到 R-13 如需落库，必须分别提供可执行 migration、回滚说明、seed 数据说明和验证 SQL。
- 数据库方向保持当前项目默认 MySQL 口径，除非另有独立批准的迁移方案。

## Future Migration Groups

- product/category/model master data
- material/accessory master data
- sales option and option schema
- field library and field scheme version
- formula variables and formula groups
- calculation rules
- decomposition and part templates
- calculation snapshot storage

## Verification Requirement

未来 runtime CR 必须提供 migration registry、ownership、contract-test matrix 和 runtime validation evidence。
