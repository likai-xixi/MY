# Sales Order Module Evolution

## Current Role

Sales order is not implemented.

## Required Before Implementation

- `engineering-core-ready` is complete and its phase gate is ready.
- `beforeSalesOrder` passes.
- A committed-base sales-order review explicitly allows the runtime roots.
- Snapshot, state-machine, and fund-boundary contracts are approved.
- The calculation input and release interfaces are stable so orders do not absorb technical/formula/DXF fields later.

## Intended Boundary

Sales order records commercial/customer intent and freezes `OrderVersion` artifacts. It references a product model and sales fields/options, but it does not own process-plan contents, technical fields, calculation outputs, decomposition parts, formulas, DXF data, or production routes.

## Guard

No sales-order controller, service, mapper, page, API client, route, permission, SQL table, or runtime test may be created while either gate is incomplete. R-11 creates none.
