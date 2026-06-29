# Request

功能迭代：主数据配置

Current R-10J scope: implement the self-developed business category tree-select rule in the shared masterdata UI, then refine material wording so `material-item` is displayed as 原材料档案.

- Self-developed business fields named 分类、上级分类、所属分类, or 父级分类 must use tree select when the target category resource is explicitly marked with hierarchy capability through `treeEnabled`, `parentEnabled`, or `treeSelectEnabled`.
- The decision must be config-driven; existing `parentId` data may build tree nodes but must not make the UI switch unpredictably.
- Tree selects default collapsed, must not use `default-expand-all`, and must not configure all default expanded keys.
- Tree-select labels display code plus name.
- Parent and child nodes can both be selected unless an explicit business rule disables the node.
- 产品大类的上级分类、产品系列的所属产品大类, and 工艺型号的所属产品大类 use tree select because `product-category` is hierarchical.
- 原材料档案、配件档案, and 销售选项值 can keep normal category selects while their category resources do not enable hierarchy; the structure must automatically switch if those resources later enable tree selection.
- Preserve product category maximum depth 3, self-parent rejection, descendant-parent rejection, backend validation, and R-10H product-category tree-table visual plus controlled expansion behavior.
- Display `material-item` as 原材料档案 instead of 物料档案.
- 原材料档案 maintains only base materials. It does not maintain order-specific cutting dimensions.
- Order-specific material usage is generated later by BOM, cut-list detail, or technical calculation.
- Do not create every order's sheet dimensions or profile lengths as 原材料档案 rows.
- Current 原材料档案 fields stay simple: 名称、所属分类、规格、单位、排序、状态、备注.
- 规格 means the material's own specification, such as thickness, cross-section, or whole-sheet specification; it is not order cutting size.
- Do not change `/business/masterdata/{resource}`, `ruoyi-ui/src/api/masterdata.js`, SQL table structure, or create BOM, inventory, production, DXF, sales-order, formula, field-scheme, or technical-decomposition runtime.
