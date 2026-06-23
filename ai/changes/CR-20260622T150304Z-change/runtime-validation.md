# Customer Default Contact And Address Runtime Validation

Date: 2026-06-22

## Scope

This change only updates customer / 客户管理 default child-data behavior:

- Create customer: auto-create one default contact from master contact data when no meaningful contact is submitted.
- Create customer: auto-create one default shipping address from master contact/address data when no meaningful address is submitted and detail address exists.
- Edit customer: do not overwrite child data unless the user explicitly checks `同步到默认联系人` or `同步到默认收货地址`.
- Keep all behavior inside the existing customer RuoYi adapter module. No sales order, shipment, finance, profile, scanner, rule, workflow, or governance-script changes.

## Environment

- Database: local schema `my_ry_vue_runtime`.
- Backend: `http://127.0.0.1:18080`, packaged `D:\Project\MY\ruoyi-admin\target\ruoyi-admin.jar`.
- Frontend: `http://127.0.0.1:5174`, `vite --host 127.0.0.1 --port 5174 --strictPort`.
- Runtime route: `/business/customer`.
- Evidence directory: `ai/changes/CR-20260622T150304Z-change/runtime-evidence/`.

## Build And Restart Evidence

- `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests compile` passed.
- `npm --prefix ruoyi-ui run build:prod` passed.
- First backend package attempt failed because the running MY `ruoyi-admin.jar` locked the target jar. After stopping only MY backend/frontend processes, `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests package` passed.
- Restart verified MY backend PID `43360` on port `18080` with command line containing `D:\Project\MY\ruoyi-admin\target\ruoyi-admin.jar`.
- Restart verified MY frontend Vite on port `5174` with command line containing `D:\Project\MY\ruoyi-ui`.
- The first frontend restart used the wrong proxy target and produced an invalid-session symptom. It was corrected by restarting the MY frontend with `RUOYI_API_BASE=http://127.0.0.1:18080`.
- `GET http://127.0.0.1:18080/captchaImage` returned HTTP 200.
- `GET http://127.0.0.1:5174/` returned HTTP 200.

## Runtime Checks

- Browser login was completed after explicit user permission to solve the local test CAPTCHA.
- API/runtime validation created customer `默认同步UTF8验证客户20260622162301` (`customer_id=17`, `customer_code=KH202606000010`).
- Create validation passed: the backend auto-created one default contact from master contact/phone/WeChat and one default shipping address from master contact/phone/area/detail-address fields.
- No-sync edit validation passed: changing master contact/phone/WeChat/detail-address with `syncDefaultContact=false` and `syncDefaultAddress=false` did not overwrite the default contact or default shipping address.
- Sync edit validation passed: changing master contact/phone/WeChat/area/detail-address with both sync flags true updated only the active default contact/default shipping address.
- Default uniqueness validation passed: active default contacts = `1`; active default shipping addresses = `1`.
- Default shipping-address sync preserved existing `logistics_line=保留线路UTF8`.
- Transaction boundary was verified by code evidence: create and update default-child preparation run inside the existing `@Transactional` customer create/update methods; if child replacement fails, the customer save rolls back with the same transaction.

## Evidence

- `runtime-evidence/default-child-api-verification-utf8.json`
- `runtime-evidence/default-child-db-verification-staged-utf8.txt`
- `runtime-evidence/validated-customer-id-utf8.txt`
- `runtime-evidence/validated-customer-name-utf8.txt`
- `runtime-evidence/transaction-code-evidence.txt`
- `runtime-evidence/browser-01-filtered-customer-list.png`
- `runtime-evidence/browser-03-detail-base-tab.png`
- `runtime-evidence/browser-04-detail-contact-tab-dom.txt`
- `runtime-evidence/browser-05-detail-address-tab-dom.txt`

The in-app browser screenshot API timed out when switching the Element Plus detail drawer to the contact/address tabs, so the tab-specific evidence is stored as DOM text. The DOM evidence contains the visible detail drawer text for default contact `同步后主联系人C`, WeChat `wx_sync_20260622160603`, default address `同步后默认地址20260622160603`, and preserved logistics line `保留线路`. Browser base-detail screenshot evidence is available in `browser-03-detail-base-tab.png`.

## Final Gate Plan

Final gates for this change are: `npm run scan:all`, `npm run finalize:change -- --summary "客户管理默认联系人和默认收货地址自动生成及同步"`, `npm run check`, and standalone `npm test`.
