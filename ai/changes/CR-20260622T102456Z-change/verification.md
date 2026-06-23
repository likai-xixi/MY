# Verification

Status: runtime validation passed; final governance and test gates passed.

## Commands Completed

- `npm run resume` - passed before editing.
- `npm run impact -- 客户管理` - passed; the change record was expanded for customer registry, permission, database ownership, and RuoYi module POM wiring already present in the customer working tree.
- `npm run ai:do -- "功能迭代：客户管理"` - created `CR-20260622T102456Z-change`.
- `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests compile` - passed.
- `npm --prefix ruoyi-ui run build:prod` - passed.
- `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests package` - passed before runtime validation.
- Backend restart on `http://localhost:18080` - `/captchaImage` returned HTTP 200.
- Browser validation on `/business/customer` - passed after user-confirmed local captcha handling.
- `npm run scan:all` - passed.
- `npm run finalize:change -- --summary "客户管理编码字典与地址联动优化"` - passed.
- `npm run check` - passed, including scan checks, registry, ownership, graph, memory, handover, component, boundary, stale-doc, orphan, close-change, rule-lock, diff, duplicate, runtime checks, and 76 Node tests.
- `npm test` - passed standalone with 76 Node tests.

## Runtime Evidence

- Browser created `KH202606000001` and `KH202606000002`, proving the new code format and same-month increment.
- DB verification confirmed `uk_customer_code` and `kh_duplicate_code_count = 0`.
- List/detail screenshots confirm customer level `NORMAL` displays as `普通`, and customer type displays as `经销商`.
- Add dialog cascader selected `浙江省 / 杭州市 / 滨江区`.
- Edit dialog echoed `浙江省 / 杭州市 / 滨江区`, then saved `浙江省 / 宁波市 / 鄞州区`.
- Blank short names on create/update saved as customer name.
- Export XLSX was saved and parsed; rows show `KH202606000001`, `KH202606000002`, `经销商`, `普通`, `浙江省 / 宁波市 / 鄞州区`, and `江苏省 / 苏州市 / 吴中区`.
- Boundary SQL check confirmed a 7-digit suffix (`KH2026061000000`) sorts above `KH202606999999`; the check ran inside a transaction and rolled back.
- `component-exception.md` and `boundary-exception.md` document inherited RuoYi baseline files reported by governance heuristics; no customer code imports those files and no rules were modified.

## Key Files

- `runtime-evidence/01-customer-list-normal-label.png`
- `runtime-evidence/02-area-cascader-filter-zhejiang.png`
- `runtime-evidence/03-add-customer-area-selected.png`
- `runtime-evidence/04-after-two-customers-list-kh-codes.png`
- `runtime-evidence/06-edit-dialog-area-echo.png`
- `runtime-evidence/09-detail-after-edit-address.png`
- `runtime-evidence/db-code-unique-and-boundary.txt`
- `runtime-evidence/db-customer-ux-verification.txt`
- `runtime-evidence/customer-encoding-address-export.xlsx`
- `runtime-evidence/export-xlsx-verification.txt`

## Final Gates

- `npm run scan:all` passed.
- `npm run finalize:change -- --summary "客户管理编码字典与地址联动优化"` passed.
- `npm run check` passed.
- `npm test` passed.
