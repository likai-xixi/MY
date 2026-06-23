# 客户管理 Permission Ownership Contract

Feature ID: `customer`

## Owned Permission Codes

- Basic: `business:customer:list`, `business:customer:query`, `business:customer:add`, `business:customer:edit`, `business:customer:remove`, `business:customer:export`
- Owner: `business:customer:owner:view`, `business:customer:owner:assign`, `business:customer:owner:transfer`, `business:customer:owner:history`
- Fund: `business:customer:fund:view`, `business:customer:fund:add`, `business:customer:fund:flow`, `business:customer:fund:adjust`, `business:customer:fund:export`
- Sample policy: `business:customer:sample-policy:view`, `business:customer:sample-policy:edit`

## Menu Ownership

- `业务管理` parent menu and `客户管理` child page are documented in `sql/customer.ownership.md`.
- Customer page route is `/customer`, component is `customer/index`.
- Normal customer edit permission does not grant fund adjustment permission.

## Verification

- `npm run scan:permissions`
- `npm run check:ownership`
