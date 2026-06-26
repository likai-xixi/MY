# Runtime Verification Boundary

## Local governance gate: npm run check

- validates governance consistency
- validates registries / graph / ownership / current context / handoff
- runs Node structural tests
- includes high-risk governance framework checks
- does not prove production readiness
- does not prove business runtime correctness
- does not prove database migration safety
- does not prove browser acceptance
- does not prove complete high-risk semantic coverage

## Runtime checker boundary

- check:runtime detects runtime projects/tooling
- by default it does not execute Maven/Vite build commands unless --execute is used or policy enables execution
- release verification must use explicit commands

## Production safety boundary

- check:config-safety reports default/dev risks as warnings
- check:prod-safety blocks production unsafe config
- application-prod.yml must use environment variables

## CI scaffold-ci boundary

- governance job runs npm run check
- backend-compile job runs Maven compile
- frontend-build job runs Vite production build
- CI pass does not equal manual business acceptance pass

## Release verification

- npm run verify:release is the intended release verification entry
- it must not be weakened just because plain mvn is unavailable on one local machine
- if mvn is missing locally, record the failure and use the project configured Maven path for supplementary evidence, but do not claim verify:release passed

## Runtime acceptance still required

- Java/Spring service tests
- MySQL migration tests
- MySQL row-lock/concurrency tests
- browser smoke tests
- manual acceptance for customer/sales/production/fund workflows

## R-08 customer runtime tests

- `mvn -pl ruoyi-business -am test` is the customer Java service/unit test layer for R-08.
- `ruoyi-business` also defines an opt-in `integration-test` Maven profile for MySQL/Testcontainers checks. It is not part of default `npm run check`.
- R-08 Java tests may prove customer service/idempotency behavior, but they do not prove browser acceptance, production readiness, released-data migration safety, or sales-order readiness.
- MySQL/Testcontainers results must be recorded as run only when `mvn -pl ruoyi-business -am -Pintegration-test verify` actually passes in the current environment.
