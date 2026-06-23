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

## Address Code Fields

- `customer.province_code`, `customer.city_code`, and `customer.district_code` store nullable administrative division codes for the customer master address.
- `customer_address.province_code`, `customer_address.city_code`, and `customer_address.district_code` store nullable administrative division codes for shipping addresses.
- Chinese names remain in `province`, `city`, and `district` for list, detail, and export display.
- Historical rows without code fields are allowed. They should not be force-backfilled unless an operator runs a separately reviewed name-to-code migration; the customer edit UI can match known Chinese names and write codes on the next save.

## Fund Rule

- `customer_fund_account.balance_amount`, `frozen_amount`, and `available_amount` are derived from fund entries.
- Direct manual balance update is not an allowed business operation.
- Every fund mutation must insert `customer_fund_flow` with operator, time, amount, before balance, after balance, related business metadata, and remark.
- Long-term and rolling deposits must also create `customer_deposit_batch` records.
- Sample rebate generation must create `sample_rebate_record` and matching `SAMPLE_REBATE_GENERATE` flow.

## Delete Rule

- Customer removal is logical delete or status stop for business use.
- Physical deletion must be blocked once future order, shipment, settlement, or finance modules depend on the customer.
- A feature can only be fully removed when database, menu, permission, mapper XML, and seed ownership are registered.

## Verification

- `npm run scan:db`
- `npm run check:ownership`
