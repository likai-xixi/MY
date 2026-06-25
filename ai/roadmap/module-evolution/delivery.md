# Delivery Module Evolution

## Current Role

Delivery is not implemented.

## Dependency

Delivery depends on approved sales-order state transitions, order line snapshot data, shipment boundary rules, and post-order address behavior.

## Guard

Do not start delivery until `beforeSalesOrder` and the later delivery gate are complete.
