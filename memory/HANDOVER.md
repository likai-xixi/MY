# Handover

## Summary

Active platform dependency-maintenance change `CR-20260714T102910Z-frontend-dependency-hardening` is fully verified [local] and ready for its implementation commit. It is bound to the separately committed pre-review `RV-20260714T112343Z-svg-spritemap` at base `752ed0f730fb2f9bd062f5df03bd57e4d08ff079`. No release, deployment, stash restoration, or push has occurred in this batch.

## Impact

- Frontend audit findings were reduced from four moderate issues to zero total vulnerabilities by pinning ECharts 6.1.0, the maintained spritemap plugin 6.0.0, and SVGO 4.0.2 while removing the legacy SVG/PostCSS 5 chain.
- The shared icon contract is now `/__spritemap#icon-*`; all 90 repository icons remain present and safe in the production sprite.
- Cache-monitor request and chart lifecycle behavior is isolated in feature-local `.mjs` controllers with latest-response wins, unmount invalidation, stable resize, instance reuse, and idempotent cleanup.
- The production frontend build runs the full UI suite after UI dependencies are installed. The clean root gate reaches the dependency-free controller tests.
- Backend, APIs, routes, permissions, SQL, database contracts, customer/masterdata/system/tool business behavior, and sales-order runtime are unchanged. `beforeSalesOrder` remains blocked.

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

- [local] `npm run resume`
- [local] `npm run impact -- platform`
- [local] `npm run context:build -- platform`
- [local] `node --test tests/frontend-dependency-hardening.test.js`
- [local] `npm --prefix ruoyi-ui ci`
- [local] `npm --prefix ruoyi-ui test`
- [local] `npm --prefix ruoyi-ui audit --audit-level=moderate --json`
- [local] `npm --prefix ruoyi-ui run build:prod`
- [runtime-local] browser acceptance on login, menu icon picker, and cache monitor
- [local] `npm run scan:all`
- [local] `npm test`
- [local] `npm run finalize:change`
- [local] `npm run check`
- [local] `npm run close:change`
- [local] `git diff --check`

## Verification

- [local] Root focused tests pass 5/5 and UI tests pass 7/7, including the real Vite plugin, four request/error cases, and ten chart mount/dispose cycles.
- [local] Audit reports zero vulnerabilities; the old SVG chain is absent and the patched dependency tree is exact.
- [local] Production build passes after the full UI suite, transforms 2601 modules, and emits one hashed spritemap with 90/90 unique safe symbols and viewBoxes.
- [runtime-local] Browser acceptance confirms 90 visible icon-picker entries, working login/shell icons, two nonzero cache charts, real Redis data, responsive chart resize, and no console warnings/errors.
- [local] Scanners find no API, route, permission, database, component-ownership, or graph contract change. Full `npm run check` passes with 431/431 root tests and `close:change` passes.
- [local] Two independent final reviewers return GO with no P0-P3 finding.

## Risks

- Sprite delivery currently follows the existing Vite `base=/` contract; any future subpath/CDN deployment must repeat URL, MIME, CSP, and visual acceptance.
- The `.mjs` helpers avoid false route generation but expose a governance scanner-completeness gap. They contain no route/API/permission/cross-feature behavior; a separate rule-change will make ESM scanner coverage explicit.
- Current CI audit declaration is still `high`; exact versions and audit=0 make this implementation safe, while the next isolated governance change will enforce `moderate` and an explicit UI-test step.

## Next Actions

- Stage, exact-scope review, and commit the current frontend implementation batch.
- Open and close a separate governance/rule-change for explicit UI tests, moderate audit enforcement, and `.mjs` scanner completeness.
- Run the complete repository gate again, push `master`, confirm GitHub Actions, then run `npm run check:after-push`.
- Do not release or deploy.

## Recovery Pointer

New Codex windows should read `AGENTS.md`, `ai/context/current-context.md`, and this handover first. Preserve `stash@{0}` and `stash@{1}`; both are superseded historical snapshots and must not be applied or dropped during this closeout.
