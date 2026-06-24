# Verification

## Commands Run

- `npm run resume` - passed.
- `npm run ai:do -- "功能迭代：客户管理"` - shell timed out, but it created `CR-20260623T155049Z-change` and the current-change pointer.
- `npm run impact -- 客户管理` - passed, no blockers.
- `mvn -pl ruoyi-admin -am -DskipTests compile` - failed because `mvn` is not on PATH.
- `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests compile` - passed.
- `npm --prefix ruoyi-ui run build:prod` - passed.
- `npm run scan:all` - passed.
- `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests package` - first run failed because `ruoyi-admin.jar` was locked by the running MY backend; after stopping only that backend process, package passed.
- `npm run finalize:change -- --summary "客户管理厂内归属与业务员维护口径"` - passed.
- `npm run check` - failed at the existing scaffold component gate. The failure reports RuoYi built-in `system/role/selectUser.vue` and `tool/*` dialog/form files as reusable controls that should move to shared components. These files are outside the current customer change scope.
- `npm test` - failed 2 unrelated governance baseline tests: boundary lint flags existing RuoYi router/tool imports across `monitor/system/tool`, and component checker flags existing RuoYi `system/tool` controls as reusable. Customer tests and runtime validation were not the failing surface.
- `git diff --check` - passed.

## Runtime Evidence

See `runtime-validation.md`.

Confirmed:

- Development DB was adjusted for runtime validation with final `customer.owner_*` and `customer_salesman_bind_log.old/new_owner_*` columns.
- Public seed customers remain `PUBLIC` with `NONE / NONE / NONE`.
- REAL invalid mobile phone still rejects with `联系电话必须为11位手机号`.
- New REAL without owner fields defaults to `FACTORY / FACTORY_POOL / NONE`.
- New REAL salesman-self saves as `SALESMAN / SALESMAN_SELF / SALES_COMMISSION`.
- New REAL factory-assigned maintenance saves as `SALESMAN / FACTORY_ASSIGNED / MAINTENANCE_FEE`.
- New PUBLIC clears submitted owner/contact fields and saves as `NONE / NONE / NONE`.
- Owner change supports `ASSIGN_MAINTENANCE` and `RETURN_FACTORY`.
- Owner-change log records old/new owner type, source, profit mode, effective time, owner user, and owner dept.
- PUBLIC owner change rejects with `公共客户不支持归属变更`.
- Browser validation confirmed owner filter/table columns, add-dialog default factory owner, salesman owner source/profit controls, and PUBLIC owner controls hidden.
- Captcha was restored and `/captchaImage` returned `captchaEnabled=true`.

## Final Gate Notes

Customer implementation, generated scans, backend compile/package, frontend build, runtime API/DB validation, browser validation, and `git diff --check` passed.

The remaining red gates are pre-existing/non-customer governance baseline findings in RuoYi built-in `system/tool` frontend files:

- `npm run check` stops at `check:components`.
- `npm test` fails `boundary-lint.test.js` and `component-checker.test.js`.

No governance scanner/rule/profile files were changed for this business iteration.
