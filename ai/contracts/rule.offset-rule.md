# Rule Offset Rule Contract

Change: `R-09 configurable modeling contract package`
Status: contract-only.

## Purpose

偏花、偏移、对齐和类似旧系统概念必须抽象成版本化规则。

## Hard Rules

- 偏花规则和偏移规则必须配置化。
- 规则必须有 code 和 version。
- 已发布且被使用的规则不能原地覆盖修改。
- 新变化必须复制成新版本。
- 模压偏花、图案对齐、方向偏移、孔位偏移、板件折弯偏移和类似旧系统概念都必须抽象成版本化规则。
- 偏花/偏移规则可以引用字段值、产品配置、材料/型材/铝卡/玻璃选项、公式变量和模板常量。
- 规则结果必须进入技术计算快照，不能只保留当前规则 id。

## Future Conceptual Fields

- rule code
- version
- product range
- trigger fields
- result fields
- direction / alignment policy
- offset expression
- applicable template rows
- publish status

## Snapshot Rule

未来计算快照必须保存规则 code/version、触发结果和计算结果。
