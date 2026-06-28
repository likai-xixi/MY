# Rule Formula Variable Contract

Change: `R-09 configurable modeling contract package`
Status: contract-only.

## Purpose

公式变量用于把字段值、选项值、产品信息、材料信息和技术参数转成后续可计算的变量。

## Hard Rules

- 变量必须来自明确的数据来源。
- 变量 code 稳定，显示名称可以变化。
- 变量必须有数据类型和单位口径。
- 变量被计算快照引用后，历史结果不能被后续改名影响。
- 旧系统概念中的关键字、运算符、工艺参数、下档关系、玻璃规则、模压偏花/偏移规则，都必须抽象成可解释的变量、运算符、规则输入或规则引用。
- 变量不能以产品/工艺专用 Java 常量、Vue 表达式、SQL case 分支或工具脚本特例存在。

## Future Conceptual Fields

- variable code
- display name
- source type
- source field/option/material/process/rule reference
- data type
- unit
- allowed operators
- scope
- version
- status

## Snapshot Rule

未来计算快照必须保存变量 code、显示名称、来源和值。
