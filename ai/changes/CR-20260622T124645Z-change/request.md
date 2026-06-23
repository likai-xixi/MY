# Request

功能迭代：客户管理

本次只在 customer / 客户管理现有省市区联动基础上补齐行政区划 code 字段，不新增销售订单、发货、财务等业务模块。

## Required Scope

- Add nullable `province_code`, `city_code`, `district_code` to `customer`.
- Add nullable `province_code`, `city_code`, `district_code` to `customer_address`.
- Update SQL ownership, DB registry, customer domain/entity, customer address domain/entity, and mapper XML.
- Change customer and shipping-address Cascader save logic so values are administrative division codes while labels remain Chinese names.
- Save both code fields and Chinese `province`, `city`, `district`.
- Keep list/detail/export display as Chinese names.
- Keep historical name-only data compatible; no forced bulk backfill.

## Required Verification

- Runtime DB persistence for `河南省 / 郑州市 / 中原区 -> 410000 / 410100 / 410102`.
- Edit echo by code.
- Shipping address code persistence and echo.
- Historical name-only data does not crash.
- Backend compile, frontend build, `scan:all`, `finalize:change`, `check`, and standalone `npm test`.
