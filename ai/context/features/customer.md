# Feature Context: customer

## Role

Customer management is the active business feature context. It owns customer master data, contacts, addresses, customer-level deposit evidence, public-customer classification, and ownership history.

## Must Not Break

- REAL/PUBLIC customer rules.
- PUBLIC fixed classification customers.
- Customer-level deposit entry remains deposit-in only.
- Existing customer API/UI/SQL ownership files.
- Customer business code is out of scope for governance/rule-change work.

## Sales-Order Handoff Notes

- Sales order must snapshot customer/contact/address values instead of relying on mutable customer child rows.
- Future partial customer updates need dedicated PATCH or business APIs instead of overloading `PUT /business/customer`.
- `business:customer:fund:adjust` remains reserved until a full adjustment flow exists.
