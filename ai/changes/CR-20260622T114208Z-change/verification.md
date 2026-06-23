# Verification

Status: passed.

## Completed

- `npm run resume` - passed before this customer update.
- `npm run ai:do -- "功能迭代：客户管理"` - created `CR-20260622T114208Z-change`.
- `npm run impact -- 客户管理` - passed with no blockers; the change record was expanded to include `ruoyi-ui/src/utils/region-data.js` because the complete region dataset is a data utility, not a RuoYi view route.
- `npm run scan:all` - passed after moving the data file out of `views`.
- `npm run finalize:change -- --summary "客户管理省市区完整数据源修复"` - passed.
- `npm --prefix ruoyi-ui run build:prod` - passed after importing `@/utils/region-data`.
- `npm run check` - passed, including scan checks, registry, ownership, graph, memory, handover, component, boundary, stale-doc, orphan, close-change, rule-lock, diff, duplicate, runtime checks, and 76 Node tests.
- `npm test` - passed standalone with 76 Node tests.
- Browser validation on `/business/customer` - passed for complete Henan choices, Zhejiang/Shandong/Guangdong/Beijing/Shanghai search/selection, direct municipality selection, add, edit echo, edit save, list/detail display, and export content.
- Data-source module check - passed with 34 province-level entries and 18 Henan city-level nodes; `henanMissing` is empty.

## Evidence

- `region-data-module-check.json`
- `region-source-check.txt`
- `runtime-validation.md`
- `runtime-evidence/02-henan-cascader-search-results.png`
- `runtime-evidence/06-edit-dialog-henan-echo.png`
- `runtime-evidence/07-edit-dialog-beijing-selected.png`
- `runtime-evidence/10-list-area-column-beijing.png`
- `runtime-evidence/export-region-verification.txt`
- `runtime-evidence/db-region-verification.txt`

## Final Gates

- `npm run check` passed.
- `npm test` passed.
