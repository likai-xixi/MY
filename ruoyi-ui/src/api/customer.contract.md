# 客户管理 RuoYi API Contract

Feature ID: `customer`

Runtime API client: `ruoyi-ui/src/api/customer.js`.

## Backend Base

- Controller: `ruoyi-admin/src/main/java/com/ruoyi/web/controller/business/customer/CustomerController.java`
- Base path: `/business/customer`
- Canonical runtime route: `/business/customer`
- RuoYi menu segment: `business/customer`
- Direct `/customer` is not supported.
- Java class prefix: `Customer`

## Client Methods

- `listCustomer`
- `getCustomer`
- `duplicateWarning`
- `addCustomer`
- `updateCustomer`
- `delCustomer`
- `changeCustomerStatus`
- `listSalesmen`
- `transferOwner`
- `listOwnerLogs`
- `listFundAccounts`
- `listFundFlows`
- `addFundDeposit`
- `listDepositBatches`
- `getSamplePolicy`
- `saveSamplePolicy`
- `listSampleRebates`

The customer export endpoint is invoked by the page through RuoYi `proxy.download("business/customer/export", ...)`; there is no runtime `exportCustomer` method in this API client. `getCustomer()` returns only the basic customer detail envelope. Owner history, fund accounts, fund flows, deposit batches, sample policy, and sample rebate records are loaded through their dedicated permission-protected endpoints.

## Fund Boundary

The API client exposes customer-level deposit entry and read-only sample rebate history. It must not expose direct account-balance updates or sample rebate creation while no authoritative sample-order source exists.

Customer fund account vocabulary has exactly two active source values:

- `CUSTOMER_DEPOSIT`: 客户级定金.
- `SAMPLE_REBATE`: 样品返现.

- `addFundDeposit(customerId, data)` keeps the path `/business/customer/{customerId}/fund/deposit`.
- New deposit entries use `CUSTOMER_DEPOSIT`. The frontend may omit `accountType`; the backend defaults deposit entries to `CUSTOMER_DEPOSIT`. If a caller submits `accountType=SAMPLE_REBATE` or any other non-`CUSTOMER_DEPOSIT` value, the backend rejects it before account balance, batch, or flow mutation.
- This client method is deposit-in only. If `flowType` is omitted or `DEPOSIT_IN`, the backend records an incoming deposit. `DEPOSIT_DEDUCT`, `DEPOSIT_REFUND`, `DEPOSIT_ADJUST`, and `DEPOSIT_REVERSE` are rejected by this endpoint and must wait for a separate fund-processing flow.
- Current customer management only implements `CUSTOMER_DEPOSIT` incoming deposit. It does not implement deduction, refund, adjustment, or reversal.
- Order submission may show `CUSTOMER_DEPOSIT` status, but must not directly deduct customer funds.
- Delivery / finance contracts must later define `CUSTOMER_DEPOSIT` deduction/refund/adjustment/reversal and `SAMPLE_REBATE` deduction. Every fund mutation must write `customer_fund_flow`.
- Public customers must not show customer-level deposit entry UI and are rejected by the backend if called directly.
- `POST /business/customer/{customerId}/sample-rebate` is fail-closed until an approved authoritative sample-order source is integrated. The default backend authority rejects the request before policy lookup, idempotency, or mutation; the Vue page and API client expose no creation action. Existing rebate records remain readable through `listSampleRebates`.
- A future approved authority must return the canonical order id, order number, customer id, and sample amount. Only then may the internal path create `sample_rebate_record` and write `SAMPLE_REBATE_GENERATE`; database uniqueness on order id and customer/order number remains mandatory.

## Address Fields

Customer create/update/detail/list calls carry `customerNature` and `publicChannel`.

- `REAL`: real customer with contacts, shipping addresses, owner, customer-level deposit, sample policy, and sample rebate.
- `PUBLIC`: public customer used only for order classification; actual buyer, phone, shipping address, receiving salesperson, and source channel are reserved for the later order module.

Customer create/update/detail calls carry both administrative division codes and Chinese names for customer master and shipping addresses:

- `provinceCode` / `province`
- `cityCode` / `city`
- `districtCode` / `district`

The customer UI displays Chinese names and uses codes only for stable Cascader echo/save.

## Default Child Sync Fields

Customer create/update requests may include child rows in `contacts` and `addresses`.

- On `POST /business/customer`, if no meaningful child contact/address is submitted, the backend creates default child records from master customer fields in the same transaction.
- For `customerNature=PUBLIC`, the backend does not create default contact or shipping-address rows.
- On `PUT /business/customer`, the UI sends `syncDefaultContact` and `syncDefaultAddress` only as request intent fields. They are not database columns.
- The edit dialog checks both sync fields by default for REAL customers; the user can cancel either checkbox before saving.
- User requirement: editing a REAL customer must start with both default-contact and default-address sync options checked by default.
- `syncDefaultContact=true` syncs master contact, phone, and WeChat to the default contact, or creates it when missing.
- `syncDefaultAddress=true` syncs master contact, phone, province/city/district code/name fields, and detail address to the default shipping address, or creates it when missing.
- When the flags are false or omitted, editing master fields must not overwrite child contact/address records.
