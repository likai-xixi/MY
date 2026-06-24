# Handover

## Summary

`CR-20260623T144532Z-change` adds customer add/edit mobile-phone format validation while preserving the existing REAL/PUBLIC customer model and unified deposit model.

## Impact

This change stays inside customer management validation:

- Frontend add/edit validates REAL master `contactPhone` as an 11-digit mainland China mobile number.
- Frontend validates optional contact-tab phone and shipping-address receiver phone only when users fill them.
- Backend service fallback enforces the same REAL-only master phone rule and optional child-phone rule for direct API saves.
- PUBLIC customers still skip real-customer contact/phone/owner/address validation and continue clearing those fields before save.

No SQL structure, API path, permission code, customer deposit, sample rebate, sales-order, delivery, finance, automatic deduction, receipt claiming, reconciliation, order-level deposit, or buyer snapshot scope was changed.

## Changed Files

- `ruoyi-ui/src/views/customer/index.vue`
- `ruoyi-business/src/main/java/com/ruoyi/business/customer/service/impl/CustomerServiceImpl.java`
- `features/customer.md`
- `ai/contracts/customer.ui.md`
- `ai/changes/CR-20260623T144532Z-change/`
- `memory/PROJECT_STATE.md`
- `memory/TASKS.json`
- `memory/HANDOVER.md`
- `memory/CHANGELOG.md`
- `memory/sessions/2026-06-23-customer-required-validation.md`

`changed-files.json` also includes previously untracked `CR-20260623T134224Z-change` evidence and generated scan/registry/memory paths already present in the current working tree.

## Verification

Already passed:

- cached Maven backend compile.
- frontend `npm --prefix ruoyi-ui run build:prod`.
- cached Maven backend package for runtime API validation.
- API validation for REAL empty phone, short phone, invalid 11-digit phone, valid 11-digit phone, invalid REAL update phone, invalid contact child phone, invalid address receiver phone, and PUBLIC invalid phone clearing.
- captcha restored to `captchaEnabled=true` after runtime validation.
- `npm run scan:all`.
- `npm run finalize:change -- --summary "客户管理联系电话手机号校验"`.
- `npm run check`.
- standalone `npm test`.
- `git diff --check`.

## Commands

- `npm run resume`
- `npm run ai:do -- "功能迭代：客户管理"`
- `npm run impact -- 客户管理`
- `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests compile`
- `npm --prefix ruoyi-ui run build:prod`
- `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests package`
- Runtime API validation against `http://localhost:18080/business/customer`
- `npm run scan:all`
- `npm run finalize:change -- --summary "客户管理联系电话手机号校验"`
- `npm run check` failed once because `memory/HANDOVER.md` lacked `## Commands`; the heading was added and the gate must be rerun.
- `npm run check` passed after adding current-change component/boundary exceptions and explicit verification evidence.
- `npm test`
- `git diff --check`

Final closeout gates passed.

## Runtime Notes

Runtime validation used backend `http://localhost:18080` and database `my_ry_vue_runtime`. Captcha was temporarily disabled to obtain an API token, then restored and confirmed through `/captchaImage`.

## Risks

- Browser click validation was not rerun in this closeout because direct in-app browser control was not available in the current tool context. Frontend source-rule checks, production build, runtime API validation, and governance gates passed.
- The default `ry-vue` database remains unsuitable for current customer runtime validation until rebuilt to the final customer DDL.

## Next Actions

The change is ready for user review. Keep all future sales-order, delivery, finance, automatic deduction, receipt claiming, reconciliation, order-level deposit, and buyer snapshot behavior out of customer management.
