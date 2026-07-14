# QA Review

## Customer Matrix

- Query-only detail: basic customer succeeds; sensitive calls are absent; fund-account row count is unchanged.
- Dedicated permissions: each permission opens only its owner/fund/flow/policy domain.
- Production rebate negative case: unavailable authority rejects before policy, idempotency, record, or fund writes; UI and API client expose no create action.
- Future-path controls under an injected test authority: client amount is replaced, malformed authority data fails, policy bounds the result, order ID and discount independently change the hash, and database duplicate order identity fails before fund mutation.
- Owner negative cases: ordinary edit mutation, disabled/deleted/non-sales/unassigned-role/display-name-spoof users fail without owner update/log. A valid transfer locks once, updates once, and logs once; zero-row update never logs.

## Masterdata Matrix

- Reject deletion of each referenced category and a referenced product series.
- A rejection performs zero delete calls; an unreferenced row deletes successfully.

## Platform/System Matrix

- Malicious notice HTML cannot execute through the detail component; formatted benign HTML remains visible.
- Removing any required Druid property makes production safety fail.
- A packaged `prod` startup reaches the datasource connection stage without unresolved placeholders.

## Governance Matrix

- An unrelated approved review cannot release another feature/change or out-of-scope path.
- Clean worktree after commit still validates `baseRevision..HEAD` against `changed-files.json`.
- Reactor Maven runs once with `-pl ruoyi-admin -am test`; submodules are not executed standalone.
- CI and `verify:release` reject `-DskipTests compile` as test evidence.
- Both npm workspaces use lockfiles and `npm ci`; audit is executable.
- Current context/change/feature mismatch fails unless a structured override and reason are declared.

## Full Verification

- Targeted Node and Java tests first.
- Maven unit and Testcontainers integration suites.
- Frontend install/test/build/audit.
- `npm run scan:all`, `npm run finalize:change`, `npm run check`, production startup probe, independent diff review, commit/push, GitHub Actions readback, and `npm run check:after-push`.
