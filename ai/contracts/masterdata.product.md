# Masterdata Product Contract

Status: active R-12A product-catalog contract under the R-11 engineering-core authority.

## Current Decision

- Product category, series, and product model remain configurable catalog identities.
- Product model means what is sold/configured. It must never be displayed or persisted as a process/craft plan.
- Process differences belong to later, separate process-plan/version objects; R-12A creates none of them.
- Product-to-process applicability/default selection is not part of this masterdata runtime.
- Future orders must snapshot product identity under a separately approved order contract.

`masterdata_product_model` and `product-model` remain the product identity table/resource. Current UI, API contracts, menus, and tests use 产品型号 only; no compatibility alias remains.
