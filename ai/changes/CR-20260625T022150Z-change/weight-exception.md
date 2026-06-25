# File Weight Exception

Change: `CR-20260625T022150Z-change`

Touched file: `ruoyi-business/src/main/java/com/ruoyi/business/customer/service/impl/CustomerServiceImpl.java`

Reason: `CustomerServiceImpl.java` is an existing over-threshold Java service. This change must touch it to enforce the customer fund-entry boundary at the backend service layer.

Scope control:

- Add a narrow external deposit wrapper that accepts only omitted `accountType` or explicit `CUSTOMER_DEPOSIT`.
- Reject `SAMPLE_REBATE` and any other non-`CUSTOMER_DEPOSIT` value before shared fund-entry mutation logic runs.
- Preserve the existing internal sample rebate path that creates `sample_rebate_record` before writing `SAMPLE_REBATE_GENERATE`.
- No sales-order code, governance-rule changes, or SQL business table changes are included.

Follow-up: split/refactor of the customer service remains outside this security boundary fix.
