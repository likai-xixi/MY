# Multi-Role Review Workflow

## Purpose

Complex feature add/update work must be reviewed before implementation. This is especially important for sales order because it will depend on customer snapshots, state transitions, delivery, finance, and production boundaries.

## Supported Chat Modes

- `功能讨论：...` creates a discussion review package.
- `功能预审：...` creates a pre-implementation review package.

Both modes use:

```bash
npm run review:feature -- "功能预审：..."
```

## Generated Review Package

Each review is created under `ai/reviews/RV-*` and includes:

- `request.md`
- `context.md`
- `product-review.md`
- `architecture-review.md`
- `backend-review.md`
- `frontend-review.md`
- `qa-review.md`
- `risk-register.md`
- `decision.md`
- `review.json`

## Implementation Gate

The default decision blocks implementation. Complex add/update work may proceed only after reviewers intentionally update `decision.md` to include the exact text `Allow Implementation`.

## Sales-Order Boundary

Before sales-order implementation, the review must confirm:

- `beforeSalesOrder` gate status.
- Snapshot contract.
- State-machine contract.
- Fund-boundary contract.
- No customer business-code modification is being smuggled into governance work.
