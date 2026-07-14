# Verification

Status: verified [local]

## Commands

- `[local] npm run resume`
- `[local] npm run start:change -- --mode update "testcontainers-dependency-alignment"`
- `[local] npm run impact -- platform`
- `[local] npm run context:build -- platform`
- `[local] configured Maven -pl ruoyi-business -am dependency:tree "-Dincludes=org.testcontainers:*" "-Dverbose"` (pre-change)
- `[local] configured Maven -pl ruoyi-business -am dependency:tree "-Dincludes=org.testcontainers:*" "-Dscope=test"` plus a PowerShell convergence assertion (post-change)
- `[local] configured Maven -pl ruoyi-business -am clean test`
- `[local] configured Maven -pl ruoyi-business -am -Pintegration-test clean verify`
- `[local] configured Maven -pl ruoyi-admin -am -DskipTests compile`
- `[local] npm run scan:all`
- `[local] npm test`
- `[local] git diff --check`
- `[local] npm run finalize:change -- --summary "Align Testcontainers dependencies through Spring Boot BOM"`
- `[local] npm run check`
- `[local] npm run close:change`
- `[local] git diff --cached --check and PowerShell audit of the cached paths against allowedEditRoots, forbiddenEditRoots, and changed-files.json`

## Evidence

- [local] The pre-change tree showed direct `org.testcontainers:mysql:1.21.3` mixed with BOM-managed `jdbc`, `database-commons`, and `testcontainers` 1.21.4.
- [local] Removing the direct version override made the existing Spring Boot 3.5.14 BOM the single authority. The post-change tree contains four Testcontainers artifacts, all at 1.21.4, and the assertion reported `TESTCONTAINERS_CONVERGENCE_OK artifacts=4 versions=1.21.4 oldVersionHits=0`.
- [local] Clean Maven unit verification passed 58/58 with zero failures, errors, or skips.
- [local] Clean Failsafe verification reran the 58 unit tests and passed `CustomerFundMySqlIT` 1/1 plus `MasterDataReferenceMySqlIT` 1/1 against real MySQL 8.0.36 containers. Runtime logs identified Testcontainers 1.21.4.
- [local] The admin reactor compile passed for all eight modules.
- [local] Scanners passed without route, API, DB, permission, component, ownership, registry, or graph contract changes; standalone Node tests passed 426/426.
- [local] The first three complete-gate attempts stopped respectively at missing session/Verification command wording, non-success provenance wording, and exact duplicate handover content. Each evidence issue was corrected without weakening a checker. The refreshed complete `npm run check` then passed with 426/426 Node tests and `npm run close:change` passed for the finalized 15-file record.
- [local] Cached and worktree whitespace checks passed; exact scope audit reported `DEPENDENCY_SCOPE_AUDIT_OK changed=15 outside=0 forbidden=0 recordMismatch=0 unstaged=0`.

## Residual Risk

- [local] Maven dependency convergence is proved by this change's real resolved tree; the repository does not add a permanent Maven Enforcer rule in this isolated dependency batch.
- Future Spring Boot BOM upgrades may move the Testcontainers family together and must rerun the same tree and integration evidence.
- No production dependency, Java source, runtime configuration, business behavior, sales-order state, release, or deployment is changed.
- The separate frontend dependency migration and four moderate audit findings remain pending; independent review and commit of this exact candidate remain pending.
