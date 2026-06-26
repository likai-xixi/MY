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
- Public customers are only order-classification masters. They do not require contact, phone, address, or fixed owner fields; later sales-order payloads must capture the actual buyer, phone, shipping address, receiving salesperson, and source-channel snapshots. Sales-order submit may show `CUSTOMER_DEPOSIT` status, but must not directly deduct customer funds.
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
- REAL customer master `contactPhone`, optional `contacts[].phone`, and optional `addresses[].receiverPhone` are trimmed before validation/save. The master phone must be an 11-digit mainland China mobile number; optional child phones are validated only when filled. PUBLIC customer phone/contact/address fields are cleared and not validated.
- `GET /business/customer/duplicate-warning` trims `customerName` and `contactPhone`; invalid non-empty mobile phone input is ignored for phone duplicate lookup instead of broadening the query.
- Export remains user-facing and may omit code fields; exported area columns must show Chinese names unless code columns are explicitly labeled as `省编码`/`市编码`/`区县编码`.

## Default Child Sync Payload Fields

- `POST /business/customer` accepts optional `contacts` and `addresses`. If no meaningful child contact/address is submitted, the service may create default children from master customer fields in the same transaction.
- `PUT /business/customer` accepts `syncDefaultContact` and `syncDefaultAddress` boolean fields. They are request-only fields on `Customer` and are not database columns.
- For seeded `customerNature=PUBLIC` records, contact/address child rows and sync flags are ignored; the service must not create default contacts or default shipping addresses.
- The REAL edit dialog sends both sync flags as `true` by default, while still allowing users to cancel either flag before save.
- `syncDefaultContact=true` updates or creates only the default `customer_contact` record from master `contactName`, `contactPhone`, and `wechat`.
- `syncDefaultAddress=true` updates or creates only the default `customer_address` record from master contact, phone, province/city/district code/name fields, and detail address. Existing default-address `logisticsLine` is preserved.
- If these flags are false or omitted, master customer edits must not blindly overwrite child contact/address records.

## Boundary Rules

- Other modules may call only documented API endpoints, not internal service or mapper code.
- Sales order and shipment modules may later read customer defaults and policy data through documented APIs or explicit service contracts recorded in a future change.
- Fund deposit endpoint path remains `POST /business/customer/{customerId}/fund/deposit`. New customer-level deposit entries use only `CUSTOMER_DEPOSIT` for 客户级定金; the request may omit `accountType`, and the backend defaults it to `CUSTOMER_DEPOSIT`. Explicit `CUSTOMER_DEPOSIT` is accepted; `SAMPLE_REBATE` or any other non-`CUSTOMER_DEPOSIT` `accountType` is rejected before account balance, deposit batch, or fund flow mutation. There is no API path diff in the `CR-20260625T042041Z-change` fund concurrency slice.
- `POST /business/customer/{customerId}/fund/deposit` request body must include `idempotentKey`. The customer Vue page generates a hidden stable key when the deposit dialog opens and submits that same key with the payload; `ruoyi-ui/src/api/customer.js` and the API path stay unchanged. The backend records `(biz_type, idempotent_key)` in `idempotent_request`, hashes normalized fields instead of raw JSON, returns the original fund flow on same-key/same-hash `SUCCESS`, rejects same-key/same-hash `PROCESSING` as still processing, and rejects same-key/different-hash with `幂等键已被不同请求使用`.
- `POST /business/customer/{customerId}/fund/deposit` is deposit-in only: omitted `flowType` or `DEPOSIT_IN` records an incoming deposit; `DEPOSIT_DEDUCT`, `DEPOSIT_REFUND`, `DEPOSIT_ADJUST`, and `DEPOSIT_REVERSE` are rejected with `定金录入接口只允许入金，扣减、退款、调整、冲正请走独立资金处理流程。`
- Sample rebate must enter through `POST /business/customer/{customerId}/sample-rebate`, which creates `sample_rebate_record` and then lets the internal service write `SAMPLE_REBATE_GENERATE` against the `SAMPLE_REBATE` account.
- `POST /business/customer/{customerId}/sample-rebate` request body must include `idempotentKey`. The customer Vue page generates a hidden stable key when the sample-rebate dialog opens and submits that same key with the payload; `ruoyi-ui/src/api/customer.js` and the API path stay unchanged. The backend records `(biz_type, idempotent_key)` in `idempotent_request`, hashes normalized fields instead of raw JSON, returns the original sample rebate record on same-key/same-hash `SUCCESS`, rejects same-key/same-hash `PROCESSING` as still processing, and rejects same-key/different-hash with `幂等键已被不同请求使用`.
- Idempotency request hashes are canonicalized from `biz_type`, `customer_id`, normalized `account_type`, normalized `flow_type`, amount scaled to 2 decimals, trimmed `receipt_no`, trimmed `sample_order_no`, `support_mode`, normalized `total_support_rate`, normalized `instant_discount_rate`, and operator scope.
- The idempotency row, customer fund account update, `customer_fund_flow`, `customer_deposit_batch`, and `sample_rebate_record` updates run inside one Spring transaction boundary. Business failures roll back the idempotency insert/update with the business mutation so failed requests can be safely retried.
- Current customer APIs do not implement `CUSTOMER_DEPOSIT` deduction, refund, adjustment, or reversal. Delivery / finance contracts must define those operations later, and every fund mutation must write `customer_fund_flow`.
- `SAMPLE_REBATE` deduction is also reserved for later delivery / finance contracts.
- Public customers must be rejected by customer-level deposit, sample-policy save, and sample-rebate generation operations.
- Fund account balances must not be modified by ad hoc APIs. Mutating fund endpoints must call `CustomerFundService`, lock the `customer_fund_account` row with `selectFundAccountForUpdate`, update balances, and write `customer_fund_flow` in the same Spring transaction. Missing account creation and `flow_no` / `deposit_batch_no` unique-key collisions must be handled with bounded `DuplicateKeyException` retry.
- Salesman ownership uses existing RuoYi user, role, and dept structures. This feature must not create a separate salesman-management API.
- `GET /business/customer/salesmen` 业务员候选只返回拥有销售/业务员角色的正常用户；若无匹配返回空列表并提示先配置销售角色，不回退到全部用户。The endpoint path and payload shape stay unchanged.
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
