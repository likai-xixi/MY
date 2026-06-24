# Runtime Validation

## Environment

- Backend: `http://localhost:18080`
- Frontend: `http://127.0.0.1:5174/business/customer`
- Runtime DB: `my_ry_vue_runtime`
- Redis DB: `1`

## Development DB Adjustment

The local development DB was adjusted in place for runtime validation. The repository SQL remains final DDL in `sql/customer.ownership.md`; no old-data compatibility migration was added.

Applied runtime-only DB changes:

- `customer.owner_type`
- `customer.owner_source`
- `customer.owner_profit_mode`
- `customer.owner_effective_time`
- `customer_salesman_bind_log.old_owner_type`
- `customer_salesman_bind_log.new_owner_type`
- `customer_salesman_bind_log.old_owner_source`
- `customer_salesman_bind_log.new_owner_source`
- `customer_salesman_bind_log.old_owner_profit_mode`
- `customer_salesman_bind_log.new_owner_profit_mode`
- `customer_salesman_bind_log.old_owner_effective_time`
- `customer_salesman_bind_log.new_owner_effective_time`

Runtime normalization:

- Existing `PUBLIC` rows were normalized to `NONE / NONE / NONE` with owner user/dept cleared.
- Existing `REAL` rows were normalized to `FACTORY / FACTORY_POOL / NONE` with owner user/dept cleared.
- Public seed rows were verified:
  - `PUB_DIRECT_SALE | 厂内自销客户 | PUBLIC | DIRECT_SALE | NONE | NONE | NONE`
  - `PUB_SELF_MEDIA | 自媒体客户 | PUBLIC | SELF_MEDIA | NONE | NONE | NONE`

## API Validation

Captcha was temporarily disabled for token acquisition and restored afterward.

Validated through `/business/customer` APIs:

- REAL invalid phone `1856584` rejected with `联系电话必须为11位手机号`.
- New REAL without owner fields saved as `FACTORY / FACTORY_POOL / NONE` and `ownerUserId=null`.
- New REAL salesman-self saved as `SALESMAN / SALESMAN_SELF / SALES_COMMISSION`.
- New REAL factory-assigned maintenance saved as `SALESMAN / FACTORY_ASSIGNED / MAINTENANCE_FEE`.
- New PUBLIC submitted with owner/contact fields saved as `NONE / NONE / NONE`, `ownerUserId=null`.
- `PUT /business/customer/transferOwner` with `ASSIGN_MAINTENANCE` changed factory customer to `SALESMAN / FACTORY_ASSIGNED / MAINTENANCE_FEE`.
- `PUT /business/customer/transferOwner` with `RETURN_FACTORY` changed the customer back to `FACTORY / FACTORY_POOL / NONE` and cleared owner user.
- PUBLIC owner change was rejected with `公共客户不支持归属变更`.

API evidence summary:

```json
{"salesmanUserId":1,"invalidPhoneRejected":"联系电话必须为11位手机号","factoryCustomerId":17,"selfCustomerId":18,"assignedCustomerId":19,"publicCustomerId":20,"ownerLogCount":2,"publicTransferRejected":"公共客户不支持归属变更","result":"PASS"}
```

## DB Evidence

Customer rows after validation:

```text
17|OwnerFactory20260624002159|FACTORY|FACTORY_POOL|NONE|null
18|OwnerSelf20260624002159|SALESMAN|SALESMAN_SELF|SALES_COMMISSION|1
19|OwnerAssigned20260624002159|SALESMAN|FACTORY_ASSIGNED|MAINTENANCE_FEE|1
20|OwnerPublic20260624002159|NONE|NONE|NONE|null
```

Owner logs for customer `17`:

```text
FACTORY->SALESMAN|FACTORY_POOL->FACTORY_ASSIGNED|NONE->MAINTENANCE_FEE|null->1|runtime assign maintenance
SALESMAN->FACTORY|FACTORY_ASSIGNED->FACTORY_POOL|MAINTENANCE_FEE->NONE|1->null|runtime return factory
```

## Browser Validation

Validated `/business/customer` in the in-app browser:

- List search includes `归属方式`.
- Table headers include `归属方式`, `归属业务员`, and `收益口径`.
- Public rows display `无固定归属` and `无个人收益`.
- REAL salesman rows display `维护费` or `业务提成`.
- New customer dialog defaults REAL owner to `厂内`; owner salesman display is `厂内`.
- Switching owner type to `业务员` shows `归属来源`, `厂内分配维护（维护费）`, `业务员自有客户（业务提成）`, and `收益口径`.
- Switching customer nature to `PUBLIC` shows public channel and public notice, and hides owner type, owner salesman, owner source, and owner profit controls.

## Restore

- `sys.account.captchaEnabled` restored to `true`.
- Backend restarted after restore.
- `/captchaImage` returned `captchaEnabled=true`.
