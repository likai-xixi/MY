# Verification

Status: passed.

## Commands Run

- `npm run resume` confirmed current change `CR-20260622T015319Z-ruoyi-vue3` and latest session `memory/sessions/2026-06-22-ruoyi-vue3-base.md`.
- `node --test tests/remove-feature.test.js` was run before the fix and timed out after roughly 94 seconds, reproducing the remove-feature apply hang.
- `npm run scan:backend-routes` regenerated backend routes after class-level `@RequestMapping` duplicate handling was fixed.
- `npm run scan:permissions` regenerated permissions after scanner filtering removed example/CSS pseudo permissions.
- `npm run scan:db` regenerated database scan output after Mapper XML tag false positives were fixed.
- `npm run scan:all` regenerated all scan output and ownership.
- `node --test tests/remove-feature.test.js` passed after fixture copy and document scan directory skipping were fixed.
- `node --test tests/ownership-syncer.test.js` passed after repeated-half route filtering was added.
- `rg "system/config/system/config|system/user/system/user|system/dept/system/dept|system/menu/system/menu|test/user/test/user" ai/registry/features.json graph/ui-graph.json ai/generated` returned no matches after regeneration.
- `npm test` passed with 76 Node tests.
- `npm run build:graph` regenerated the module graph.
- `npm run sync:memory` refreshed memory-derived generated files.
- `npm run check:runtime` passed in a normal shell by using Maven from `ai/rules/runtime-policy.json`.
- `node --test tests/runtime-checker.test.js` passed after the runtime checker test fixture was updated for configured tool paths.
- `npm run handover:check` passed after the handover used the required sections.
- `npm run check` passed in a normal shell without manually adding Maven to PATH.
- `npm run check:diff` passed after nested dependency/build output directories were excluded from text hygiene scanning.
- `npm run scan:duplicates` passed after nested dependency/build output directories were excluded from duplicate scanning.
- `docker exec mj-redis redis-cli -n 1 ping` returned `PONG`.
- `docker exec mj-mysql mysql ...` confirmed imported runtime database `my_ry_vue_runtime`, 31 tables, default users, and baseline menus.
- `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd clean package -DskipTests` built the backend jar.
- Backend started on `http://localhost:18080` with isolated database `my_ry_vue_runtime` and Redis DB1.
- Frontend started on `http://127.0.0.1:5173` with `RUOYI_API_BASE=http://localhost:18080`.
- Browser validation logged in through the real frontend and verified home, system management, monitor, and code generation pages.

## Evidence

- `ai/registry/features.json` now names the baseline features as `平台底座`, `系统管理`, `监控管理`, and `系统工具`.
- Generated scans no longer contain `a:a:a`, `b:b:b`, `unlock-btn:hover:not`, `user-info-head:hover:after`, `/monitor/cache/monitor/cache`, `/tool/gen/tool/gen`, or db table `id`.
- `scripts/remove-feature.js` now prunes nested dependency/build output directories during document reference scans instead of traversing `node_modules`, Maven `target`, Vite caches, or build output trees.
- `tests/remove-feature.test.js` fixture copying skips nested `node_modules`, `target`, `dist`, `build`, `.vite`, `coverage`, and `tmp` directories at any depth.
- `tools/ownership-syncer.js` filters repeated-half route residues and writes the cleaned `graph/ui-graph.json` during ownership sync; regenerated `ai/registry/features.json` no longer contains `/system/config/system/config` or `/system/user/system/user`.
- `ai/rules/runtime-policy.json` configures Maven at `C:/Users/11131/.cache/codex-tools/apache-maven-3.9.9/bin/mvn.cmd`.
- Runtime startup, DB import, Redis, frontend install, browser login, and representative built-in RuoYi pages were verified in `ai/changes/CR-20260622T015319Z-ruoyi-vue3/runtime-validation.md`.
- Runtime screenshot evidence is saved at `ai/changes/CR-20260622T015319Z-ruoyi-vue3/runtime-evidence/browser-tool-gen.png`.
- Final full gate evidence: `npm run check` passed through scan checks, registry/ownership/graph/memory gates, runtime readiness, and 76 Node tests.
- Runtime-generated `ruoyi-ui/node_modules`, Vite cache, and Maven `target` outputs are ignored by source hygiene/duplicate gates.
- Remaining runtime limits: production deployment, CRUD mutations, import/export, Druid authentication, Swagger behavior, scheduled jobs, and production frontend build were not verified.
