# Rule Change Preflight

Current change: `CR-20260714T034246Z-repository-wide-governance-gate-evidence-hardeni`
Status: `ok`

## Checker

Blocking issues: 0
- none

## Warnings

- none

## Gate State

beforeSalesOrder: `blocked`

Required items:
- `multi-role-review`
- `current-context`
- `doc-size`
- `read-budget`
- `context-pack`
- `file-weight`
- `roadmap-check`
- `phase-gate-check`
- `refactor-debt-check`
- `snapshot-contract`
- `state-machine-contract`
- `fund-boundary-contract`

Incomplete items:
- `multi-role-review`
- `current-context`
- `doc-size`
- `read-budget`
- `context-pack`
- `file-weight`
- `roadmap-check`
- `phase-gate-check`
- `refactor-debt-check`
- `snapshot-contract`
- `state-machine-contract`
- `fund-boundary-contract`

## Rule Objects

### before-sales-order-phase-gate

- Name: Before sales-order phase gate
- Type: `phase-gate`
- Owner feature: `platform`
- Lifecycle: `published`
- Version: `1.0.0`
- Blocking mode: `blocking`
- Created by: `CR-20260627T101649Z-r-09a-business-rule-object-governance-core`
- Updated by: `CR-20260627T101649Z-r-09a-business-rule-object-governance-core`

Source contracts:
- `AGENTS.md`
- `ai/contracts/rule-change-governance.md`
- `ai/roadmap/phase-gates.json`
- `ai/roadmap/enhancement-backlog.json`
- `ai/roadmap/refactor-debt.json`

Owned files:
- `tools/phase-gate-checker.js`
- `ai/roadmap/phase-gates.json`
- `ai/roadmap/enhancement-backlog.json`
- `ai/roadmap/refactor-debt.json`

Tests:
- `tests/governance-sales-order-handoff-gate.test.js`
- `tests/rule-object-governance.test.js`

Immutable fields:
- `beforeSalesOrder remains blocked until required items are complete`
- `sales-order runtime paths are blocked before the gate is complete`
- `no parallel check:sales-order-gate script`

**Change policy**

```json
{
  "mode": "governance-rule-change",
  "requires": [
    "rule:preflight",
    "phase-gate checker test evidence",
    "no sales-order runtime artifact"
  ]
}
```

**Delete policy**

```json
{
  "allowed": false,
  "reason": "The sales-order pre-implementation gate is required before any sales-order runtime work."
}
```

**Snapshot policy**

```json
{
  "strategy": "gate-state-and-backlog",
  "evidence": "phase-gates, enhancement backlog, refactor debt, and current context must preserve blocked gate state."
}
```

Supersedes:
- none

Superseded by:
- none

Notes: R-09A strengthens the existing phase-gate checker and keeps beforeSalesOrder blocked.
