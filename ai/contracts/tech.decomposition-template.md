# Tech Decomposition Template Contract

Change: `R-09 configurable modeling contract package`
Status: contract-only.

## Purpose

技术拆解模板用于在未来技术阶段把“客户要什么”转换成“工厂怎么做”。

## Hard Rules

- 技术拆解必须由模板驱动。
- 销售订单记录“客户要什么”，技术阶段决定“工厂怎么做”。
- 主门扇、子门扇、左门框、右门框、上框、下框、中柱、玻璃、压条、合页孔、锁孔、拉手孔、包装件等都应来自模板结果。
- 这些零件名称是模板数据，不是固定代码模型。
- 模板必须有 code 和 version。
- 已发布且被使用的模板不能原地覆盖修改。
- 模板可以按产品分类、系列、型号、销售配置工艺、字段方案、选项方案、公式组、玻璃规则和偏移规则绑定。
- 技术拆解模板不能通过 Java service/controller/mapper/domain、Vue 页面、API client 或 SQL migration 来表达单个产品/工艺差异。

## Future Conceptual Fields

- template code
- version
- product range
- process range
- part template list
- input field scheme version
- formula/rule references
- publish status

## Snapshot Rule

未来技术结果必须保存模板 code/version 和生成的零件清单快照。
