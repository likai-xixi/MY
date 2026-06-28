# Plan

1. Confirm R-10F baseline and local/remote alignment.
2. Create R-10G acceptance-only change record.
3. Start or reuse local backend, frontend, MySQL, and Redis.
4. Run live API acceptance against product-category hierarchy behavior.
5. Run browser acceptance on canonical `/business/masterdata`.
6. Record evidence in the R-10G change record and memory files only.
7. Run `npm run check` and `git diff --check`.
8. Commit and push evidence if all acceptance checks pass.

No Java, Vue, API client, SQL, workflow, package, security, customer, idempotency, or sales-order runtime files may be changed.
