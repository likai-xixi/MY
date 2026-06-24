# API Catalog

## /monitor/cache

- Method: `GET`
- Path: `/monitor/cache`
- Owner: `monitor`
- Module: `monitor`

## /monitor/cache/clearCacheAll

- Method: `DELETE`
- Path: `/monitor/cache/clearCacheAll`
- Owner: `monitor`
- Module: `monitor`

## /monitor/cache/clearCacheKey

- Method: `DELETE`
- Path: `/monitor/cache/clearCacheKey/{cacheKey}`
- Owner: `monitor`
- Module: `monitor`

## /monitor/cache/clearCacheName

- Method: `DELETE`
- Path: `/monitor/cache/clearCacheName/{cacheName}`
- Owner: `monitor`
- Module: `monitor`

## /monitor/cache/getKeys

- Method: `GET`
- Path: `/monitor/cache/getKeys/{cacheName}`
- Owner: `monitor`
- Module: `monitor`

## /monitor/cache/getNames

- Method: `GET`
- Path: `/monitor/cache/getNames`
- Owner: `monitor`
- Module: `monitor`

## /monitor/cache/getValue

- Method: `GET`
- Path: `/monitor/cache/getValue/{cacheName}/{cacheKey}`
- Owner: `monitor`
- Module: `monitor`

## /monitor/job

- Method: `POST`
- Path: `/monitor/job`
- Owner: `monitor`
- Module: `monitor`

## /monitor/job/changeStatus

- Method: `PUT`
- Path: `/monitor/job/changeStatus`
- Owner: `monitor`
- Module: `monitor`

## /monitor/job/list

- Method: `GET`
- Path: `/monitor/job/list`
- Owner: `monitor`
- Module: `monitor`

## /monitor/job/run

- Method: `PUT`
- Path: `/monitor/job/run`
- Owner: `monitor`
- Module: `monitor`

## /monitor/jobLog

- Method: `POST`
- Path: `/monitor/jobLog/export`
- Owner: `monitor`
- Module: `monitor`

## /monitor/jobLog/clean

- Method: `DELETE`
- Path: `/monitor/jobLog/clean`
- Owner: `monitor`
- Module: `monitor`

## /monitor/jobLog/list

- Method: `GET`
- Path: `/monitor/jobLog/list`
- Owner: `monitor`
- Module: `monitor`

## /monitor/logininfor

- Method: `POST`
- Path: `/monitor/logininfor/export`
- Owner: `monitor`
- Module: `monitor`

## /monitor/logininfor/clean

- Method: `DELETE`
- Path: `/monitor/logininfor/clean`
- Owner: `monitor`
- Module: `monitor`

## /monitor/logininfor/list

- Method: `GET`
- Path: `/monitor/logininfor/list`
- Owner: `monitor`
- Module: `monitor`

## /monitor/logininfor/unlock

- Method: `GET`
- Path: `/monitor/logininfor/unlock/{userName}`
- Owner: `monitor`
- Module: `monitor`

## /monitor/online

- Method: `DELETE`
- Path: `/monitor/online/{tokenId}`
- Owner: `monitor`
- Module: `monitor`

## /monitor/online/list

- Method: `GET`
- Path: `/monitor/online/list`
- Owner: `monitor`
- Module: `monitor`

## /monitor/operlog

- Method: `POST`
- Path: `/monitor/operlog/export`
- Owner: `monitor`
- Module: `monitor`

## /monitor/operlog/clean

- Method: `DELETE`
- Path: `/monitor/operlog/clean`
- Owner: `monitor`
- Module: `monitor`

## /monitor/operlog/list

- Method: `GET`
- Path: `/monitor/operlog/list`
- Owner: `monitor`
- Module: `monitor`

## /monitor/server

- Method: `GET`
- Path: `/monitor/server`
- Owner: `monitor`
- Module: `monitor`

## /system/config

- Method: `POST`
- Path: `/system/config`
- Owner: `system`
- Module: `system`

## /system/config/configKey

- Method: `GET`
- Path: `/system/config/configKey/{configKey}`
- Owner: `system`
- Module: `system`

## /system/config/list

- Method: `GET`
- Path: `/system/config/list`
- Owner: `system`
- Module: `system`

## /system/config/refreshCache

- Method: `DELETE`
- Path: `/system/config/refreshCache`
- Owner: `system`
- Module: `system`

## /system/dept

- Method: `POST`
- Path: `/system/dept`
- Owner: `system`
- Module: `system`

## /system/dept/list

- Method: `GET`
- Path: `/system/dept/list`
- Owner: `system`
- Module: `system`

## /system/dept/list/exclude

- Method: `GET`
- Path: `/system/dept/list/exclude/{deptId}`
- Owner: `system`
- Module: `system`

## /system/dept/updateSort

- Method: `PUT`
- Path: `/system/dept/updateSort`
- Owner: `system`
- Module: `system`

## /system/dict/data

- Method: `POST`
- Path: `/system/dict/data`
- Owner: `system`
- Module: `system`

## /system/dict/data/list

- Method: `GET`
- Path: `/system/dict/data/list`
- Owner: `system`
- Module: `system`

## /system/dict/data/type

- Method: `GET`
- Path: `/system/dict/data/type/{dictType}`
- Owner: `system`
- Module: `system`

## /system/dict/type

- Method: `POST`
- Path: `/system/dict/type`
- Owner: `system`
- Module: `system`

## /system/dict/type/list

- Method: `GET`
- Path: `/system/dict/type/list`
- Owner: `system`
- Module: `system`

## /system/dict/type/optionselect

- Method: `GET`
- Path: `/system/dict/type/optionselect`
- Owner: `system`
- Module: `system`

## /system/dict/type/refreshCache

- Method: `DELETE`
- Path: `/system/dict/type/refreshCache`
- Owner: `system`
- Module: `system`

## /system/menu

- Method: `POST`
- Path: `/system/menu`
- Owner: `system`
- Module: `system`

## /system/menu/list

- Method: `GET`
- Path: `/system/menu/list`
- Owner: `system`
- Module: `system`

## /system/menu/roleMenuTreeselect

- Method: `GET`
- Path: `/system/menu/roleMenuTreeselect/{roleId}`
- Owner: `system`
- Module: `system`

## /system/menu/treeselect

- Method: `GET`
- Path: `/system/menu/treeselect`
- Owner: `system`
- Module: `system`

## /system/menu/updateSort

- Method: `PUT`
- Path: `/system/menu/updateSort`
- Owner: `system`
- Module: `system`

## /system/notice

- Method: `POST`
- Path: `/system/notice`
- Owner: `system`
- Module: `system`

## /system/notice/list

- Method: `GET`
- Path: `/system/notice/list`
- Owner: `system`
- Module: `system`

## /system/notice/listTop

- Method: `GET`
- Path: `/system/notice/listTop`
- Owner: `system`
- Module: `system`

## /system/notice/markRead

- Method: `POST`
- Path: `/system/notice/markRead`
- Owner: `system`
- Module: `system`

## /system/notice/markReadAll

- Method: `POST`
- Path: `/system/notice/markReadAll`
- Owner: `system`
- Module: `system`

## /system/notice/readUsers/list

- Method: `GET`
- Path: `/system/notice/readUsers/list`
- Owner: `system`
- Module: `system`

## /system/post

- Method: `POST`
- Path: `/system/post`
- Owner: `system`
- Module: `system`

## /system/post/list

- Method: `GET`
- Path: `/system/post/list`
- Owner: `system`
- Module: `system`

## /system/role

- Method: `POST`
- Path: `/system/role`
- Owner: `system`
- Module: `system`

## /system/role/authUser/allocatedList

- Method: `GET`
- Path: `/system/role/authUser/allocatedList`
- Owner: `system`
- Module: `system`

## /system/role/authUser/cancel

- Method: `PUT`
- Path: `/system/role/authUser/cancel`
- Owner: `system`
- Module: `system`

## /system/role/authUser/cancelAll

- Method: `PUT`
- Path: `/system/role/authUser/cancelAll`
- Owner: `system`
- Module: `system`

## /system/role/authUser/selectAll

- Method: `PUT`
- Path: `/system/role/authUser/selectAll`
- Owner: `system`
- Module: `system`

## /system/role/authUser/unallocatedList

- Method: `GET`
- Path: `/system/role/authUser/unallocatedList`
- Owner: `system`
- Module: `system`

## /system/role/changeStatus

- Method: `PUT`
- Path: `/system/role/changeStatus`
- Owner: `system`
- Module: `system`

## /system/role/dataScope

- Method: `PUT`
- Path: `/system/role/dataScope`
- Owner: `system`
- Module: `system`

## /system/role/deptTree

- Method: `GET`
- Path: `/system/role/deptTree/{roleId}`
- Owner: `system`
- Module: `system`

## /system/role/list

- Method: `GET`
- Path: `/system/role/list`
- Owner: `system`
- Module: `system`

## /system/user

- Method: `POST`
- Path: `/system/user`
- Owner: `system`
- Module: `system`

## /system/user/authRole

- Method: `PUT`
- Path: `/system/user/authRole`
- Owner: `system`
- Module: `system`

## /system/user/changeStatus

- Method: `PUT`
- Path: `/system/user/changeStatus`
- Owner: `system`
- Module: `system`

## /system/user/deptTree

- Method: `GET`
- Path: `/system/user/deptTree`
- Owner: `system`
- Module: `system`

## /system/user/list

- Method: `GET`
- Path: `/system/user/list`
- Owner: `system`
- Module: `system`

## /system/user/profile

- Method: `GET`
- Path: `/system/user/profile`
- Owner: `system`
- Module: `system`

## /system/user/profile/avatar

- Method: `POST`
- Path: `/system/user/profile/avatar`
- Owner: `system`
- Module: `system`

## /system/user/profile/updatePwd

- Method: `PUT`
- Path: `/system/user/profile/updatePwd`
- Owner: `system`
- Module: `system`

## /system/user/resetPwd

- Method: `PUT`
- Path: `/system/user/resetPwd`
- Owner: `system`
- Module: `system`

## /tool/gen

- Method: `PUT`
- Path: `/tool/gen`
- Owner: `tool`
- Module: `tool`

## /tool/gen/createTable

- Method: `POST`
- Path: `/tool/gen/createTable`
- Owner: `tool`
- Module: `tool`

## /tool/gen/db/list

- Method: `GET`
- Path: `/tool/gen/db/list`
- Owner: `tool`
- Module: `tool`

## /tool/gen/genCode

- Method: `GET`
- Path: `/tool/gen/genCode/{tableName}`
- Owner: `tool`
- Module: `tool`

## /tool/gen/importTable

- Method: `POST`
- Path: `/tool/gen/importTable`
- Owner: `tool`
- Module: `tool`

## /tool/gen/list

- Method: `GET`
- Path: `/tool/gen/list`
- Owner: `tool`
- Module: `tool`

## /tool/gen/preview

- Method: `GET`
- Path: `/tool/gen/preview/{tableId}`
- Owner: `tool`
- Module: `tool`

## /tool/gen/synchDb

- Method: `GET`
- Path: `/tool/gen/synchDb/{tableName}`
- Owner: `tool`
- Module: `tool`

## /business/customer/list

- Method: `GET`
- Path: `/business/customer/list`
- Owner: `customer`
- Module: `customer`
- Notes: Lists customer master data and supports filtering by `customerNature` (`REAL` or `PUBLIC`), `publicChannel` (`DIRECT_SALE` or `SELF_MEDIA`), and `ownerType` (`FACTORY`, `SALESMAN`, `NONE`). Rows include `ownerSource`, `ownerProfitMode`, and `ownerEffectiveTime`; public customers are fixed system classification rows and UI clients must not display their technical `OTHER/NORMAL` values as real-customer type/level labels.

## /business/customer/export

- Method: `POST`
- Path: `/business/customer/export`
- Owner: `customer`
- Module: `customer`

## /business/customer/{customerId}

- Method: `GET`
- Path: `/business/customer/{customerId}`
- Owner: `customer`
- Module: `customer`

## /business/customer/duplicate-warning

- Method: `GET`
- Path: `/business/customer/duplicate-warning`
- Owner: `customer`
- Module: `customer`

## /business/customer

- Method: `POST`
- Path: `/business/customer`
- Owner: `customer`
- Module: `customer`
- Notes: Creates REAL customer master data. `customerNature` defaults to `REAL`; direct `customerNature=PUBLIC` is rejected with `公共客户由系统初始化，不允许手工新增。` New REAL customers default to factory ownership (`FACTORY / FACTORY_POOL / NONE`) and do not require `ownerUserId`; REAL salesman-owned customers require a valid owner source/profit pair. Real customers can auto-create default contact/address from master fields.

## /business/customer:update

- Method: `PUT`
- Path: `/business/customer`
- Owner: `customer`
- Module: `customer`
- Notes: Updates REAL customer master data. Built-in PUBLIC customers are rejected with `内置公共客户不允许在普通客户编辑中修改。`; REAL customers cannot be changed to PUBLIC and are rejected with `真实客户不允许改为公共客户。` Real-customer request-only booleans `syncDefaultContact` and `syncDefaultAddress` opt into syncing master fields to the current default child record or creating it when missing. REAL factory ownership clears owner user/dept; REAL salesman ownership validates owner user plus `FACTORY_ASSIGNED / MAINTENANCE_FEE` or `SALESMAN_SELF / SALES_COMMISSION`.

## /business/customer/changeStatus

- Method: `PUT`
- Path: `/business/customer/changeStatus`
- Owner: `customer`
- Module: `customer`
- Notes: Updates REAL customer status. Built-in PUBLIC customers are rejected with `内置公共客户不允许停用。`

## /business/customer/{customerIds}

- Method: `DELETE`
- Path: `/business/customer/{customerIds}`
- Owner: `customer`
- Module: `customer`
- Notes: Logically deletes REAL customers. Built-in PUBLIC customers are rejected with `内置公共客户不允许删除。`

## /business/customer/salesmen

- Method: `GET`
- Path: `/business/customer/salesmen`
- Owner: `customer`
- Module: `customer`

## /business/customer/transferOwner

- Method: `PUT`
- Path: `/business/customer/transferOwner`
- Owner: `customer`
- Module: `customer`
- Notes: Existing path now represents customer owner change. `ASSIGN_MAINTENANCE` assigns a factory customer to salesman maintenance (`FACTORY_ASSIGNED / MAINTENANCE_FEE`), `MARK_SALESMAN_SELF` records salesman-self ownership (`SALESMAN_SELF / SALES_COMMISSION`), and `RETURN_FACTORY` returns the customer to factory pool (`FACTORY_POOL / NONE`) and clears owner user/dept. Requires `changeReason`; `effectiveTime` defaults to current time. Public customers are rejected.

## /business/customer/{customerId}/owner-log

- Method: `GET`
- Path: `/business/customer/{customerId}/owner-log`
- Owner: `customer`
- Module: `customer`

## /business/customer/{customerId}/fund/accounts

- Method: `GET`
- Path: `/business/customer/{customerId}/fund/accounts`
- Owner: `customer`
- Module: `customer`
- Notes: Real customers expose `CUSTOMER_DEPOSIT` and `SAMPLE_REBATE` accounts. Public customers do not expose customer-level deposit accounts.

## /business/customer/{customerId}/fund/deposit

- Method: `POST`
- Path: `/business/customer/{customerId}/fund/deposit`
- Owner: `customer`
- Module: `customer`
- Notes: Records one unified customer deposit against `CUSTOMER_DEPOSIT`, creates a `customer_deposit_batch`, and writes a `customer_fund_flow` with related business type `CUSTOMER_DEPOSIT_BATCH`. Public customers are rejected with a service error because order-specific deposits belong to the future sales-order module.

## /business/customer/{customerId}/fund/flows

- Method: `GET`
- Path: `/business/customer/{customerId}/fund/flows`
- Owner: `customer`
- Module: `customer`

## /business/customer/{customerId}/fund/deposit-batches

- Method: `GET`
- Path: `/business/customer/{customerId}/fund/deposit-batches`
- Owner: `customer`
- Module: `customer`
- Notes: Returns unified `CUSTOMER_DEPOSIT` batches; legacy long-term or rolling-order deposit types are not part of the current model.

## /business/customer/{customerId}/sample-policy

- Method: `GET`
- Path: `/business/customer/{customerId}/sample-policy`
- Owner: `customer`
- Module: `customer`
- Notes: Real customers may use customer-level sample policy. Public customers return a disabled/no-support policy view.

## /business/customer/{customerId}/sample-policy:update

- Method: `PUT`
- Path: `/business/customer/{customerId}/sample-policy`
- Owner: `customer`
- Module: `customer`
- Notes: Saves sample policy for real customers only. Public customers are rejected because they do not enable customer-level sample policy.

## /business/customer/{customerId}/sample-rebate:create

- Method: `POST`
- Path: `/business/customer/{customerId}/sample-rebate`
- Owner: `customer`
- Module: `customer`
- Notes: Creates sample rebate records for real customers only and keeps sample rebate in `SAMPLE_REBATE`, separate from customer deposit.

## /business/customer/{customerId}/sample-rebate

- Method: `GET`
- Path: `/business/customer/{customerId}/sample-rebate`
- Owner: `customer`
- Module: `customer`
