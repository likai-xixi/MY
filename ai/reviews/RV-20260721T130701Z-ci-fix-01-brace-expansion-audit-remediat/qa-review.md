# QA Review

## Required Local Evidence

- Preserve pre-fix audit JSON, advisory identifiers, dependency tree, usage path, and exact lockfile diff.
- Run `npm ci`, post-fix tree/explain, `npm audit --audit-level=moderate --include=dev`, and `npm audit --json` with exit code 0.
- Run the platform dependency regression, UI 7/7, production build, R-12A Node 39/39, Java 65/65, MySQL integration 2/2, scans, full `npm run check`, close gate, and whitespace checks.
- Prove both phase gates remain blocked, no R-12B path exists, and the R-12A review package/decision have zero diff.

## Release Boundary

Local success authorizes a local commit only. Push, GitHub Actions run inspection, R-12A CI-green status, post-push handover, and an R-12B pre-review baseline remain blocked until explicit push authorization and a successful three-job workflow.
