# Runtime Validation

## Scope

Validated the backend API protections for the PUBLIC public-customer lock-down in `CR-20260623T235902Z-change`.

## Environment

- Backend: `http://localhost:18080`
- Database: `my_ry_vue_runtime`
- Redis database: `1`
- Jar: rebuilt with cached Maven command `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests package`

Captcha was temporarily disabled in `sys_config` to obtain an API token, then restored to `true`. Final `/captchaImage` check returned `captchaEnabled=true`.

## API Results

- `POST /business/customer` with `customerNature=PUBLIC` returned `公共客户由系统初始化，不允许手工新增。`
- `PUT /business/customer` for built-in `PUB_DIRECT_SALE` returned `内置公共客户不允许在普通客户编辑中修改。`
- `PUT /business/customer/changeStatus` for built-in `PUB_DIRECT_SALE` returned `内置公共客户不允许停用。`
- `PUT /business/customer/transferOwner` for built-in `PUB_DIRECT_SALE` returned `公共客户不支持归属变更`.
- `DELETE /business/customer/{id}` for built-in `PUB_DIRECT_SALE` returned `内置公共客户不允许删除。`
- `POST /business/customer` for a REAL customer using reserved code `PUB_DIRECT_SALE` returned `内置公共客户编码不允许用于普通客户。`

After rejected operations, `PUB_DIRECT_SALE` remained active with `status=0`.

## Data Note

The local runtime database still contains older PUBLIC test rows created during previous validation passes. This does not change the code or SQL ownership target, but it means the current runtime database does not yet prove the final two-row PUBLIC invariant. Rebuild or clean the development customer tables from `sql/customer.ownership.md` before claiming runtime data contains only `PUB_DIRECT_SALE` and `PUB_SELF_MEDIA`.

## UI Note

Browser-click validation was not rerun in this closeout. UI behavior is covered by source inspection and `npm --prefix ruoyi-ui run build:prod`; direct runtime verification focused on backend API protections.
