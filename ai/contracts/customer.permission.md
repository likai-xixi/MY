# 客户管理 Permission Ownership Contract

Feature ID: `customer`

## Owned Permission Codes

- Basic: `business:customer:list`, `business:customer:query`, `business:customer:add`, `business:customer:edit`, `business:customer:remove`, `business:customer:export`
- Owner: `business:customer:owner:view`, `business:customer:owner:assign`, `business:customer:owner:transfer`, `business:customer:owner:history`
- Fund: `business:customer:fund:view`, `business:customer:fund:deposit`, `business:customer:fund:flow`, `business:customer:fund:adjust`, `business:customer:fund:export`
- Sample policy: `business:customer:sample-policy:view`, `business:customer:sample-policy:edit`
- Sample rebate: `business:customer:sample-rebate:create` (record reads remain under `business:customer:fund:view`)

## Menu Ownership

- `业务管理` parent menu and `客户管理` child page are documented in `sql/customer.ownership.md`.
- Customer page route is `/customer`, component is `customer/index`.
- Normal customer edit permission does not grant fund adjustment permission.
- Basic customer query does not grant owner-history, fund, fund-flow, or sample-policy access. The page calls each dedicated endpoint only after checking its exact permission.
- This iteration does not add permission codes. Public customer restrictions are enforced by customer service validation while continuing to use the existing customer, fund, and sample-policy permissions.

## Verification

- `npm run scan:permissions`
- `npm run check:ownership`
