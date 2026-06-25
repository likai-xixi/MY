# Handover

## Summary

Current rule-change: `CR-20260625T130657Z-high-risk-semantic-governance-framework`.

CR-3 adds the high-risk semantic governance framework. `beforeSalesOrder` remains blocked.

## Impact

This change adds framework-only registries, schemas, checker logic, tests, docs, package script wiring, current context, and memory updates for high-risk semantic governance.

No customer runtime Java/Vue/mapper/XML/API/SQL, customer business rules, sales-order runtime code, delivery/finance/production runtime code, or business database structure is changed.

## Changed Files

See `ai/changes/CR-20260625T130657Z-high-risk-semantic-governance-framework/changed-files.json`.

Key files:

- `tools/high-risk-governance-checker.js`
- `tests/high-risk-governance.test.js`
- `ai/registry/high-risk-domains.json`
- `ai/registry/idempotency-registry.json`
- `ai/registry/state-machines.json`
- `ai/registry/migration-registry.json`
- `ai/registry/high-risk-permission-coverage.json`
- `ai/rules/schemas/*.schema.json`
- `docs/high-risk-semantic-governance.md`
- `package.json`

## Commands

- [local] `npm run resume` - passed.
- [local] `node --test tests/high-risk-governance.test.js` - passed with 36 tests.
- [local] `npm test` - passed with 174 tests.
- [local] `npm run check:high-risk-governance` - passed with one expected non-blocking customer baseline migration warning.
- [local] `npm run check` - passed, including `check:high-risk-governance` and `npm test` with 174 tests.
- [not-run] `mvn -pl ruoyi-admin -am -DskipTests compile` - plain `mvn` is not runnable on the local PATH; use the project configured Maven command below for local compile evidence.
- [local] `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests compile` - passed with reactor `BUILD SUCCESS`.
- [local] `npm --prefix ruoyi-ui run build:prod` - passed with Vite production build success.
- [local] `git diff --check` - passed.
- [local] forbidden-path audit - passed with `FORBIDDEN_PATH_AUDIT_OK`.

## Verification

- [local] Dedicated high-risk governance tests passed with real fixture roots.
- [local] `npm test` passed with 174 tests.
- [local] Full `npm run check` passed with the new high-risk gate in the existing gate sequence.
- [local] High-risk checker passed; current customer migration DDL is warning-only baseline evidence.
- [local] Missing evidence manifests do not fail in CR-3, and missing future module runtime entries are not hard blockers.
- [local] Backend compile passed through the project configured Maven path after the bare `mvn` command showed the local PATH issue.
- [local] Frontend production build, whitespace diff check, and forbidden-path audit passed.

## Risks

- CR-4 still needs sales-order snapshot, state-machine, fund-boundary, idempotency, contract-to-test, and migration-plan contracts.
- Evidence freshness is not customer-fund blocking until a machine evidence manifest exists.
- Migration/idempotency/state-machine/high-risk-permission entries become blocking as future contracts mark them required.

## Next Actions

- Review CR-3.
- Commit and push only after explicit user confirmation.
- Keep CR-4 as the sales-order contract package.
