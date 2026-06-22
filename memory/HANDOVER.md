# Handover

## Summary

RuoYi + Vue3 base integration is in baseline closeout under change record `ai/changes/CR-20260622T015319Z-ruoyi-vue3`.

This is not new business development. The current work keeps the imported RuoYi base stable under the Codex governance scaffold by cleaning registry names, scan false positives, duplicate scanned routes, runtime-tool discovery, and local runtime startup evidence.

Latest baseline closeout repair fixed `npm test` timeout in the remove-feature apply coverage and removed repeated-half routes such as `/system/config/system/config` from generated ownership outputs. No new business feature was added and no RuoYi source was deleted.

## Current Baseline

- Active profile: `ruoyi`, locked in `ai/project-profile.json`.
- Registered baseline features: `platform` / 平台底座, `system` / 系统管理, `monitor` / 监控管理, `tool` / 系统工具.
- Runtime policy now points Maven to `C:/Users/11131/.cache/codex-tools/apache-maven-3.9.9/bin/mvn.cmd`, so a fresh terminal can run `npm run check` without manually editing PATH.
- Local runtime smoke validation passed on non-default ports: backend `http://localhost:18080`, frontend `http://127.0.0.1:5173`, database `my_ry_vue_runtime`, Redis DB1.
- RuoYi source remains in place; no business module has been added or removed.

## Changed Files

- Runtime gate: `ai/rules/runtime-policy.json`, `tools/runtime-checker.js`.
- Scanner fixes: `tools/scan-backend-routes.js`, `tools/scan-permissions.js`, `tools/scan-db-schema.js`, `tools/ownership-syncer.js`.
- Baseline repair: `scripts/remove-feature.js`, `tests/remove-feature.test.js`, `tools/ownership-syncer.js`, `tests/ownership-syncer.test.js`.
- Source gate hygiene: `tools/diff-checker.js`, `tools/duplicate-scan.js` skip nested dependency/build outputs created during runtime verification.
- Registry and graph cleanup: `ai/registry/features.json`, `ai/generated/*`, `graph/ui-graph.json`.
- Evidence and task tracking: `memory/TASKS.json`, this handover, and `ai/changes/CR-20260622T015319Z-ruoyi-vue3`.
- Runtime evidence: `ai/changes/CR-20260622T015319Z-ruoyi-vue3/runtime-validation.md`, `ai/changes/CR-20260622T015319Z-ruoyi-vue3/runtime-evidence/browser-tool-gen.png`.
- Frontend runtime proxy: `ruoyi-ui/vite.config.js` now supports `RUOYI_API_BASE` while keeping `http://localhost:8080` as default.

## Commands

- `npm run resume`
- `npm run scan:backend-routes`
- `npm run scan:permissions`
- `npm run scan:db`
- `npm run scan:all`
- `node --test tests/remove-feature.test.js`
- `node --test tests/ownership-syncer.test.js`
- `npm test`
- `npm run build:graph`
- `npm run sync:memory`
- `npm run check`
- `npm run check:diff`
- `npm run scan:duplicates`
- `docker exec mj-redis redis-cli -n 1 ping`
- `docker exec mj-mysql mysql ...`
- `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd clean package -DskipTests`
- backend startup on `http://localhost:18080`
- frontend startup on `http://127.0.0.1:5173`
- browser verification for captcha, login, home, system management, monitor, and code generation

## Verification

The generated scans were checked for the known bad values after scanner fixes. `npm run check` passed in a normal shell without manually adding Maven to PATH. Runtime verification imported `sql/ry_20260417.sql` and `sql/quartz.sql` into isolated database `my_ry_vue_runtime`, verified Redis, started backend/frontend, and browser-tested captcha/login/home plus representative system management, monitor, and code generation pages. Source hygiene and duplicate gates now ignore nested dependency/build output directories.

Baseline repair verification on 2026-06-22: `node --test tests/remove-feature.test.js` passed after previously timing out, `npm test` passed with 76 tests, `npm run check` passed, and repeated route checks found no remaining `/system/config/system/config`, `/system/user/system/user`, or same-pattern system/test duplicates in `ai/registry/features.json`, `graph/ui-graph.json`, or `ai/generated/*`.

## Risks

- `npm run check` is a governance and readiness gate, not proof that the business runtime is production-ready.
- RuoYi SQL files are initialization scripts and should only be applied to the intended empty development database.
- Runtime evidence is local development smoke coverage, not production deployment evidence.
- `npm install --no-package-lock` under `ruoyi-ui` reported `8 vulnerabilities (3 moderate, 5 high)`; no forced dependency rewrite was applied.
- CRUD mutations, import/export, Druid page authentication, Swagger behavior, scheduled jobs, and production frontend build remain unverified.

## Next Actions

- Keep future baseline work inside this locked RuoYi profile and rerun `npm run check` after any scanner, registry, graph, or memory change.
- For the next release phase, decide whether to harden/upgrade frontend dependencies and add deeper runtime checks for CRUD, imports/exports, Druid, Swagger, jobs, and production build.
