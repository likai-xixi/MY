# Session: Frontend Dependency Hardening

## Task

`TASK-0002` - close the platform UI dependency, 90-icon spritemap, and cache lifecycle slice under `CR-20260714T102910Z-frontend-dependency-hardening`.

## Status

`verified`

## Goal

Remove the four moderate frontend dependency findings without changing backend or business contracts, preserve all shared icons, and prove cache-monitor lifecycle correctness in tests and a real browser.

## Changed Files

- UI manifest/lock, Vite SVG integration, shared icon consumer, four corrected SVG sources, cache view/controllers, executable regressions, platform registry/brief, and exact change/context/memory evidence.
- `changed-files.json` is the authoritative final path list.

## Commands

- `[local] node --test tests/frontend-dependency-hardening.test.js`
- `[local] npm --prefix ruoyi-ui ci`
- `[local] npm --prefix ruoyi-ui test`
- `[local] npm --prefix ruoyi-ui ls echarts @spiriit/vite-plugin-svg-spritemap svgo vite-plugin-svg-icons svg-baker postcss --all`
- `[local] npm --prefix ruoyi-ui audit --audit-level=moderate --json`
- `[local] npm --prefix ruoyi-ui run build:prod`
- `[runtime-local] browser acceptance on /login, /system/menu, and /monitor/cache`
- `[local] npm run scan:all`
- `[local] npm test`
- `[local] npm run finalize:change`
- `[local] npm run check`
- `[local] npm run close:change`
- `[local] git diff --check`

## Verification

- [local] Root focused tests pass 5/5; UI tests pass 7/7, including a real in-memory Vite spritemap build, deferred request behavior, and ten chart lifecycle cycles.
- [local] Audit reports 0 total vulnerabilities. ECharts/plugin/SVGO/PostCSS resolve to 6.1.0/6.0.0/4.0.2/8.5.15 and the legacy plugin chain is absent.
- [local] Production build runs the UI suite first, transforms 2601 modules, and emits a hashed sprite with 90 source, symbol, and unique ids; unsafe/missing/duplicate counts are zero.
- [runtime-local] Browser acceptance confirms 90 visible picker icons, visible login/shell icons, two 420px cache charts, sidebar-resize redraw, real Redis data, and an empty warning/error console.
- [local] Scan output remains stable with no fake helper routes or API/permission/DB/component contract change; feature-test ownership passes.
- [local] The complete repository gate passes with 431/431 tests and `close:change` passes.
- [local] Two independent final reviewers report GO with no P0-P3 finding.

## Risks

- Future non-root Vite deployments must repeat sprite URL and browser acceptance.
- `.mjs` generic scanner coverage and the CI moderate-audit/UI-test declarations are deferred only to the immediately following isolated governance/rule-change.
- No backend, SQL, route, permission, customer, masterdata, sales-order, release, or deployment work is included.

## Next Entry Point

Commit this exact implementation batch, then open the isolated frontend CI/scanner governance change. Preserve both existing stashes, keep `beforeSalesOrder` blocked, and do not push until the final combined gate is green.
