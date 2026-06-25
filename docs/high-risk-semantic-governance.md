# High-Risk Semantic Governance

CR-3 establishes the framework for high-risk semantic checks. It is governance-only: it does not modify customer runtime code, create sales-order code, or change business database structures.

## Framework Pieces

- `ai/registry/high-risk-domains.json` records the domain catalog and the current blocking mode for each domain.
- `ai/registry/idempotency-registry.json` records high-risk mutating API idempotency requirements once implementation entries exist.
- `ai/registry/state-machines.json` records explicit state machines once contract entries exist.
- `ai/registry/migration-registry.json` records executable migrations. Existing customer DDL is a baseline warning only.
- `ai/registry/high-risk-permission-coverage.json` records dedicated permission coverage for high-risk APIs.
- `ai/rules/schemas/*.schema.json` defines evidence manifests, contract-to-test matrices, idempotency entries, state machines, migration entries, and permission coverage.
- `tools/high-risk-governance-checker.js` validates the framework and supports section subcommands.

## Blocking Boundary

Current blocking behavior is intentionally narrow:

- Schema and registry format errors fail.
- Existing evidence manifests fail when required fields or covered files are missing.
- Stale hashes and stale commits warn unless the manifest declares `blocking: true`.
- Required idempotency, migration, state-machine, contract-test, or permission entries fail when incomplete.
- Existing customer migration DDL in `sql/customer.ownership.md` remains a non-blocking baseline warning.

Current non-blocking behavior:

- Missing `ai/evidence/**/*.json` manifests do not fail.
- Missing sales-order, delivery, finance, or production runtime entries do not fail until later CRs add required entries.
- Customer-fund evidence freshness is not blocking until a machine evidence manifest is produced.

## Sales-Order Boundary

`beforeSalesOrder` remains blocked. CR-3 does not create the sales-order snapshot, state-machine, fund-boundary, idempotency, contract-to-test, or migration-plan contracts. Those belong to CR-4 before any sales-order controller, service, mapper, domain, Vue, API client, SQL table, route, or permission is created.

## Verification

Run:

```bash
npm run check:high-risk-governance
npm test
npm run check
```

The full `npm run check` gate includes `check:high-risk-governance` and keeps the existing phase gate, review gate, change handoff gate, diff gate, runtime gate, and Node test suite wired.
