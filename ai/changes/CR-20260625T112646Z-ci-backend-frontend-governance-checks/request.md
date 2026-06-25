# Request

Continue CR-2: add baseline GitHub Actions CI coverage for the governance, backend, and frontend build surfaces.

Required CI coverage:

- Node governance: `npm run check`.
- Backend compile: `mvn -pl ruoyi-admin -am -DskipTests compile`.
- Frontend build: `npm --prefix ruoyi-ui run build:prod`.

Hard boundaries:

- This is a governance/ci rule-change.
- Do not create sales-order code.
- Do not modify customer Java, Vue, mapper XML, API client, SQL runtime code, business rules, or business database schema.
- Do not loosen existing gates.
- Do not add fake CI, echo-success scripts, database services, real secrets, or `continue-on-error: true`.
- Do not implement CR-3 high-risk semantic framework or CR-4 sales-order contracts.
- Do not wire `check:after-push` into `npm run check`.
