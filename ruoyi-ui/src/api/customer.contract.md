# 客户管理 RuoYi API Contract

Feature ID: `customer`

Runtime API client: `ruoyi-ui/src/api/customer.js`.

## Backend Base

- Controller: `ruoyi-admin/src/main/java/com/ruoyi/web/controller/business/customer/CustomerController.java`
- Base path: `/business/customer`
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
- `listFundAccounts`
- `listFundFlows`
- `addFundDeposit`
- `listDepositBatches`
- `getSamplePolicy`
- `saveSamplePolicy`
- `createSampleRebate`
- `listSampleRebates`

The customer export endpoint is invoked by the page through RuoYi `proxy.download("business/customer/export", ...)`; there is no runtime `exportCustomer` method in this API client. Owner-change logs are returned in the customer detail aggregation from `getCustomer()` and can also be read from the backend endpoint, but there is no separate runtime `listOwnerLogs` client method in `customer.js`.

## Fund Boundary

The API client exposes customer-level deposit and sample rebate entry points only. It must not expose direct account-balance update calls.

- `addFundDeposit(customerId, data)` keeps the path `/business/customer/{customerId}/fund/deposit`.
- New deposit entries use `CUSTOMER_DEPOSIT`. The frontend may omit `accountType`; the backend defaults deposit entries to `CUSTOMER_DEPOSIT`. If a caller submits `accountType=SAMPLE_REBATE` or any other non-`CUSTOMER_DEPOSIT` value, the backend rejects it before account balance, batch, or flow mutation.
- This client method is deposit-in only. If `flowType` is omitted or `DEPOSIT_IN`, the backend records an incoming deposit. `DEPOSIT_DEDUCT`, `DEPOSIT_REFUND`, `DEPOSIT_ADJUST`, and `DEPOSIT_REVERSE` are rejected by this endpoint and must wait for a separate fund-processing flow.
- Public customers must not show customer-level deposit entry UI and are rejected by the backend if called directly.
- Sample rebate remains separate: callers must use `/business/customer/{customerId}/sample-rebate`, which creates `sample_rebate_record` and then writes internal `SAMPLE_REBATE_GENERATE` flow against the `SAMPLE_REBATE` account.

## Address Fields

Customer create/update/detail/list calls carry `customerNature` and `publicChannel`.

- `REAL`: real customer with contacts, shipping addresses, owner, customer-level deposit, sample policy, and sample rebate.
- `PUBLIC`: public customer used only for order classification; actual buyer, phone, shipping address, receiving salesperson, and source channel are reserved for the later sales-order module.

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
