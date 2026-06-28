# Rule Process Calculation Contract

Change: `R-09 configurable modeling contract package`
Status: contract-only.

## Purpose

本合同定义未来的工艺计算规则边界。

## Hard Rules

- 工艺计算规则必须来自配置。
- 规则必须有 code 和 version。
- 已发布且被使用的规则不能原地覆盖修改。
- 新变化必须复制成新版本。
- 工艺计算规则决定销售配置工艺如何加载字段方案、选项方案、公式组、玻璃规则、偏花/偏移规则和技术拆解模板。
- 玻璃拼接、整拼、铝卡、型材、发光字、铁艺栅栏、钣金折弯等工艺差异必须通过配置规则表达。
- 规则输出不得直接覆盖订单输入；销售订单记录“客户要什么”，技术阶段再决定“工厂怎么做”。

## Future Conceptual Fields

- rule code
- rule version
- product range
- field scheme version
- option schema version
- formula group version
- glass rule version
- offset rule version
- decomposition template version
- publish status

## Snapshot Rule

未来技术计算必须保存规则 code/version、输入值和输出值。
