# Verification

Status: blocked [local]

## Commands

- `[local] npm run scan:all`
- `[local] node --test tests/customer-risk-gate.test.js`
- `[local] mvn -pl ruoyi-admin -am test`
- `[local] mvn -pl ruoyi-business -am -Pintegration-test verify`
- `[local] npm test`
- `[local] npm --prefix ruoyi-ui run build:prod`
- `[local] git diff --check`
- `[inconclusive] npm run check` (stopped at the governance context-build idempotency test: 264/265 Node tests passed)

## Evidence

[local] customer risk gate 19/19; Maven reactor unit 37/37; MySQL 8 Testcontainers integration 1/1; the standalone Node suite passed 265/265 before the final context refresh; frontend production build 2554 modules; scan:all and git diff --check passed. A subsequent full `npm run check` reached the final Node suite and stopped at 264/265 because `context build is idempotent and generated context passes context/read-budget checks` failed. The failure is in governance context generation, not the customer implementation, and remains a project-level blocker until the dedicated governance batch repairs and reruns the complete gate.
