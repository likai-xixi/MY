# 客户管理 API Ownership Contract

Feature ID: `customer`

## Owned Endpoints

- `GET /business/customer/list`
- `POST /business/customer/export`
- `GET /business/customer/{customerId}`
- `GET /business/customer/duplicate-warning`
- `POST /business/customer`
- `PUT /business/customer`
- `PUT /business/customer/changeStatus`
- `DELETE /business/customer/{customerIds}`
- `GET /business/customer/salesmen`
- `PUT /business/customer/transferOwner`
- `GET /business/customer/{customerId}/owner-log`
- `GET /business/customer/{customerId}/fund/accounts`
- `POST /business/customer/{customerId}/fund/deposit`
- `GET /business/customer/{customerId}/fund/flows`
- `GET /business/customer/{customerId}/fund/deposit-batches`
- `GET /business/customer/{customerId}/sample-policy`
- `PUT /business/customer/{customerId}/sample-policy`
- `POST /business/customer/{customerId}/sample-rebate`
- `GET /business/customer/{customerId}/sample-rebate`

Endpoint IDs are recorded in `graph/api-graph.json` and `memory/API_CATALOG.md`. Same-path mutating endpoints use suffixed IDs such as `/business/customer:update`.

## Address Payload Fields

- Customer create/update/detail/list payloads include `province_code`, `city_code`, `district_code` through the Java fields `provinceCode`, `cityCode`, and `districtCode`, along with Chinese `province`, `city`, and `district`.
- Customer shipping address payloads include the same code/name pairs for `customer_address`.
- Export remains user-facing and may omit code fields; exported area columns must show Chinese names unless code columns are explicitly labeled as `省编码`/`市编码`/`区县编码`.

## Default Child Sync Payload Fields

- `POST /business/customer` accepts optional `contacts` and `addresses`. If no meaningful child contact/address is submitted, the service may create default children from master customer fields in the same transaction.
- `PUT /business/customer` accepts `syncDefaultContact` and `syncDefaultAddress` boolean fields. They are request-only fields on `Customer` and are not database columns.
- `syncDefaultContact=true` updates or creates only the default `customer_contact` record from master `contactName`, `contactPhone`, and `wechat`.
- `syncDefaultAddress=true` updates or creates only the default `customer_address` record from master contact, phone, province/city/district code/name fields, and detail address. Existing default-address `logisticsLine` is preserved.
- If these flags are false or omitted, master customer edits must not blindly overwrite child contact/address records.

## Boundary Rules

- Other modules may call only documented API endpoints, not internal service or mapper code.
- Sales order and shipment modules may later read customer defaults and policy data through documented APIs or explicit service contracts recorded in a future change.
- Fund account balances must not be modified by ad hoc APIs. Mutating fund endpoints must call the fund-entry service path that also writes `customer_fund_flow`.
- Salesman ownership uses existing RuoYi user, role, and dept structures. This feature must not create a separate salesman-management API.

## Verification

- `npm run scan:api-clients`
- `npm run check:registry`
- `npm run check:graph`
