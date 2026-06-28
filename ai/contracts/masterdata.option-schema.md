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
- 单开、对开、子母、连体子母、颜色、拉手、锁具、铰链、玻璃、表面处理、包装方式、材料体系等选项必须作为配置项进入选项方案或选项分类。
- 选项方案可以绑定产品分类、系列、型号、销售配置工艺、字段方案和适用条件。
- 选项 scheme/value 不能写死为 Java enum、Vue 固定数组、SQL 固定业务模型或产品专用 API。

## Future Conceptual Fields

- schema code
- schema version
- option categories
- option code/label rows
- applicability conditions
- material/accessory binding
- sort rules
- default value rules
- publish status

## Snapshot Rule

未来订单必须保存选项方案 code/version 和选中项 code/label 快照。
