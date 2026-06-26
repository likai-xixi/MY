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
