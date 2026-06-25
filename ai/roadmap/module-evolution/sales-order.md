# Sales Order Module Evolution

## Current Role

Sales order is not implemented.

## Required Before Implementation

- `beforeSalesOrder` phase gate passes.
- Multi-role review decision explicitly contains `Allow Implementation`.
- Snapshot contract is approved.
- State-machine contract is approved.
- Fund-boundary contract is approved.

## Guard

No `ruoyi-business/src/main/java/com/ruoyi/business/salesorder/**`, sales-order controller/service/mapper, `ruoyi-ui/src/views/sales-order/**`, sales-order API client, or sales-order table may be created in this governance change.
