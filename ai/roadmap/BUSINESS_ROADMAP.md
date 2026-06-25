# Business Roadmap

## Direction

The business roadmap keeps feature sequencing explicit so future implementation does not fold sales order, delivery, finance, and production into customer management.

## Phase Order

1. Customer management stabilization.
2. Sales order, after `beforeSalesOrder` passes.
3. Delivery, after sales-order snapshot and state transitions are defined.
4. Finance, after sales-order and delivery fund boundaries are explicit.
5. Production, after payment/production release policy is defined.

## Sales Order Entry Criteria

Sales-order work may start only after:

- Multi-role review has produced a decision that explicitly includes `Allow Implementation`.
- `ai/context/current-context.md` and `ai/context/current-context.json` are current.
- Document-size, read-budget, context-pack, file-weight, roadmap, phase-gate, and refactor-debt checks pass.
- Snapshot, state-machine, and fund-boundary contracts exist.

## Boundary Notes

- Customer remains the source for customer master data.
- Sales order must snapshot customer, contact, address, salesman, price, and fund-relevant values needed by order execution.
- Finance and delivery must not depend on mutable customer master data when order history requires fixed evidence.
