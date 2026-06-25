# File Weight Exception

Change: `CR-20260625T042041Z-change`

Touched files:

- `ruoyi-business/src/main/java/com/ruoyi/business/customer/service/impl/CustomerServiceImpl.java`
- `ruoyi-business/src/main/resources/mapper/customer/CustomerMapper.xml`

Reason: both files are existing over-threshold customer implementation files. This change must touch them to extract fund-entry logic to `CustomerFundServiceImpl`, wire delegation from the customer service, and add the fund-account row-lock query.

Scope control:

- Keep `CustomerServiceImpl` changes to delegation and removal of fund-entry core logic.
- Put new fund mutation, row locking, balance math, duplicate account-create handling, and duplicate-key retry logic in `CustomerFundServiceImpl`.
- Add only the required mapper interface/XML method for `selectFundAccountForUpdate`.
- Do not implement sales-order, delivery, finance, deduction, refund, adjustment, or reversal behavior.
- Do not change SQL business table structure or governance rules.

Follow-up: broader `CustomerServiceImpl` decomposition remains outside this concurrency-safety slice.
