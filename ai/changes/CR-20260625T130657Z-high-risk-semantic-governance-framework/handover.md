# Handover

## Summary

Current rule-change: `CR-20260625T130657Z-high-risk-semantic-governance-framework`.

CR-3 establishes high-risk semantic governance registries, schemas, checker, tests, package script wiring, and documentation. It is framework-only.

## Impact

This CR adds machine-readable governance for high-risk domains, evidence freshness, contract-to-test matrices, idempotency, state machines, executable migrations, and high-risk permission coverage. It wires `check:high-risk-governance` into `npm run check` without removing existing gates.

No customer runtime Java, Vue, mapper XML, frontend API client, business SQL, customer business rule, sales-order runtime implementation, delivery/finance/production runtime implementation, or business database table structure is part of this change.

`beforeSalesOrder` remains blocked. Sales-order snapshot, state-machine, fund-boundary, idempotency, contract-to-test, and migration-plan contracts remain CR-4 scope.

## Changed Files

See `ai/changes/CR-20260625T130657Z-high-risk-semantic-governance-framework/changed-files.json` for the full 34-file list.

Key surfaces:

- `ai/registry/high-risk-domains.json`
- `ai/registry/idempotency-registry.json`
- `ai/registry/state-machines.json`
- `ai/registry/migration-registry.json`
- `ai/registry/high-risk-permission-coverage.json`
- `ai/rules/schemas/*.schema.json`
- `tools/high-risk-governance-checker.js`
- `tests/high-risk-governance.test.js`
- `package.json`
- `docs/high-risk-semantic-governance.md`
- current context and memory handoff files

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

- [local] The dedicated high-risk test suite passed with 36 real assertions.
- [local] Full `npm test` passed with 174 tests.
- [local] Full `npm run check` passed with the new high-risk gate wired into the existing gate sequence.
- [local] The high-risk checker passed. Its current warning is intentional: existing customer DDL remains a non-blocking markdown baseline; future required migrations must be executable.
- [local] Backend compile passed through the project configured Maven path after the bare `mvn` command showed the local PATH issue.
- [local] Frontend production build passed.
- [local] `beforeSalesOrder` remains blocked by the existing phase gate. CR-3 did not create sales-order contracts or code.

## Risks

- Sales-order snapshot/state/fund/idempotency contracts are still uncreated and remain CR-4 scope.
- Evidence freshness is framework-only until machine evidence manifests exist.
- Customer-fund evidence freshness is not blocking until a machine manifest is produced.
- Migration gate is blocking only for future entries declared `required` or `blocking: true`.
- Idempotency, state-machine, and permission registries are schema/framework surfaces until future contracts add concrete required entries.

## Next Actions

- Review CR-3.
- Commit and push only after explicit user confirmation.
- Start CR-4 for the sales-order contract package after CR-3 is accepted.
