# QA Review

## Verification Plan

- `node --test tests/customer-risk-gate.test.js`
- Maven compile: `mvn -pl ruoyi-admin -am -DskipTests compile`, using the project cached Maven command if needed.
- `npm run scan:all`
- `npm run finalize:change -- --summary "客户管理资金并发安全收口"`
- `npm run check`
- `npm test`
- `git diff --check`

## Static Coverage Expectations

- `ICustomerFundService` and `CustomerFundServiceImpl` exist.
- `CustomerServiceImpl` delegates fund mutation to the fund service and no longer carries row locking, balance math, fund-flow insert, or deposit-batch insert core logic.
- Mapper XML has `selectFundAccountForUpdate` with `for update`.
- Fund service entry methods are public transactional methods.
- Concurrent missing-account creation catches `DuplicateKeyException` and locked re-reads.
- `insertFundFlow` and `insertDepositBatch` have duplicate-key retry.
- External deposit remains deposit-only and sample rebate remains internal.

## Runtime Evidence

- If backend, MySQL, and Redis are available locally, run the API/DB mutation and 10-way concurrency cases from the user brief.
- If the runtime stack is unavailable, verification and handover must explicitly state: `本轮只完成静态和编译验证，未完成 live API/DB 并发验证`, with the reason.

## Residual Risk

- Static tests can prove structure and guard paths, but only live API/DB validation can prove the database isolation behavior under concurrent requests.
