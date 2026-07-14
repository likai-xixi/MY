# Session: Testcontainers Dependency Alignment

## Task

`TASK-0002` - align the mixed Testcontainers Maven test graph under `CR-20260714T100059Z-testcontainers-dependency-alignment`.

## Status

`verified`

## Goal

Use the existing Spring Boot BOM as the single Testcontainers version authority and prove the two real MySQL integration paths remain valid.

## Changed Files

- One Maven test dependency declaration plus the exact current change, context, handover, task, changelog, and session evidence.
- The final exact list is synchronized by `changed-files.json` during finalization.

## Commands

- `[local] npm run resume`
- `[local] npm run start:change -- --mode update "testcontainers-dependency-alignment"`
- `[local] npm run impact -- platform`
- `[local] npm run context:build -- platform`
- `[local] configured Maven dependency-tree commands before and after the change`
- `[local] configured Maven -pl ruoyi-business -am clean test`
- `[local] configured Maven -pl ruoyi-business -am -Pintegration-test clean verify`
- `[local] configured Maven -pl ruoyi-admin -am -DskipTests compile`
- `[local] npm run scan:all`
- `[local] npm test`
- `[local] npm run finalize:change -- --summary "Align Testcontainers dependencies through Spring Boot BOM"`
- `[local] git diff --check`
- `[local] npm run check`
- `[local] npm run close:change`

## Verification

- [local] The pre-change tree mixed `mysql` 1.21.3 with `jdbc`, `database-commons`, and core 1.21.4.
- [local] The post-change tree converges all four artifacts on 1.21.4 with zero 1.21.3 hits.
- [local] Clean unit tests pass 58/58; clean MySQL 8.0.36 Testcontainers integration tests pass 2/2 and identify Testcontainers 1.21.4; the eight-module admin reactor compile passes.
- [local] Scanners report no contract change and standalone Node tests pass 426/426.
- [local] Finalization passes; after three evidence-only corrections, the complete repository gate passes 426/426 and closeout passes for the finalized 15-file record.
- [local] Exact staging and scope audit report 15 changed, zero outside allowed roots, zero forbidden, zero record mismatch, and zero unstaged.
- [not-run] Independent review, commit, push, and CI remain pending.

## Risks

- No Maven Enforcer rule is added in this narrow batch; convergence is proved by the resolved tree and real IT execution.
- No production dependency/runtime, business contract, sales-order, release, or deployment change is authorized.

## Next Entry Point

Complete the independent staged review and commit only after actionable findings are corrected and the affected verification, complete gate, and staged-scope audit are refreshed.
