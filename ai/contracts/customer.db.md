# 客户管理 Database Ownership Contract

Feature ID: `customer`

## Owned Database Objects

- `customer`
- `customer_contact`
- `customer_address`
- `customer_salesman_bind_log`
- `customer_fund_account`
- `customer_fund_flow`
- `customer_deposit_batch`
- `customer_sample_policy`
- `sample_rebate_record`

DDL, menu SQL, and permission SQL are documented in `sql/customer.ownership.md`. Mapper XML ownership is `ruoyi-business/src/main/resources/mapper/customer/CustomerMapper.xml`.

## Customer Nature

- `customer.customer_nature` is required and stores `REAL` for real customers or `PUBLIC` for public order-classification customers.
- `customer.public_channel` stores `DIRECT_SALE` or `SELF_MEDIA` only for public customers.
- Seed rows include `PUB_DIRECT_SALE / 厂内自销客户 / PUBLIC / DIRECT_SALE` and `PUB_SELF_MEDIA / 自媒体客户 / PUBLIC / SELF_MEDIA`.
- PUBLIC customers are fixed system classification rows. Normal customer APIs must not create, edit, delete, stop, or transfer ownership for them.
- PUBLIC customer `customer_type` is fixed to `OTHER` and `customer_level` is fixed to `NORMAL` only for technical compatibility. UI must not display those values as real-customer type/level labels.
- `uk_customer_public_channel (customer_nature, public_channel)` prevents duplicate PUBLIC rows per channel while allowing multiple REAL rows with `public_channel` null.
- Public customers do not own customer-level deposit, sample policy, sample rebate, fixed owner, default contact, or default shipping-address behavior. Actual buyer/order contact/address/source data belongs to the later sales-order module.

## Customer Ownership

- `customer.owner_type` stores `FACTORY`, `SALESMAN`, or `NONE`.
- `customer.owner_source` stores `FACTORY_POOL`, `FACTORY_ASSIGNED`, `SALESMAN_SELF`, or `NONE`.
- `customer.owner_profit_mode` stores `NONE`, `MAINTENANCE_FEE`, or `SALES_COMMISSION`.
- `customer.owner_effective_time` records when the current ownership rule starts to apply.
- New `REAL` customers default to `FACTORY / FACTORY_POOL / NONE` and do not require `owner_user_id`.
- `REAL + SALESMAN + FACTORY_ASSIGNED` requires `owner_user_id` and uses `MAINTENANCE_FEE`.
- `REAL + SALESMAN + SALESMAN_SELF` requires `owner_user_id` and uses `SALES_COMMISSION`.
- `PUBLIC` customers must use `NONE / NONE / NONE`, keep owner user/dept fields null, and cannot be changed through owner-change operations.
- `customer_salesman_bind_log` records old/new owner type, source, profit mode, effective time, owner user, and owner dept so later audits can distinguish factory pool, factory-assigned maintenance, salesman-self, and return-to-factory changes.
- Customer management records ownership/profit mode only. It does not calculate maintenance fees, calculate sales commissions, or recalculate historical orders.

## Address Code Fields

- `customer.province_code`, `customer.city_code`, and `customer.district_code` store nullable administrative division codes for the customer master address.
- `customer_address.province_code`, `customer_address.city_code`, and `customer_address.district_code` store nullable administrative division codes for shipping addresses.
- Chinese names remain in `province`, `city`, and `district` for list, detail, and export display.
- This project is still in development; the SQL ownership file documents the final initialized structure and does not include old-data compatibility migrations.

## Fund Rule

- `customer_fund_account.account_type` allows only `CUSTOMER_DEPOSIT` and `SAMPLE_REBATE`.
- `customer_deposit_batch.deposit_type` allows only `CUSTOMER_DEPOSIT`.
- Customer deposit flow types are `DEPOSIT_IN`, `DEPOSIT_DEDUCT`, `DEPOSIT_REFUND`, `DEPOSIT_ADJUST`, and `DEPOSIT_REVERSE`.
- `customer_fund_account.balance_amount`, `frozen_amount`, and `available_amount` are derived from fund entries.
- Direct manual balance update is not an allowed business operation.
- Every fund mutation must insert `customer_fund_flow` with operator, time, amount, before balance, after balance, related business metadata, and remark.
- Customer-level deposit entries must also create `customer_deposit_batch` records and set fund-flow `related_biz_type=CUSTOMER_DEPOSIT_BATCH`.
- Sample rebate generation must create `sample_rebate_record` and matching `SAMPLE_REBATE_GENERATE` flow.

## Delete Rule

- Customer removal is logical delete or status stop for business use.
- Built-in PUBLIC customers must not be logically deleted or stopped through normal customer operations.
- Physical deletion must be blocked once future order, shipment, settlement, or finance modules depend on the customer.
- A feature can only be fully removed when database, menu, permission, mapper XML, and seed ownership are registered.

## Verification

- `npm run scan:db`
- `npm run check:ownership`
