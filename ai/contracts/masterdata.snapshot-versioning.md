# Masterdata Snapshot And Versioning Contract

Change: `R-09 configurable modeling contract package`
Status: contract-only.

## Purpose

本合同统一产品、物料、选项、字段、公式、规则、模板的版本和快照口径。

## Hard Rules

- 被订单或技术结果使用过的已发布版本不能原地覆盖修改。
- 修改已发布配置必须复制成新版本。
- 新订单使用新版本，旧订单继续使用旧版本快照。
- code 用于稳定引用，label/name 用于显示并必须进入快照。

## Applies To

- product/category/model references
- material/accessory references
- sales option values
- field schemes
- option schemas
- formula variables
- formula groups
- process calculation rules
- glass rules
- offset rules
- decomposition templates
- part templates

## Snapshot Rule

未来所有高风险业务结果必须保存当时使用的 code、version、label/name 和 value。
