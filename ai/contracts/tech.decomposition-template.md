# Tech Decomposition Template Contract

Change: `R-09 configurable modeling contract package`
Status: contract-only.

## Purpose

技术拆解模板用于在未来技术阶段把“客户要什么”转换成“工厂怎么做”。

## Hard Rules

- 技术拆解必须由模板驱动。
- 主门扇、子门扇、门框、玻璃、压条、孔位、包装件等都应来自模板结果。
- 这些零件名称是模板数据，不是固定代码模型。
- 模板必须有 code 和 version。
- 已发布且被使用的模板不能原地覆盖修改。

## Future Conceptual Fields

- template code
- version
- product range
- process range
- part template list
- publish status

## Snapshot Rule

未来技术结果必须保存模板 code/version 和生成的零件清单快照。
