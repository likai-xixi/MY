# Verification

Status: verified. Implementation, compile/package, targeted tests, generated scans, context refresh, finalize, live API/DB concurrency validation, full governance check, standalone Node tests, and whitespace diff check passed.

## Commands

- `git status --short` - clean before the CR was created.
- `git rev-parse origin/master` - `166c3ee48d558bff7ccb81eec576803e3c9fa31d`.
- `npm run resume` - passed.
- `npm run context:build -- customer` - passed before implementation and passed again after final impact-scope updates.
- `npm run ai:do -- "功能迭代：客户管理"` - passed and created `ai/changes/CR-20260625T042041Z-change`.
- `npm run impact -- 客户管理` - passed with no blockers.
- `npm run review:feature -- "功能预审：客户管理资金并发安全收口" --feature customer` - created `ai/reviews/RV-20260625T042103Z-review`.
- `node --test tests/customer-risk-gate.test.js` - passed with 8 tests.
- `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests compile` - passed.
- `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests package` - passed.
- Runtime API/DB validation on backend `http://127.0.0.1:18080`, database `my_ry_vue_runtime`, Redis DB1 - passed.
- `npm run scan:all` - passed.
- `npm run finalize:change -- --summary "客户管理资金并发安全收口"` - passed.
- `npm run check` - passed with 121 Node tests after correcting CR evidence formatting, changed-file manifest, exact review/context impact roots, runtime evidence newline, and regenerated current context.
- `npm test` - standalone pass with 121 Node tests.
- `git diff --check` - passed.

## Evidence

- Review gate: `ai/reviews/RV-20260625T042103Z-review/decision.md` contains `Allow Implementation`.
- Service extraction: added `ruoyi-business/src/main/java/com/ruoyi/business/customer/service/ICustomerFundService.java` and `ruoyi-business/src/main/java/com/ruoyi/business/customer/service/impl/CustomerFundServiceImpl.java`.
- Delegation: `CustomerServiceImpl` delegates customer fund account initialization, deposit entry, generic fund entry, and sample rebate fund flow writing to `customerFundService`.
- Row lock: `CustomerMapper.selectFundAccountForUpdate` and `CustomerMapper.xml` use `select * from customer_fund_account ... limit 1 for update`.
- Concurrent account creation: `CustomerFundServiceImpl.ensureFundAccountForUpdate` catches `DuplicateKeyException` and then re-reads with `selectFundAccountForUpdate`.
- Unique-key retry: `insertFundFlowWithRetry` and `insertDepositBatchWithRetry` regenerate numbers and retry up to `UNIQUE_NO_MAX_RETRY`.
- Static risk gate: `tests/customer-risk-gate.test.js` now checks the fund service files, delegation boundary, row-lock SQL, public transactional methods, duplicate account-create handling, flow/deposit number retry, deposit-only endpoint, and sample rebate internal path.
- Maven compile/package passed after Java/XML changes.
- `npm run scan:all` completed all scanner steps and ownership sync.
- Current context: `ai/context/current-context.json` and `ai/context/current-context.md` now point at `CR-20260625T042041Z-change`.
- CR scope: `impact.allowedEditRoots` was expanded only for required CR artifacts, the exact review package `ai/reviews/RV-20260625T042103Z-review`, and generated current-context files.
- API path diff: none. Existing customer routes and frontend API paths are unchanged.
- DB table/schema diff: none. The mapper query changed, but no SQL business table structure was changed.

## Runtime Evidence

Runtime validation is recorded in `ai/changes/CR-20260625T042041Z-change/runtime-validation.md` and machine-readable evidence is in `ai/changes/CR-20260625T042041Z-change/runtime-evidence/api-db-validation.json`.

Live API/DB cases passed for test customer `26 / RT_FUND_CONCURRENCY_202606250432`:

- Omitted `accountType` deposit succeeded with `CUSTOMER_DEPOSIT / DEPOSIT_IN`.
- Explicit `CUSTOMER_DEPOSIT` deposit succeeded.
- `SAMPLE_REBATE` through `/fund/deposit` failed and left balance, flow, batch, and rebate counts unchanged.
- `INVALID_ACCOUNT` through `/fund/deposit` failed and left balance, flow, batch, and rebate counts unchanged.
- `/sample-rebate` created one `sample_rebate_record`, then one `SAMPLE_REBATE_GENERATE` fund flow, and did not create a deposit batch.
- PUBLIC customer `1 / PUB_DIRECT_SALE` deposit failed and left fund accounts, flows, batches, and rebates unchanged.
- 10 concurrent one-yuan deposits all succeeded: `CUSTOMER_DEPOSIT.balance_amount` moved from `3.57` to `13.57`, `frozen_amount` moved from `3.57` to `13.57`, `available_amount` stayed `0`, flow count increased by 10, batch count increased by 10, `flow_no` had no duplicates, and `deposit_batch_no` had no duplicates.

Captcha was restored to `true` in MySQL and Redis DB0/DB1. The backend validation process started by this run was stopped after evidence capture.

## Final Gate Results

- Full `npm run check` passed end to end with 121 Node tests.
- Standalone `npm test` passed with 121 Node tests.
- `git diff --check` passed.
- Earlier check attempts exposed evidence hygiene only: memory section shape, missing session file in `changed-files.json`, required review/context roots missing from `impact.allowedEditRoots`, missing runtime-evidence trailing newline, and stale current context. These were corrected and the final gates passed afterward.
