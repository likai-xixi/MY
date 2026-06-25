# Risk Register

| Risk | Mitigation | Status |
| --- | --- | --- |
| Caller uses `/fund/deposit` with `accountType=SAMPLE_REBATE` to bypass sample rebate record creation. | Add deposit-only service wrapper and reject non-`CUSTOMER_DEPOSIT` before shared fund-entry mutation. | Mitigated in scope |
| Internal sample rebate generation breaks if shared fund-entry path stops accepting `SAMPLE_REBATE`. | Keep `recordFundEntry` generic and test `createSampleRebateRecord` still uses `SAMPLE_REBATE_GENERATE`. | Mitigated in scope |
| Change drifts into sales-order implementation. | No sales-order paths or SQL sales-order tables are edited. | Guarded |
| Existing customer service is above file-weight threshold. | Add current CR `weight-exception.md` for the narrow service-layer boundary fix; do not refactor unrelated code. | Documented |
