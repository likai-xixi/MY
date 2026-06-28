# Masterdata Permission Contract

Change: `R-09 configurable modeling contract package`
Status: contract-only.

## Purpose

本合同定义未来配置底座的权限边界。

## Permission Groups For Future Runtime

- product master data view/edit/publish/archive
- material master data view/edit/publish/archive
- sales option view/edit/publish/archive
- field library view/edit/publish/archive
- field scheme view/edit/publish/archive
- formula and rule view/edit/test/publish/archive
- decomposition template view/edit/publish/archive

## Hard Rules

- 编辑草稿和发布版本必须分权。
- 停用、归档、复制新版本必须记录操作人和原因。
- 已发布版本被订单或技术结果使用后，普通编辑不能覆盖它。
- R-09 不创建任何 permission code、menu SQL、controller annotation 或 frontend permission check。

## Future Review Requirement

R-10 到 R-13 创建 runtime 时，必须补权限矩阵和测试映射。
