# Runtime Validation

Date: 2026-06-23

## Scope

Runtime acceptance for `CR-20260623T105432Z-change` on the existing customer module only. No sales-order, delivery, finance, automatic deduction, receipt claiming, order-level deposit, or buyer-snapshot module was added.

## Environment

- MySQL: Docker container `mj-mysql`, database `my_ry_vue_runtime`.
- Redis: Docker container `mj-redis`, DB 1.
- Backend: `ruoyi-admin` on `http://localhost:18080`.
- Frontend: Vite dev server on `http://127.0.0.1:5174`.
- Maven: local cached Maven at `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd`.

## Development Database Rebuild

- Rebuilt customer-owned tables from the final SQL blocks in `sql/customer.ownership.md`.
- No `LONG_TERM_DEPOSIT` / `ROLLING_ORDER_DEPOSIT` compatibility migration was written or applied.
- Initialized public customers:
  - `PUB_DIRECT_SALE` / `厂内自销客户` / `PUBLIC` / `DIRECT_SALE`
  - `PUB_SELF_MEDIA` / `自媒体客户` / `PUBLIC` / `SELF_MEDIA`
- Verified invalid enum counts:
  - `customer_fund_account.account_type NOT IN ('CUSTOMER_DEPOSIT','SAMPLE_REBATE')` = `0`
  - `customer_deposit_batch.deposit_type <> 'CUSTOMER_DEPOSIT'` = `0`
  - deposit-related `customer_fund_flow.flow_type` outside `DEPOSIT_IN`, `DEPOSIT_DEDUCT`, `DEPOSIT_REFUND`, `DEPOSIT_ADJUST`, `DEPOSIT_REVERSE` = `0`

Windows console piping corrupted one initial Chinese seed import to `????`; the rows were corrected in-place with UTF-8 hex literals and verified by `HEX(customer_name)`. A stray corrupted local menu row from the same pipe attempt was removed; the correct RuoYi business/customer menu rows remained present.

## API And DB Evidence

Created runtime customers:

- REAL: `customer_id=3`, `customer_code=KH202606000001`, `customer_name=运行验收真实客户20260623115344`
- PUBLIC: `customer_id=4`, `customer_code=KH202606000002`, `customer_name=运行验收公共客户20260623115344`, `public_channel=SELF_MEDIA`

REAL customer checks:

- Add succeeded with customer name, contact, phone, province/city/district, detail address, and owner salesman.
- Edit succeeded and preserved contact/address children.
- Detail returned `contacts.length=1`, `addresses.length=1`, default contact `Y`, default address `Y`.
- Fund accounts returned only `CUSTOMER_DEPOSIT` and `SAMPLE_REBATE`.
- Deposit entry succeeded with amount `1234.56`, receipt no `RCPT-20260623115344`, and remark `运行验收定金`.
- DB confirmed:
  - `customer_fund_account.account_type = CUSTOMER_DEPOSIT`, balance `1234.56`
  - `customer_fund_flow.flow_type = DEPOSIT_IN`
  - `customer_fund_flow.related_biz_type = CUSTOMER_DEPOSIT_BATCH`
  - `customer_deposit_batch.deposit_type = CUSTOMER_DEPOSIT`

PUBLIC customer checks:

- Add succeeded without contact, phone, or address.
- Edit succeeded and kept `contacts.length=0`, `addresses.length=0`.
- Detail returned no contact/address children.
- Fund accounts returned an empty array.
- Direct customer-level deposit API call returned `code=500` with `公共客户不启用客户级定金，请在销售订单中记录本单定金。`
- Direct sample-policy API call returned `code=500` with `公共客户不启用客户级样品政策。`
- Direct sample-rebate API call returned `code=500` with `公共客户不启用客户级样品返现。`

## Browser Evidence

Opened `http://127.0.0.1:5174/business/customer` with an authenticated local browser session.

- Customer list displayed customer nature filter.
- Customer nature dropdown contained `真实客户` and `公共客户`.
- After selecting `公共客户`, public channel filter appeared.
- Public channel dropdown contained `厂内自销` and `自媒体`.
- List rows showed the REAL runtime customer, the PUBLIC runtime customer, and the two seeded public customers.
- Customer table headers included customer nature and public channel columns; no standalone customer short-name column was present.
- REAL detail showed contacts and shipping address information.
- REAL funds tab displayed only `定金` and `样品返现`.
- REAL funds tab showed `录入定金`; no `长期定金`, `滚动定金`, or `来源订单号` appeared.
- PUBLIC detail hid contact and shipping-address tabs.
- PUBLIC detail displayed `公共客户仅用于订单归类，实际购买人、联系电话、收货地址、接待业务员请在销售订单中填写。`
- PUBLIC funds tab displayed `公共客户不启用客户级定金，订单收款请在销售订单中记录本单定金。`
- PUBLIC funds tab did not display `录入定金`, `保存政策`, or `生成样品返现`.

## Runtime Fix Applied

During browser validation, PUBLIC detail initially hid contact/address tabs and fund actions correctly, but the base detail tab did not display the required public-customer classification notice. Fixed within customer UI only:

- `ruoyi-ui/src/views/customer/index.vue`: added an `el-alert` to the PUBLIC customer detail base tab.

No backend model, SQL model, API path, sales-order scope, delivery scope, or finance scope was changed.

## Additional Checks

- `rg` scan over customer backend, frontend, SQL, contracts, and feature docs found no matches for legacy long-term/rolling deposit enums or labels, and no `来源订单号` deposit text.
- Backend compile passed with cached Maven.
- Frontend `build:prod` passed.
- `npm run scan:all` passed.
- Local captcha config was temporarily disabled to obtain an API/browser token, then restored to `true`; Redis DB 1 was flushed after restoration.
