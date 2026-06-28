# Masterdata Option Schema Contract

Change: `R-09 configurable modeling contract package`
Status: contract-only.

## Purpose

选项方案定义字段如何加载可选值。

## Hard Rules

- 选择型字段必须通过选项方案取值。
- 选项方案必须有版本。
- 已发布且被使用的选项方案不能原地覆盖修改。
- 新变化必须复制成新版本。

## Future Conceptual Fields

- schema code
- schema version
- option categories
- sort rules
- default value rules
- publish status

## Snapshot Rule

未来订单必须保存选项方案 code/version 和选中项 code/label 快照。
