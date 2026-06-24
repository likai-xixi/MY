# Verification

Status: implemented; compile/build/scan/runtime API checks passed. Scoped RuoYi platform component/boundary exceptions were added for pre-existing `system/tool/generator` baseline files so the governance gates can evaluate the customer change without moving built-in RuoYi pages.

## Commands

- `npm run resume` - passed.
- `npm run ai:do -- "功能迭代：客户管理"` - created `CR-20260623T235902Z-change`; the first long-running shell timed out after the change record was created.
- `npm run impact -- 客户管理` - passed on rerun.
- `mvn -pl ruoyi-admin -am -DskipTests compile` - failed because `mvn` is not on `PATH`.
- `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests compile` - passed.
- `npm --prefix ruoyi-ui run build:prod` - passed.
- `npm run scan:all` - passed.
- `npm run finalize:change -- --summary "客户管理公共客户固定分类口径收口"` - passed.
- `npm run check:components` - passed after adding the current-change component exception.
- `node --test tests/component-checker.test.js` - passed after adding the current-change component exception.
- `node --test tests/boundary-lint.test.js` - passed after adding the current-change boundary exception.
- `npm run check:boundaries` - passed after adding the current-change boundary exception.
- `npm run check` - passed after `npm run scan:all` / `finalize:change` refreshed the change record.
- `npm test` - passed with 97 tests after the scoped RuoYi baseline exceptions.
- `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests package` - passed for runtime API validation after stopping the MY backend on port `18080`.
- `git diff --check` - passed.

## Evidence

- The original `check:components` failure was limited to pre-existing RuoYi platform/system/tool/generator files:
  - `ruoyi-ui/src/views/system/role/selectUser.vue`
  - `ruoyi-ui/src/views/tool/build/CodeTypeDialog.vue`
  - `ruoyi-ui/src/views/tool/build/IconsDialog.vue`
  - `ruoyi-ui/src/views/tool/build/TreeNodeDialog.vue`
  - `ruoyi-ui/src/views/tool/gen/basicInfoForm.vue`
  - `ruoyi-ui/src/views/tool/gen/createTable.vue`
  - `ruoyi-ui/src/views/tool/gen/editTable.vue`
  - `ruoyi-ui/src/views/tool/gen/genInfoForm.vue`
  - `ruoyi-ui/src/views/tool/gen/importTable.vue`
- The original boundary failure was limited to pre-existing RuoYi router/tool-generator files:
  - `ruoyi-ui/src/router/index.js`
  - `ruoyi-ui/src/views/tool/gen/editTable.vue`
  - `ruoyi-ui/src/views/tool/gen/genInfoForm.vue`
- Added `component-exception.md` and `boundary-exception.md` under the current change record only, with exact path lists and RuoYi platform baseline rationale.
- No customer business code, shared component checker logic, boundary checker logic, or broad `ruoyi-ui/src/views/**` whitelist was changed for this gate fix.

## Runtime API Evidence

The MY backend was restarted on `http://localhost:18080` with the new packaged jar. Captcha was temporarily disabled in the local runtime database for API login, then restored and confirmed with `/captchaImage` returning `captchaEnabled=true`.

- `POST /business/customer` with `customerNature=PUBLIC` returned `公共客户由系统初始化，不允许手工新增。`
- `PUT /business/customer` for built-in `PUB_DIRECT_SALE` returned `内置公共客户不允许在普通客户编辑中修改。`
- `PUT /business/customer/changeStatus` for built-in `PUB_DIRECT_SALE` returned `内置公共客户不允许停用。`
- `PUT /business/customer/transferOwner` for built-in `PUB_DIRECT_SALE` returned `公共客户不支持归属变更`.
- `DELETE /business/customer/{id}` for built-in `PUB_DIRECT_SALE` returned `内置公共客户不允许删除。`
- `POST /business/customer` for a REAL customer using reserved code `PUB_DIRECT_SALE` returned `内置公共客户编码不允许用于普通客户。`
- After the rejected built-in public operations, `PUB_DIRECT_SALE` remained active with `status=0`.

## Static/Build Evidence

- Frontend build passed after removing PUBLIC from the normal add/edit nature choices and hiding/disabling public-row edit/delete/status/owner-change actions.
- Backend compile passed after adding PUBLIC create/edit/delete/status protections and service-layer public-channel uniqueness helper.
- `scan:all` regenerated scanner artifacts without adding sales-order, delivery, finance, channel, showroom, account, performance, or commission modules.

## Known Verification Gaps

- Browser-click validation for the add/edit dialog and list/detail rendering was not rerun in this closeout; validation is based on code inspection, production frontend build, and direct API checks.
- The current local runtime database still contains PUBLIC test rows created by earlier validation work. The final SQL ownership file now defines only two seed public customers and a `uk_customer_public_channel` uniqueness rule, but the local development database needs rebuild or cleanup before it proves the "only two PUBLIC rows" invariant at the data level.
