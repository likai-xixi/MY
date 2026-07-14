# Handover

## Summary

Active dependency-maintenance change `CR-20260714T100059Z-testcontainers-dependency-alignment` removes the one Testcontainers version override that split the test graph across 1.21.3 and 1.21.4. It is based on `13966097247520449a8e2da1aabe537b1c907175`, remains unreleased, and does not publish or deploy.

## Impact

Only `ruoyi-business/pom.xml` changes: `org.testcontainers:mysql` now inherits the existing Spring Boot 3.5.14 dependency management instead of overriding it at 1.21.3. The resolved `mysql`, `jdbc`, `database-commons`, and `testcontainers` artifacts are all 1.21.4. Root/other POMs, Java, tests, UI, configuration, SQL, governance rules, package scripts, workflows, APIs, DB contracts, permissions, registries, graphs, business behavior, and sales-order remain unchanged; `beforeSalesOrder` stays blocked.

## Changed Files

- `ai/changes/CR-20260714T100059Z-testcontainers-dependency-alignment/changed-files.json`
- `ai/changes/CR-20260714T100059Z-testcontainers-dependency-alignment/handover.md`
- `ai/changes/CR-20260714T100059Z-testcontainers-dependency-alignment/impact.json`
- `ai/changes/CR-20260714T100059Z-testcontainers-dependency-alignment/plan.md`
- `ai/changes/CR-20260714T100059Z-testcontainers-dependency-alignment/request.md`
- `ai/changes/CR-20260714T100059Z-testcontainers-dependency-alignment/verification.md`
- `ai/changes/CURRENT_CHANGE.json`
- `ai/context/current-context.json`
- `ai/context/current-context.md`
- `memory/CHANGELOG.md`
- `memory/HANDOVER.md`
- `memory/PROJECT_STATE.md`
- `memory/TASKS.json`
- `memory/sessions/2026-07-14-testcontainers-dependency-alignment.md`
- `ruoyi-business/pom.xml`

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
- `[local] git diff --check`
- `[local] npm run finalize:change -- --summary "Align Testcontainers dependencies through Spring Boot BOM"`
- `[local] npm run check`
- `[local] npm run close:change`
- `[local] git diff --cached --check and PowerShell allowed/forbidden-root audit`

## Verification

- [local] Pre-change tree: `mysql` 1.21.3 with three transitive Testcontainers artifacts at 1.21.4.
- [local] Post-change assertion: `TESTCONTAINERS_CONVERGENCE_OK artifacts=4 versions=1.21.4 oldVersionHits=0`.
- [local] Clean Maven unit tests pass 58/58; clean MySQL Testcontainers integration tests pass 2/2 on MySQL 8.0.36 with Testcontainers 1.21.4; all eight backend reactor modules compile.
- [local] Scanners report no contract change and standalone Node tests pass 426/426.
- [local] `npm run finalize:change` passed and synchronized the exact current record.
- [local] After correcting three evidence-only gate findings, the complete `npm run check` passes with 426/426 Node tests and `npm run close:change` passes for the finalized 15-file record.
- [local] Exact staged readback and scope audit report `DEPENDENCY_SCOPE_AUDIT_OK changed=15 outside=0 forbidden=0 recordMismatch=0 unstaged=0`.
- [not-run] Independent staged review and commit remain pending.

## Risks

- This change deliberately uses the existing Spring Boot BOM rather than copying another version constant.
- It does not add a Maven Enforcer rule; the resolved-tree assertion and real integration tests are the current convergence evidence.
- Four moderate frontend dependency findings remain in the separate UI migration batch.

## Next Actions

- Complete the independent staged review; if it reports no actionable finding, commit this isolated dependency batch, otherwise correct the evidence or implementation and rerun the affected verification plus the complete gate and scope audit before commit.
- Complete the separate frontend dependency migration, then perform the final repository review, push, and GitHub Actions confirmation.
- Do not release or deploy.
