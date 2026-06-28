# Masterdata Sales Configuration Process Contract

Change: `R-09 configurable modeling contract package`
Status: contract-only.

## Purpose

这里的 process 指销售配置工艺，不是车间生产工序。

## Hard Rules

- `玻璃拼接`, `整拼`, `铝卡`, `型材`, `发光字`, `铁艺栅栏`, `钣金折弯` 都是用户可维护的销售配置工艺。
- 销售配置工艺用于决定未来订单页面加载哪个字段方案、选项方案和计算规则。
- 销售配置工艺不能和车间生产工序混为一个模型。
- 这里的工艺记录的是销售配置口径，不是生产路线、车间工序或派工节点。
- 工艺可以按产品分类、系列、型号、材料体系、开合方式、玻璃/整拼/铝卡/型材等配置条件绑定不同字段方案、选项方案和计算规则。
- 新增销售配置工艺必须通过配置数据完成，不能新增 Java service/controller/mapper/domain、Vue 页面、API client 或 SQL 固定业务模型来表达单个工艺。

## Future Conceptual Fields

- process code/name
- product scope
- field scheme version
- option schema version
- calculation rule version
- status

## Snapshot Rule

未来订单必须保存所选销售配置工艺 code/name，以及它使用的方案和规则版本。
