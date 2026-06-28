# Tech Calculation Snapshot Contract

Change: `R-09 configurable modeling contract package`
Status: contract-only.

## Purpose

计算快照用于保存未来技术计算当时使用的全部配置、版本、输入和结果。

## Hard Rules

- 订单和技术结果不能只保存 id。
- 快照必须保存产品、型号、销售配置工艺、字段方案、选项方案、公式组、规则、模板和字段值。
- 后续配置改名、停用或升级后，历史订单和技术结果仍按旧快照解释。

## Future Snapshot Content

- product category snapshot
- product series/model snapshot
- process snapshot
- field scheme code/version
- option schema code/version
- field value JSON
- field label JSON
- formula group code/version
- rule code/version
- decomposition template code/version
- generated part result JSON

## Non-goals In R-09

R-09 does not create calculation runtime or snapshot tables.
