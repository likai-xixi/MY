# Verification

Status: verified

## Commands

- `npm run resume`
- `npm run ai:do -- "功能迭代：客户管理"`
- `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests compile`
- `npm --prefix ruoyi-ui run build:prod`
- `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests package`
- Backend restarted on `18080`; frontend restarted on `5174` with `RUOYI_API_BASE=http://127.0.0.1:18080`
- `npm run scan:all`
- `npm run finalize:change -- --summary "客户管理默认联系人和默认收货地址自动生成及同步"`
- `npm run check`
- `npm test`

## Runtime Evidence

- `runtime-evidence/default-child-api-verification-utf8.json`
- `runtime-evidence/default-child-db-verification-staged-utf8.txt`
- `runtime-evidence/validated-customer-id-utf8.txt`
- `runtime-evidence/validated-customer-name-utf8.txt`
- `runtime-evidence/transaction-code-evidence.txt`
- `runtime-evidence/browser-01-filtered-customer-list.png`
- `runtime-evidence/browser-03-detail-base-tab.png`
- `runtime-evidence/browser-04-detail-contact-tab-dom.txt`
- `runtime-evidence/browser-05-detail-address-tab-dom.txt`
- `component-exception.md`
- `boundary-exception.md`

## Acceptance Results

- Created `默认同步UTF8验证客户20260622162301` as `KH202606000010`.
- Create auto-generated one default contact and one default shipping address from master fields.
- Edit with `syncDefaultContact=false` and `syncDefaultAddress=false` did not overwrite default child records.
- Edit with both sync flags true updated only the default contact/default shipping address.
- Existing default-address `logistics_line=保留线路UTF8` was preserved during sync.
- Active default contacts = `1`; active default shipping addresses = `1`.
- Transaction boundary verified in `CustomerServiceImpl`: create/update default-child preparation runs inside the existing `@Transactional` customer save methods.
- Component gate passed with a current-change exception limited to pre-existing RuoYi platform/system/tool files; no customer-local reusable component was added.
- Boundary gate passed with a current-change exception limited to pre-existing RuoYi router/tool-generator imports; no customer cross-feature import was added.

## Notes

The in-app browser screenshot API timed out when switching Element Plus drawer tabs for contacts and addresses. The base detail view is captured as an image; contact/address tab contents are captured as DOM text evidence with the visible default contact/address values.
