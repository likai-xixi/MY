# Rule Glass Rule Contract

Change: `R-09 configurable modeling contract package`
Status: contract-only.

## Purpose

本合同定义未来玻璃规则边界。

## Hard Rules

- 玻璃相关内容必须配置化。
- 规则必须有 code 和 version。
- 已发布且被使用的规则不能原地覆盖修改。
- 新变化必须复制成新版本。
- 玻璃类型、玻璃位置、玻璃拼接、整拼、玻璃高度/宽度、压条余量、损耗、可选玻璃料号和生成玻璃零件的口径必须来自规则或模板配置。
- 玻璃规则可以按产品分类、系列、型号、销售配置工艺、字段方案和选项条件绑定。
- 玻璃规则不能写死为 Java 分支、Vue 固定下拉、SQL 固定业务模型、package script 或 tools 特例。

## Future Conceptual Fields

- rule code
- version
- product range
- input fields
- result fields
- glass mode / splice mode
- allowance and validation rules
- generated part references
- publish status

## Snapshot Rule

未来计算快照必须保存玻璃规则 code/version 和结果。
