# Masterdata Sales Configuration Process Contract

Change: `R-09 configurable modeling contract package`
Status: contract-only.

## Purpose

这里的 process 指销售配置工艺，不是车间生产工序。

## Hard Rules

- `玻璃拼接`, `整拼`, `铝卡`, `型材`, `发光字`, `铁艺栅栏`, `钣金折弯` 都是用户可维护的销售配置工艺。
- 销售配置工艺用于决定未来订单页面加载哪个字段方案、选项方案和计算规则。
- 销售配置工艺不能和车间生产工序混为一个模型。

## Future Conceptual Fields

- process code/name
- product scope
- field scheme version
- option schema version
- calculation rule version
- status

## Snapshot Rule

未来订单必须保存所选销售配置工艺 code/name，以及它使用的方案和规则版本。
