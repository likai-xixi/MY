# Feature Context: customer

## Role

Customer management is the active business feature context. It owns customer master data, contacts, addresses, customer-level deposit evidence, public-customer classification, and ownership history.

## Fund Vocabulary

- `CUSTOMER_DEPOSIT`: 客户级定金.
- `SAMPLE_REBATE`: 样品返现.
- Current customer management implements `CUSTOMER_DEPOSIT` incoming deposit only.
- Current customer management does not implement customer-fund deduction, refund, adjustment, or reversal.
- Sales-order may show `CUSTOMER_DEPOSIT` status during submit, but must not directly deduct customer funds.
- Delivery / finance contracts must later define `CUSTOMER_DEPOSIT` deduction/refund/adjustment/reversal and `SAMPLE_REBATE` deduction.
- Every customer-fund mutation must write `customer_fund_flow`.

## Must Not Break

- REAL/PUBLIC customer rules.
- PUBLIC fixed classification customers.
- Customer-level deposit entry remains deposit-in only.
- Existing customer API/UI/SQL ownership files.
- Customer business code is out of scope for governance/rule-change work.

## Sales-Order Handoff Notes

- Sales order must snapshot customer/contact/address values instead of relying on mutable customer child rows.
- Sales order must not directly deduct `CUSTOMER_DEPOSIT` or `SAMPLE_REBATE`.
- Future partial customer updates need dedicated PATCH or business APIs instead of overloading `PUT /business/customer`.
- `business:customer:fund:adjust` remains reserved until a full adjustment flow exists.
