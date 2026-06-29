# Request

功能迭代：主数据配置

R-10I scope: keep the grouped masterdata menu pages and adjust product-facing display wording only.

- 产品配置 displays 产品大类、产品系列、工艺型号.
- Internal resource keys remain `product-category`, `product-series`, and `product-model`.
- `/business/masterdata/{resource}`, `ruoyi-ui/src/api/masterdata.js`, and `masterdata_product_model` remain unchanged.
- Do not create sales-order, formula, field-scheme, technical-decomposition, production, or DXF runtime.
- Preserve R-10H product-category tree-table visual hierarchy and controlled expansion behavior.
