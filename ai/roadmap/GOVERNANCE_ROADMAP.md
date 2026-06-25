# Governance Roadmap

## Purpose

This roadmap defines the governance work required before the project starts sales-order implementation. It is intentionally not a sales-order design or implementation plan.

## Current Position

- Repository profile: RuoYi + Vue3 + Codex Auto Dev OS.
- Profile state: locked `ruoyi` adapter.
- Active business context: `customer`.
- Current governance change: sales-order-before handoff gate.
- Sales order implementation status: not started.

## Governance Sequence

1. Establish a compact current-context handoff so new Codex windows do not bulk-read all historical changes, reviews, features, or source code.
2. Require multi-role review before complex add/update work, especially sales order.
3. Add document-size and read-budget checks to keep handoff files usable.
4. Add roadmap, phase-gate, and refactor-debt checks so future business work sees blockers before code is created.
5. Define sales-order snapshot, state-machine, and fund-boundary contracts before any sales-order code or database table appears.
6. Defer larger automation such as code index, dependency matrix, API integration tests, UI smoke tests, and GitHub Actions until the required handoff gate is stable.

## Non-Goals

- Do not create a sales-order module.
- Do not add sales-order tables.
- Do not edit customer-management business code.
- Do not loosen existing profile, diff, handoff, component, boundary, or runtime gates.

## Gate Summary

`beforeSalesOrder` is the next business-development gate. It is allowed to block sales-order implementation while still allowing governance/rule-change work that improves the gate itself.
