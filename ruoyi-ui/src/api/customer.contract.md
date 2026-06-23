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
- `checkCustomerDuplicate`
- `addCustomer`
- `updateCustomer`
- `changeCustomerStatus`
- `delCustomer`
- `exportCustomer`
- `listSalesmen`
- `transferOwner`
- `listOwnerLogs`
- `listFundAccounts`
- `recordFundDeposit`
- `listFundFlows`
- `listDepositBatches`
- `getSamplePolicy`
- `saveSamplePolicy`
- `createSampleRebate`
- `listSampleRebates`

## Fund Boundary

The API client exposes fund deposit and sample rebate entry points only. It must not expose direct account-balance update calls.

## Address Fields

Customer create/update/detail calls carry both administrative division codes and Chinese names for customer master and shipping addresses:

- `provinceCode` / `province`
- `cityCode` / `city`
- `districtCode` / `district`

The customer UI displays Chinese names and uses codes only for stable Cascader echo/save.

## Default Child Sync Fields

Customer create/update requests may include child rows in `contacts` and `addresses`.

- On `POST /business/customer`, if no meaningful child contact/address is submitted, the backend creates default child records from master customer fields in the same transaction.
- On `PUT /business/customer`, the UI sends `syncDefaultContact` and `syncDefaultAddress` only as request intent fields. They are not database columns.
- `syncDefaultContact=true` syncs master contact, phone, and WeChat to the default contact, or creates it when missing.
- `syncDefaultAddress=true` syncs master contact, phone, province/city/district code/name fields, and detail address to the default shipping address, or creates it when missing.
- When the flags are false or omitted, editing master fields must not overwrite child contact/address records.
