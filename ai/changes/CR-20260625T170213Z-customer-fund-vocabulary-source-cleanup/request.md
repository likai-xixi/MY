# Request

R-03 customer fund vocabulary source cleanup.

Clean current customer fund context, feature briefs, contracts, README, handover, and current-context so the active source vocabulary is two-account only:

- `CUSTOMER_DEPOSIT`: 客户级定金
- `SAMPLE_REBATE`: 样品返现

Do not modify customer runtime code, sales-order runtime code, production safety config, migration/idempotency registry, business table structure, Java/Vue fund runtime, or package/tool/test code.
