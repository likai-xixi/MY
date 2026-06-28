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
- 零件尺寸、数量、是否生成、损耗/扣量/余量等计算必须通过公式组或版本化规则表达，不能写死在 Java/Vue/SQL 中。
- 公式组可以引用字段值、选项值、材料参数、工艺参数、模板常量和其他公式输出。

## Future Conceptual Fields

- formula group code
- version
- variables
- formulas
- rounding policy
- validation policy
- publish status

## Required Formula Examples

- 主门扇高度 = 总高 - 上框扣量 - 下框扣量 - 缝隙。
- 玻璃高度 = 门扇高度 - 上封高度 - 下封高度 - 压条余量。
- 栅栏立柱数量 = ceil(总长度 / 立柱间距) + 1。

## Snapshot Rule

未来计算快照必须保存公式组 code/version 和计算结果。
