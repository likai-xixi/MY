# Request

Align the mixed Testcontainers Maven test dependency graph found during the repository-wide review. Keep this as an isolated platform dependency-maintenance change: do not change Java, tests, runtime configuration, UI, SQL, governance rules, release, or deployment.

The pre-change tree resolves direct `org.testcontainers:mysql` at 1.21.3 while Spring Boot 3.5.14 dependency management resolves `jdbc`, `database-commons`, and `testcontainers` at 1.21.4. Use the existing BOM as the single version authority, prove convergence with the effective dependency tree, and rerun the real MySQL integration tests.
