# Verification

Status: verified [local]

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

## Evidence

- [local] The reproducible probe dynamically extracted all 13 `@Value` keys from `DruidProperties.java`; base `12812fdf00465d923db2a0cc84d85a4bf12da9ea` was missing all 13 and the current profile is missing none.
- [local] The identical post-change probe extracted 13 keys and reported an empty missing list. The production profile now supplies pool sizing, acquisition/driver timeouts, eviction intervals, validation SQL, and validation toggles while keeping database, Redis, token, and Druid console secrets environment-only.
- [local] `npm run check:prod-safety` passed; production consoles remain disabled and no development secret/default was introduced.
- [local] The configured Maven 3.9.9 reactor packaged all eight modules successfully and produced the executable `ruoyi-admin.jar`. Tests were intentionally skipped for this configuration-only packaging step and are not claimed by that command.
- [local] The packaged jar ran with `spring.profiles.active=prod`, safe probe-only secrets, Redis on an unreachable local port, and MySQL on `127.0.0.1:1`. It exited at the expected database boundary with `Communications link failure`, `Connection refused`, and Druid connection-creation evidence.
- [local] The startup log contained zero `Could not resolve placeholder` failures, so the probe reached the intended database boundary instead of the former Druid property-binding failure.
- [local] Route, API-client, DB, permission, component, and ownership scanners passed with no contract changes.
- [local] The complete repository gate passed with 386/386 Node tests, and `npm run close:change` passed for the exact finalized 17-file record. Exact sanitized probe commands/output are persisted under `runtime-evidence/production-profile-probes.md`.

## Residual Risk

- [not-run] Exact staging, independent staged review, commit, push, and GitHub Actions remain pending at this checkpoint.
- The probe intentionally does not authenticate to a real production database or Redis service. It verifies production-profile binding and startup progression only; real environment acceptance remains a later release-readiness concern.
- A separate governance/rule-change record will add a permanent dynamic checker and mutation tests. This configuration-only business record does not edit governance tools, tests, scripts, package files, or CI.
- This batch does not release, deploy, change dependencies, alter API/UI/DB/permission contracts, touch business modules, or open `beforeSalesOrder`.
