# Verification

Status: verified

## Commands

- `npm run resume` passed and reported current change `CR-20260623T134224Z-change`.
- `npm run ai:do -- "功能迭代：客户管理"` created/opened this customer update change record. The first run timed out after creating the record; `npm run resume` confirmed it became current.
- `npm run impact -- 客户管理` passed with customer allowed edit roots.
- `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests compile` passed.
- `npm --prefix ruoyi-ui run build:prod` passed.
- `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests package` passed after stopping the previous MY backend process that locked `ruoyi-admin.jar`.
- Runtime backend restarted on `http://localhost:18080` against `my_ry_vue_runtime`.
- `npm run scan:all` passed.
- `npm run finalize:change -- --summary "客户管理新增编辑非空校验"` passed.

## Evidence

This substantive customer validation change has both backend API/runtime evidence and frontend browser evidence recorded below. The evidence covers missing-field rejection, valid REAL save behavior, PUBLIC field clearing, and REAL/PUBLIC frontend validation switching.

## Backend Runtime Evidence

- Temporarily disabled captcha in the local development DB for API validation, then restored it to `true` and restarted the MY backend. Final `/captchaImage` check returned `captchaEnabled=True`.
- Direct API validation against `/business/customer` rejected REAL create payloads with:
  - `客户名称不能为空`
  - `客户类型不能为空`
  - `客户等级不能为空`
  - `主联系人不能为空`
  - `联系电话不能为空`
  - `归属业务员不能为空`
  - `省市区不能为空`
  - `详细地址不能为空`
- Direct API validation rejected REAL update with empty `contactName` using `主联系人不能为空`.
- Direct API validation rejected PUBLIC create without `publicChannel` using `公共渠道不能为空`.
- Direct API validation created a REAL customer with blank `shortName`; detail confirmed `shortName` defaulted to `customerName`, one default contact, and one default shipping address.
- Direct API validation created PUBLIC customer ID `10`; DB/detail checks confirmed contact, phone, owner, address, contacts, and addresses were cleared.
- Direct API validation updated PUBLIC customer ID `10` with malicious contact/address/owner child payloads; detail confirmed `publicChannel=SELF_MEDIA`, contacts `0`, addresses `0`, and real-customer fields remained empty.

## Frontend Browser Evidence

- Browser opened `http://127.0.0.1:5174/business/customer` with a fresh `Admin-Token` cookie.
- Add customer dialog opened in REAL mode.
- Submitting empty REAL form showed frontend errors:
  - `客户名称不能为空`
  - `主联系人不能为空`
  - `联系电话不能为空`
  - `归属业务员不能为空`
  - `省市区请选择完整到区县`
  - `详细地址不能为空`
- Switching REAL -> PUBLIC cleared REAL-only validation messages and showed the public-channel field.
- Submitting PUBLIC without public channel showed `公共渠道不能为空` and did not show REAL-only contact/address errors.
- Switching PUBLIC -> REAL cleared the PUBLIC-only public-channel error; submitting again re-enabled REAL-only required errors.

## Scope Checks

- No SQL structure, API path, permission code, sales order, delivery, finance, automatic deduction, receipt claiming, reconciliation, order-level deposit, or buyer-snapshot module was added.
- Existing unified deposit model remained unchanged: no `LONG_TERM_DEPOSIT` / `ROLLING_ORDER_DEPOSIT` compatibility was introduced.
- Customer short name, WeChat, remark, generated customer code, status default, owner department derivation, default contact/address sync, public-customer clearing, and customer fund model were kept in their existing scope.

## Final Gates

- `npm run check` passed, including `close:change`, runtime checker, and 97 Node tests.
- Standalone `npm test` passed with 97 Node tests.
- `git diff --check` passed. It emitted a line-ending warning for `memory/CHANGELOG.md` (`CRLF will be replaced by LF the next time Git touches it`) but reported no whitespace errors.
