# Rule Process Calculation Contract

Change: `R-09 configurable modeling contract package`
Status: contract-only.

## Purpose

本合同定义未来的工艺计算规则边界。

## Hard Rules

- 工艺计算规则必须来自配置。
- 规则必须有 code 和 version。
- 已发布且被使用的规则不能原地覆盖修改。
- 新变化必须复制成新版本。

## Future Conceptual Fields

- rule code
- rule version
- product range
- field scheme version
- formula group version
- publish status

## Snapshot Rule

未来技术计算必须保存规则 code/version、输入值和输出值。
