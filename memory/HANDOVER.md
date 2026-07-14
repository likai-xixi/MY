# Handover

## Summary

Active change `CR-20260714T084732Z-change` completes the production Druid profile on base `12812fdf00465d923db2a0cc84d85a4bf12da9ea`. It is approved by `RV-20260714T012241Z-review`, remains unreleased, and does not publish or deploy.

## Impact

All 13 Druid pool properties required by `DruidProperties` are explicit in `application-prod.yml`; secrets remain environment-only and production consoles remain disabled. Scope is the exact production config plus platform/change/context/memory evidence. APIs, UI, DB schema, permissions, components, dependencies, governance tools, business modules, and sales-order remain unchanged; `beforeSalesOrder` stays blocked.

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
- `[local] inline Node Druid @Value/YAML base-versus-current probe` (exact command and output in the active change runtime evidence)
- `[local] npm run check:prod-safety`
- `[local] & "$env:USERPROFILE\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd" -pl ruoyi-admin -am -DskipTests package`
- `[local] java -jar ruoyi-admin/target/ruoyi-admin.jar --spring.profiles.active=prod --server.port=0` with probe-only environment values (exact command/output persisted)
- `[local] npm run scan:all`
- `[local] npm run finalize:change -- --summary "Complete production Druid profile and packaged startup evidence"`
- `[local] npm run finalize:change -- --summary "Complete production Druid profile with reproducible startup evidence"`
- `[local] npm run check`
- `[local] npm run close:change`

## Verification

- [local] Dynamic extraction moved from 13/13 missing Druid keys to 13/13 present.
- [local] `npm run check:prod-safety`, scanner checks, and the eight-module configured Maven package passed.
- [local] The packaged `prod` process showed zero unresolved placeholders and reached the expected MySQL/Druid connection-refused boundary.
- [local] Scanners passed with no contract changes.
- [local] The complete repository gate passed with 386/386 Node tests, and the exact finalized 17-file record passed `npm run close:change`. Exact sanitized probe commands/output are persisted in the active change.

## Risks

- The intentionally unreachable startup probe is production-profile binding evidence, not real production database or Redis acceptance.
- A separate governance record must add the permanent dynamic checker without mixing rule changes into this business/config batch.
- Testcontainers alignment and four moderate UI dependency findings remain pending.

## Next Actions

- Stage and independently re-review the exact 17-file batch, then commit it.
- Complete the separate governance checker and dependency records, then perform the final review/push/CI confirmation.
- Do not release or deploy.
