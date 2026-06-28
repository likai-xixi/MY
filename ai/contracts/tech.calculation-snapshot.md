# Tech Calculation Snapshot Contract

Change: `R-09 configurable modeling contract package`
Status: contract-only.

## Purpose

计算快照用于保存未来技术计算当时使用的全部配置、版本、输入和结果。

## Hard Rules

- 订单和技术结果不能只保存 id。
- 快照必须保存产品、型号、销售配置工艺、字段方案、选项方案、公式组、规则、模板和字段值。
- 后续配置改名、停用或升级后，历史订单和技术结果仍按旧快照解释。
- 技术结果必须保存规则、公式、模板、零件计算结果快照，而不是只保存当前规则或模板 id。
- 技术计算快照必须能说明当时用了哪些输入、公式、规则、模板、材料/选项、生成了哪些零件，以及每个零件的计算结果。

## Future Snapshot Content

- product category snapshot
- product series/model snapshot
- process snapshot
- field scheme code/version
- option schema code/version
- field value JSON
- field label JSON
- option code/label JSON
- material/accessory code/label JSON
- formula group code/version
- rule code/version
- glass rule code/version
- offset rule code/version
- decomposition template code/version
- part template code/version
- generated part result JSON
- formula input/output JSON
- rule decision JSON

## Non-goals In R-09

R-09 does not create calculation runtime or snapshot tables.
