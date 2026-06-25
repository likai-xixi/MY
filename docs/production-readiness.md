# Production Readiness

This repository currently has a RuoYi + Vue3 development/default configuration and a separate production profile.

## Configuration Boundary

- `application.yml` and `application-druid.yml` are development/default configuration files. They are not production launch configuration.
- Production deployments must activate `application-prod.yml`.
- Production database configuration must be injected through `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD`.
- Production Redis configuration must be injected through `REDIS_HOST`, `REDIS_PORT`, `REDIS_DATABASE`, and `REDIS_PASSWORD`.
- Production token signing must be injected through `TOKEN_SECRET`; `TOKEN_EXPIRE_TIME` may override the default token lifetime.
- Production Druid login values, if the console is ever explicitly enabled for a controlled diagnostic session, must be injected through `DRUID_LOGIN_USERNAME` and `DRUID_LOGIN_PASSWORD`.
- A passwordless Redis deployment is not accepted by the current production safety baseline. Changing that would require a separate reviewed rule-change documenting private-network isolation, access control, monitoring, and rollback conditions.

## Default Production Posture

- Druid monitor console is disabled by default in `application-prod.yml`.
- Swagger UI is disabled by default in `application-prod.yml`.
- `/druid/**` is not included in the Spring Security anonymous `permitAll` matcher list.
- Production configuration must not contain RuoYi sample credentials, local database URLs, or default token secrets.

## Verification Boundary

- `npm run check` is the governance consistency gate. It is not proof that production safety passed.
- `npm run check:config-safety` keeps development/default risky values as warnings so local development is not blocked by sample configuration.
- `npm run check:prod-safety` is the blocking production safety baseline check.
- Production release verification must start with `npm run verify:release`.
- `npm run verify:release` explicitly runs governance checks, production safety checks, backend Maven compile, and the frontend production build.
- CI passed does not mean runtime acceptance passed.
- Before a real production launch, the project still needs Java/Spring runtime acceptance, MySQL acceptance, browser/manual acceptance, deployment-secret review, backup/rollback rehearsal, and operator sign-off.
