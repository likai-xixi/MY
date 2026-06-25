# Customer Module Evolution

## Current Role

Customer management owns customer master data, contacts, addresses, customer-level deposit account evidence, public-customer classification, and ownership history.

## Sales-Order Boundary

Customer remains the source for master data lookup, but sales order must snapshot order-relevant customer/contact/address/owner values at order creation or change points.

## Guard

Do not add sales-order behavior to the customer module. Do not change customer business code in governance-only rule changes.
