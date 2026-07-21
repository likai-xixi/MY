# Backend Review

## Impact

No backend API, service, domain, repository, mapper, permission, SQL, migration, or Java production change is authorized.

## Regression Requirement

- Run the focused R-12A Node contract suite.
- Run the configured Maven `ruoyi-business` reactor unit suite.
- Run the configured Maven integration-test profile with MySQL/Testcontainers.

## Decision

Approve only if the final diff contains zero backend/runtime paths and all existing R-12A backend regressions remain green.
