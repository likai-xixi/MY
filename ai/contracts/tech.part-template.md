# Tech Part Template Contract

Change: `R-09 configurable modeling contract package`
Status: contract-only.

## Purpose

零件模板定义未来技术拆解后每类零件应该有什么数据和计算口径。

## Hard Rules

- 零件名称、数量、材料、尺寸、加工说明、是否出图、是否打标签、是否进入生产都应来自模板和规则。
- 零件尺寸不能写死。
- 零件模板必须有 code 和 version。
- 已发布且被使用的零件模板不能原地覆盖修改。
- 零件包括但不限于主门扇、子门扇、左门框、右门框、上框、下框、中柱、玻璃、压条、合页孔、锁孔、拉手孔、包装件。
- 每个生成零件必须能追溯来源模板行、数量规则、材料规则、尺寸规则、加工说明和是否进入生产的判断。

## Future Conceptual Fields

- part template code
- version
- part name
- quantity rule
- material rule
- height rule
- width rule
- length rule
- thickness rule
- drawing flag
- label flag
- production flag
- instruction
- source template row
- formula/rule references

## Snapshot Rule

未来技术结果必须保存零件模板版本和每个零件的计算后结果。
