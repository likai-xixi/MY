# Handover

## Summary

Replaced the four-finding frontend dependency slice, preserved the 90-icon platform contract, and made cache request/chart lifecycle behavior deterministic and executable-testable. No release or deployment was performed.

## Impact

- Pinned ECharts 6.1.0, `@spiriit/vite-plugin-svg-spritemap` 6.0.0, and SVGO 4.0.2; removed the legacy `vite-plugin-svg-icons -> svg-baker -> postcss@5` chain.
- Moved shared icons to `/__spritemap#icon-*`, repaired one malformed SVG, and removed dead external-font styles from three icons without changing intended geometry.
- Added feature-local `.mjs` request and chart lifecycle controllers for latest-response wins, unmount invalidation, single error ownership, stable resize, instance reuse, and idempotent disposal.
- Added real Vite spritemap tests plus request/lifecycle behavior tests. The existing frontend production-build CI path now executes the complete UI suite after UI dependencies are installed; the clean root gate executes dependency-free controller regressions.
- `npm run scan:all` found no backend API, route, permission, database, component-ownership, or graph contract change. Generated route/UI graph output remained unchanged, and no fake helper routes are registered.

## Changed Files

- `ai/changes/CR-20260714T102910Z-frontend-dependency-hardening/changed-files.json`
- `ai/changes/CR-20260714T102910Z-frontend-dependency-hardening/handover.md`
- `ai/changes/CR-20260714T102910Z-frontend-dependency-hardening/impact.json`
- `ai/changes/CR-20260714T102910Z-frontend-dependency-hardening/plan.md`
- `ai/changes/CR-20260714T102910Z-frontend-dependency-hardening/request.md`
- `ai/changes/CR-20260714T102910Z-frontend-dependency-hardening/verification.md`
- `ai/changes/CURRENT_CHANGE.json`
- `ai/context/current-context.json`
- `ai/context/current-context.md`
- `ai/registry/features.json`
- `features/platform.md`
- `memory/CHANGELOG.md`
- `memory/HANDOVER.md`
- `memory/PROJECT_STATE.md`
- `memory/TASKS.json`
- `memory/sessions/2026-07-14-frontend-dependency-hardening.md`
- `ruoyi-ui/package-lock.json`
- `ruoyi-ui/package.json`
- `ruoyi-ui/src/assets/icons/svg/button.svg`
- `ruoyi-ui/src/assets/icons/svg/monitor.svg`
- `ruoyi-ui/src/assets/icons/svg/redis-list.svg`
- `ruoyi-ui/src/assets/icons/svg/system.svg`
- `ruoyi-ui/src/components/SvgIcon/index.vue`
- `ruoyi-ui/src/main.js`
- `ruoyi-ui/src/views/monitor/cache/cache-request-controller.mjs`
- `ruoyi-ui/src/views/monitor/cache/chart-lifecycle.mjs`
- `ruoyi-ui/src/views/monitor/cache/index.vue`
- `ruoyi-ui/tests/cache-chart-lifecycle.test.js`
- `ruoyi-ui/tests/cache-request-controller.test.js`
- `ruoyi-ui/tests/spritemap-production.test.js`
- `ruoyi-ui/vite/plugins/index.js`
- `ruoyi-ui/vite/plugins/svg-icon.js`
- `tests/frontend-dependency-hardening.test.js`

## Commands

- [local] `node --test tests/frontend-dependency-hardening.test.js`
- [local] `npm --prefix ruoyi-ui ci`
- [local] `npm --prefix ruoyi-ui test`
- [local] `npm --prefix ruoyi-ui ls echarts @spiriit/vite-plugin-svg-spritemap svgo vite-plugin-svg-icons svg-baker postcss --all`
- [local] `npm --prefix ruoyi-ui audit --audit-level=moderate --json`
- [local] `npm --prefix ruoyi-ui run build:prod`
- [runtime-local] browser acceptance on `/login`, `/system/menu`, and `/monitor/cache`
- [local] `npm run scan:all`
- [local] `npm run check:feature-test-ownership`
- [local] `npm test`
- [local] `npm run check`
- [local] `npm run close:change`

## Verification

- [local] Root focused regression passed 5/5; the clean root wrapper invokes only dependency-free controller tests.
- [local] UI suite passed 7/7, including the real Vite plugin, four request-order/error tests, and ten chart mount/dispose cycles.
- [local] Audit reported 0 total vulnerabilities; dependency tree resolved ECharts 6.1.0, spritemap plugin 6.0.0, SVGO 4.0.2, and PostCSS 8.5.15 with the old chain absent.
- [local] Production build passed after `prebuild:prod` executed all UI tests; Vite transformed 2601 modules and emitted `assets/spritemap.2e362be6.svg`.
- [local] Spritemap verification proved source/symbol/unique counts 90/90/90 with no missing ids, duplicate ids, invalid viewBoxes, scripts, events, external origins, style/use/view remnants, legacy virtual module, or unresolved development route.
- [runtime-local] Browser acceptance showed 90/90 visible icon-picker entries, visible login/shell icons, two nonzero ECharts canvases, resize from 471px to 544px after sidebar collapse, real Redis data, and no console warning/error.
- [local] `npm run scan:all`, feature-test ownership, 431/431 root tests, the complete repository check, and `close:change` passed.
- [local] Permission scan completed with no contract changes.
- [local] Component scan completed with no contract changes; `SvgIcon` keeps its registered shared-component identity and public props.
- [local] Two independent final UI reviews returned GO with no P0-P3 finding.

## Risks

- The runtime sprite contract currently assumes the repository's existing Vite `base=/`; any future subpath/CDN deployment must rerun sprite URL and CSP/MIME acceptance.
- The `.mjs` helpers intentionally avoid false route generation. They contain no route, API path, permission, or cross-feature behavior; a separate governance change should make scanner coverage for non-page ESM modules explicit.
- CI currently audits the UI at `high`; exact versions and a zero-vulnerability lockfile make this batch safe, while the threshold and explicit UI-test declaration are tightened in the next isolated governance/rule-change.

## Next Actions

- Commit this UI batch without release/deployment.
- Open an isolated governance/rule-change for explicit UI test coverage, moderate audit enforcement, and `.mjs` scanner completeness before the final push.

## Traceability

`platform` -> frontend package/Vite/SvgIcon/cache-monitor implementation -> unchanged monitor API and route graphs -> platform feature registry/brief -> root and UI executable regressions.
