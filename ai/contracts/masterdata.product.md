# Masterdata Product Contract

Status: superseded for future-state design by `engineering-core.index.md` and `engineering-core.domain.md` in R-11.

## Current Decision

- Product category, series, and product model remain configurable catalog identities.
- Product model means what is sold/configured. It must never be displayed or persisted as a process/craft plan.
- Process differences belong to separate `ProcessPlan` and immutable `ProcessPlanVersion` objects.
- Product-to-process applicability/default selection is an explicit versioned binding.
- Future orders snapshot product identity and bind an exact process-plan version through their technical/version chain.

The as-is R-10 `masterdata_product_model` table and `product-model` resource are documented in `masterdata.db.md` and `masterdata.api.md` until the destructive migration. The UI alias `工艺型号` is migration debt and must be removed without compatibility.
