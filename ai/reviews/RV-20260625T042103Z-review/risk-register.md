# Risk Register

| Risk | Impact | Mitigation | Owner |
| --- | --- | --- | --- |
| Lost update on concurrent customer deposit | Incorrect balance/frozen/available amounts | Add `selectFundAccountForUpdate` and perform balance math after the locked read inside `CustomerFundServiceImpl` transaction | Codex |
| Concurrent first deposit creates duplicate account rows | Duplicate accounts or failed user action | Optimistic insert, catch `DuplicateKeyException`, then locked re-read | Codex |
| `flow_no` or `deposit_batch_no` collides in the same millisecond | Failed insert or partial fund evidence | Catch `DuplicateKeyException`, regenerate number, retry up to max attempts, throw clear `ServiceException` on exhaustion | Codex |
| Transaction annotation bypassed by self-invocation | Row lock does not protect the balance update | Delegate from `CustomerServiceImpl` to injected public `@Transactional` methods on `CustomerFundServiceImpl` | Codex |
| External API path or business口径 drifts | Frontend/runtime regression | Keep controller and API client unchanged; static tests and contracts assert existing paths and rules | Codex |
| Scope drifts into sales-order/delivery/finance | Premature module coupling | Current CR review explicitly forbids sales-order, delivery, finance, deduction, refund, adjustment, and reversal implementation | Codex |
