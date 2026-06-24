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

- Customer detail/list payloads include `customerNature` (`REAL` or `PUBLIC`) and `publicChannel` (`DIRECT_SALE` or `SELF_MEDIA` when `customerNature=PUBLIC`).
- `POST /business/customer` is the normal REAL customer create endpoint. If a request submits `customerNature=PUBLIC`, the service rejects it with `公共客户由系统初始化，不允许手工新增。`
- `PUT /business/customer` is the normal REAL customer edit endpoint. Built-in PUBLIC customers are rejected with `内置公共客户不允许在普通客户编辑中修改。`; REAL customers cannot be changed to PUBLIC and are rejected with `真实客户不允许改为公共客户。`
- `PUT /business/customer/changeStatus` rejects built-in PUBLIC customers with `内置公共客户不允许停用。`
- `DELETE /business/customer/{customerIds}` rejects built-in PUBLIC customers with `内置公共客户不允许删除。`
- Public customers are only order-classification masters. They do not require contact, phone, address, or fixed owner fields; later sales-order payloads must capture the actual buyer, phone, shipping address, receiving salesperson, and source-channel snapshots.
- Customer create/update/detail/list payloads include ownership fields:
  - `ownerType`: `FACTORY`, `SALESMAN`, or `NONE`
  - `ownerSource`: `FACTORY_POOL`, `FACTORY_ASSIGNED`, `SALESMAN_SELF`, or `NONE`
  - `ownerProfitMode`: `NONE`, `MAINTENANCE_FEE`, or `SALES_COMMISSION`
  - `ownerEffectiveTime`: current ownership effective timestamp
- New `REAL` customers default to `FACTORY / FACTORY_POOL / NONE` and do not require `ownerUserId`; `REAL + SALESMAN` requires `ownerUserId` and a valid source/profit pair.
- `PUBLIC` customers are initialized from seed data only, saved as `NONE / NONE / NONE`, clear owner user/dept fields, and reject owner-change operations.
- Public customers keep technical compatibility values `customerType=OTHER` and `customerLevel=NORMAL`, but UI clients must not present them as normal real-customer type/level labels.
- Customer create/update/detail/list payloads include `province_code`, `city_code`, `district_code` through the Java fields `provinceCode`, `cityCode`, and `districtCode`, along with Chinese `province`, `city`, and `district`.
- Customer shipping address payloads include the same code/name pairs for `customer_address`.
- Export remains user-facing and may omit code fields; exported area columns must show Chinese names unless code columns are explicitly labeled as `省编码`/`市编码`/`区县编码`.

## Default Child Sync Payload Fields

- `POST /business/customer` accepts optional `contacts` and `addresses`. If no meaningful child contact/address is submitted, the service may create default children from master customer fields in the same transaction.
- `PUT /business/customer` accepts `syncDefaultContact` and `syncDefaultAddress` boolean fields. They are request-only fields on `Customer` and are not database columns.
- For seeded `customerNature=PUBLIC` records, contact/address child rows and sync flags are ignored; the service must not create default contacts or default shipping addresses.
- `syncDefaultContact=true` updates or creates only the default `customer_contact` record from master `contactName`, `contactPhone`, and `wechat`.
- `syncDefaultAddress=true` updates or creates only the default `customer_address` record from master contact, phone, province/city/district code/name fields, and detail address. Existing default-address `logisticsLine` is preserved.
- If these flags are false or omitted, master customer edits must not blindly overwrite child contact/address records.

## Boundary Rules

- Other modules may call only documented API endpoints, not internal service or mapper code.
- Sales order and shipment modules may later read customer defaults and policy data through documented APIs or explicit service contracts recorded in a future change.
- Fund deposit endpoint path remains `POST /business/customer/{customerId}/fund/deposit`. New customer-level deposit entries use only `CUSTOMER_DEPOSIT`; the request may omit `accountType`, and the backend defaults it to `CUSTOMER_DEPOSIT`.
- Public customers must be rejected by customer-level deposit, sample-policy save, and sample-rebate generation operations.
- Fund account balances must not be modified by ad hoc APIs. Mutating fund endpoints must call the fund-entry service path that also writes `customer_fund_flow`.
- Salesman ownership uses existing RuoYi user, role, and dept structures. This feature must not create a separate salesman-management API.
- `PUT /business/customer/transferOwner` keeps the existing path but represents customer owner change:
  - `ASSIGN_MAINTENANCE`: assigns a factory customer to a salesman with `FACTORY_ASSIGNED / MAINTENANCE_FEE`.
  - `MARK_SALESMAN_SELF`: marks a customer as salesman-self with `SALESMAN_SELF / SALES_COMMISSION`.
  - `RETURN_FACTORY`: returns a customer to `FACTORY / FACTORY_POOL / NONE` and clears owner user/dept.
- Owner-change requests require `changeReason`; `effectiveTime` defaults to current time when omitted. Public customers are rejected.
- Owner-change only records ownership/profit mode for later sales-order snapshots. It does not create sales-order, delivery, finance, maintenance-fee, or commission-calculation APIs.

## Verification

- `npm run scan:api-clients`
- `npm run check:registry`
- `npm run check:graph`
