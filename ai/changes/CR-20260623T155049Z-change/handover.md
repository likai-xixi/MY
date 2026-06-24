# Handover

## Summary

Customer management now records factory ownership defaults and salesman maintenance/self-owned profit-mode口径 for real customers.

## Impact

- Added final customer owner fields to `customer`: `owner_type`, `owner_source`, `owner_profit_mode`, `owner_effective_time`.
- Added old/new owner口径 fields to `customer_salesman_bind_log`.
- `REAL` customer saves now normalize owner rules:
  - default `FACTORY / FACTORY_POOL / NONE`;
  - `SALESMAN / FACTORY_ASSIGNED / MAINTENANCE_FEE`;
  - `SALESMAN / SALESMAN_SELF / SALES_COMMISSION`.
- `PUBLIC` customers remain `NONE / NONE / NONE`, no fixed owner, and no owner-change operation.
- Existing `PUT /business/customer/transferOwner` is reused as owner change.
- Customer management only records ownership/profit口径 and `ownerEffectiveTime`; it does not calculate maintenance fee, sales commission, or rewrite historical sales orders.

## Verification

Passed:

- cached Maven backend compile;
- frontend `build:prod`;
- `npm run scan:all`;
- cached Maven package after stopping the locked MY backend jar;
- runtime DB adjustment and public seed verification;
- runtime API validation;
- DB owner-log validation;
- browser validation;
- `npm run finalize:change -- --summary "客户管理厂内归属与业务员维护口径"`;
- captcha restore check;
- `git diff --check`.

Failed/blocked by unrelated scaffold baseline:

- `npm run check` fails at `check:components` because existing RuoYi built-in `system/role/selectUser.vue` and `tool/*` dialog/form files are flagged as reusable controls.
- `npm test` fails `boundary-lint.test.js` and `component-checker.test.js` because existing RuoYi router/tool imports and built-in controls are flagged by governance tests.

## Boundaries

This change does not add sales-order, delivery, finance, maintenance-fee calculation, commission calculation, performance reports, salesman-management tables, customer public pool, automatic deduction, receipt claiming, reconciliation, order-level deposit, or buyer snapshots. Later sales-order work should freeze ownership snapshots at order submission time.

## Next Actions

Decide separately whether to fix or explicitly exempt the existing RuoYi `system/tool` governance baseline findings. Keep that as a governance/base-adapter change, not part of this customer business iteration.
