# Rule Formula Group Contract

Change: `R-09 configurable modeling contract package`
Status: contract-only.

## Purpose

公式组用于把多条公式作为一个版本化规则包管理。

## Hard Rules

- 公式组必须有 code 和 version。
- 已发布并被使用的公式组不能原地覆盖修改。
- 新变化必须复制成新版本。
- 旧订单和旧技术计算继续使用旧版本快照。

## Future Conceptual Fields

- formula group code
- version
- variables
- formulas
- publish status

## Snapshot Rule

未来计算快照必须保存公式组 code/version 和计算结果。
