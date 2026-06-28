# Masterdata Field Library Contract

Change: `R-09 configurable modeling contract package`
Status: contract-only.

## Purpose

字段库是未来销售订单和技术审核字段的配置来源。

## Hard Rules

- `总高`, `总宽`, `门高`, `方向`, `锁具`, `拉手`, `颜色`, `门面材料`, `门框材料`, `孔高`, `孔宽`, `玻璃类型`, `玻璃位置`, `前折高`, `后折高`, `中气宽度`, `边气宽度`, `图纸附件`, `特殊要求` 可以是系统预置字段。
- 预置字段也必须作为可配置字段定义保存。
- 用户可以复制、停用、改显示名称，并把字段组合到不同字段方案。
- 字段 code 稳定，字段 label 可以变化。

## Future Conceptual Fields

- field code
- display label
- field type
- unit
- required rule
- validation rule
- option schema binding
- default rule
- status

## Snapshot Rule

未来订单必须保存字段值快照和字段中文标签快照。
