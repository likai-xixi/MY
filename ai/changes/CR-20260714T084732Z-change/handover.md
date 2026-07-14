# Handover

## Summary

Active change `CR-20260714T084732Z-change` completes the required Druid pool keys in the production profile. It is based on `12812fdf00465d923db2a0cc84d85a4bf12da9ea`, approved by `RV-20260714T012241Z-review`, remains unreleased, and does not publish or deploy.

## Impact

Only `ruoyi-admin/src/main/resources/application-prod.yml`, the platform feature brief, and required change/context/memory evidence are in scope. All 13 Druid properties required by `DruidProperties` are explicit; environment-only secrets and disabled production consoles are preserved. APIs, UI, database schema, permissions, components, dependencies, governance tools, business modules, and sales-order remain unchanged; `beforeSalesOrder` stays blocked.

## Changed Files

- `ai/changes/CR-20260714T084732Z-change/changed-files.json`
- `ai/changes/CR-20260714T084732Z-change/handover.md`
- `ai/changes/CR-20260714T084732Z-change/impact.json`
- `ai/changes/CR-20260714T084732Z-change/plan.md`
- `ai/changes/CR-20260714T084732Z-change/request.md`
- `ai/changes/CR-20260714T084732Z-change/runtime-evidence/production-profile-probes.md`
- `ai/changes/CR-20260714T084732Z-change/verification.md`
- `ai/changes/CURRENT_CHANGE.json`
- `ai/context/current-context.json`
- `ai/context/current-context.md`
- `features/platform.md`
- `memory/CHANGELOG.md`
- `memory/HANDOVER.md`
- `memory/PROJECT_STATE.md`
- `memory/TASKS.json`
- `memory/sessions/2026-07-14-production-profile-completeness.md`
- `ruoyi-admin/src/main/resources/application-prod.yml`

## Commands

- `[local] npm run resume`
- `[local] npm run ai:do -- "功能迭代：平台底座"`
- `[local] npm run context:build -- platform`
- `[local] inline Node Druid @Value/YAML base-versus-current probe` (exact command and output in `runtime-evidence/production-profile-probes.md`)
- `[local] npm run check:prod-safety`
- `[local] & "$env:USERPROFILE\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd" -pl ruoyi-admin -am -DskipTests package`
- `[local] java -jar ruoyi-admin/target/ruoyi-admin.jar --spring.profiles.active=prod --server.port=0` with probe-only environment values (exact capture command and output in runtime evidence)
- `[local] npm run scan:all`
- `[local] npm run finalize:change -- --summary "Complete production Druid profile and packaged startup evidence"`
- `[local] npm run finalize:change -- --summary "Complete production Druid profile with reproducible startup evidence"`
- `[local] npm run check`
- `[local] npm run close:change`

## Verification

- [local] The reproducible property probe moved from 13/13 missing on base `12812fdf00465d923db2a0cc84d85a4bf12da9ea` to 13/13 present using keys dynamically extracted from production Java source.
- [local] Production safety passed, and the eight-module configured Maven package completed with `BUILD SUCCESS`.
- [local] The packaged `prod` startup contained no unresolved placeholders and reached the expected MySQL/Druid connection-refused boundary.
- [local] Generated scanners passed with no API, UI, DB, permission, component, ownership, or graph contract change.
- [local] The complete repository gate passed with 386/386 Node tests, and the exact finalized 17-file record passed `npm run close:change`. Exact sanitized probe commands/output are persisted in the active change runtime evidence.

## Risks

- The startup probe uses intentionally unreachable local database/Redis endpoints; it is binding/startup evidence, not real production service acceptance.
- The permanent dynamic checker belongs to the next governance-only record and is not mixed into this configuration record.
- Testcontainers alignment and four moderate UI audit findings remain for later isolated dependency records.

## Next Actions

- Stage the exact 17-file batch, complete independent re-review, and commit it.
- Complete the separate governance checker and dependency alignment/migration batches.
- Push and confirm GitHub Actions only after the final all-project review. Do not release or deploy.
