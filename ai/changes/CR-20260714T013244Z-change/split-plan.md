# Customer File Split Plan

Scope: `CR-20260714T013244Z-change`

The following files were already over the repository weight threshold before this security/integrity change and must be touched at their owning enforcement points:

- `ruoyi-business/src/main/java/com/ruoyi/business/customer/service/impl/CustomerServiceImpl.java`
- `ruoyi-ui/src/views/customer/index.vue`

This change keeps the fixes atomic: server-authoritative rebate validation remains inside the existing customer transaction, owner mutation remains in the existing transfer transaction, and permission-segmented UI loading remains in the owning page. Splitting these files in the same security change would mix behavioral repair with a broad refactor and make rollback and regression attribution weaker.

## Backend split sequence

1. Extract sample-policy validation, request normalization, amount calculation, and canonical rebate input into a customer-owned `CustomerSamplePolicyService` with focused unit tests.
2. Extract owner target validation, snapshot resolution, dedicated owner update, and audit-log assembly into a transactional `CustomerOwnerService`.
3. Keep `CustomerServiceImpl` as the customer aggregate coordinator and preserve existing public service contracts.

## Frontend split sequence

1. Extract the detail drawer sections into customer-owned base, fund-policy, and owner-history components.
2. Extract the customer edit and owner-transfer dialogs while keeping permission checks in a small customer detail composable.
3. Register any genuinely reusable component in the active component catalogs; keep feature-specific forms under the customer module.

## Guardrails

- Perform the split in a dedicated customer refactor change with its own impact analysis and review.
- Preserve the exact dedicated endpoint permissions and query-only behavior added here.
- Preserve the sample rebate and owner-transfer regression tests before moving code.
- Do not open sales-order, delivery, finance, or governance implementation scope as part of the split.
