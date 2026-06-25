# Backend Review

## Required Backend Change

- Add `ICustomerFundService` with methods needed by the existing customer service fund API surface.
- Add `CustomerFundServiceImpl` and move fund mutation helpers out of `CustomerServiceImpl`.
- Inject `ICustomerFundService` into `CustomerServiceImpl` and delegate `recordCustomerDeposit`, internal fund entry, sample-rebate fund entry, and fund account initialization as needed.
- Add `CustomerMapper.selectFundAccountForUpdate(Long customerId, String accountType)` plus XML SQL ending in `for update`.

## Data Integrity

- Deposit entry must reject PUBLIC customers before account creation or mutation.
- Balance math must use the locked account row returned by `selectFundAccountForUpdate`.
- Missing account creation must handle the concurrent create race with `DuplicateKeyException` and a locked re-read.
- `insertFundFlow` and `insertDepositBatch` must catch `DuplicateKeyException`, regenerate only the conflicting number, and retry up to a clear maximum such as 8 attempts.
- Maximum retry exhaustion must throw a clear `ServiceException`.

## Compile And Compatibility

- Keep existing Java domain objects and mapper XML table shape.
- Keep existing `ICustomerService` methods used by the controller and UI.
- Do not change permissions, menu routes, or SQL table structure.
- Run Maven compile because Java/XML files are modified.
