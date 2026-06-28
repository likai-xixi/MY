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

## Future Conceptual Fields

- rule code
- version
- product range
- trigger fields
- result fields
- publish status

## Snapshot Rule

未来计算快照必须保存规则 code/version、触发结果和计算结果。
