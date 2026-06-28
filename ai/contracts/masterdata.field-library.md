# Masterdata Field Library Contract

Change: `R-09 configurable modeling contract package`
Status: contract-only.

## Purpose

字段库是未来销售订单和技术审核字段的配置来源。

## Hard Rules

- `总高`, `总宽`, `门高`, `方向`, `锁具`, `拉手`, `颜色`, `门面材料`, `门框材料`, `孔高`, `孔宽`, `玻璃类型`, `玻璃位置`, `前折高`, `后折高`, `中气宽度`, `边气宽度`, `图纸附件`, `特殊要求` 可以是系统预置字段。
- 预置字段也必须作为可配置字段定义保存。
- 字段库可以系统预置，但字段定义本身不能写死在 Java、Vue、SQL、package script、tools 或 scanner exception 中。
- 用户可以复制、停用、改显示名称，并把字段组合到不同字段方案。
- 字段 code 稳定，字段 label 可以变化。

## Field Scheme Rules

- 不同产品、不同销售配置工艺显示哪些字段，必须由字段方案配置。
- 字段方案必须至少具备 stable code、version、status 和字段排序/必填/可见性/默认值/校验规则。
- 已发布并被订单或技术结果使用的字段方案不能原地覆盖修改；变化必须复制成新版本。
- 字段方案可以预置，但预置方案仍然是配置数据。
- 不新增 `masterdata.field-scheme.md`；R-09 先把字段方案口径记录在 `masterdata.field-library.md`、`masterdata.option-schema.md`、`masterdata.snapshot-versioning.md` 和 `masterdata.contract-test-matrix.md`。

## Field Scheme Examples

- 玻璃拼接门字段方案：总宽、总高、玻璃类型、玻璃位置、拉手、锁具、颜色。
- 发光门匾字段方案：宽、高、文字内容、字体、发光方式、灯光颜色、安装方式。
- 型材栅栏字段方案：总长度、高度、立柱间距、横杆数量、表面处理、颜色。

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

未来订单必须保存字段方案 code、字段方案 version、字段值快照 JSON、字段中文标签快照 JSON、字段单位/校验口径，以及选择型字段的选项 code/label 快照。
