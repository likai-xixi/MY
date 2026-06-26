# File Weight Exception

Scope: `CR-20260626T124443Z-customer-fund-idempotency`

`ruoyi-business/src/main/java/com/ruoyi/business/customer/service/impl/CustomerServiceImpl.java` is a pre-existing large customer service file. R-07 touches it only to wrap `createSampleRebateRecord` with idempotency begin/replay/success handling and to add the small canonical hash/replay helpers used by that endpoint.

This CR intentionally does not split `CustomerServiceImpl` because a service extraction would broaden the change beyond customer fund idempotency and increase release risk. A later refactor batch can split customer sample policy/rebate responsibilities if the user opens that scope.
