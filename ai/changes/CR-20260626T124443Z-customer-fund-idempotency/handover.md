# Handover

## Summary

R-07 adds request idempotency to the two high-risk customer fund entry points: customer deposit entry and sample rebate generation, including the customer page payload closeout.

## Impact

This change introduces platform-level `idempotent_request` support and wires it into customer fund deposit and sample rebate transactions. Missing `idempotentKey` is rejected. First requests insert `PROCESSING`; successful business mutations mark `SUCCESS` with result references; same-key/same-hash success requests replay the original result; same-key/same-hash processing requests are rejected as still processing; same-key/different-hash requests are rejected.

The customer Vue page generates a hidden stable `idempotentKey` when the deposit or sample-rebate dialog opens and submits the same key with the payload. `ruoyi-ui/src/api/customer.js` and API paths remain unchanged.

`ai/registry/features.json` and `memory/API_CATALOG.md` are included in R-07 because the idempotency baseline changes customer fund API request semantics and ownership traceability. `features.json` records customer/platform idempotency ownership for `idempotent_request`; `API_CATALOG` records customer fund idempotency request semantics.

Business failures use rollback-on-failure: the idempotency row and fund mutation are in the same Spring transaction, so failed attempts roll back and can be retried safely.

## Changed Files

See `changed-files.json` for the full 41-file recorded scope.

## Commands

- [local] `npm run resume`
- [local] frontend `idempotentKey` precheck commands
- [local] `npm run impact -- 客户管理`
- [local] `npm run scan:all`
- [local] `npm run context:build -- customer`
- [local] `node --test tests/customer-risk-gate.test.js`
- [local] `npm --prefix ruoyi-ui run build:prod`
- [local] `npm run check:high-risk-governance`
- [local] `node --test tests/high-risk-governance.test.js`
- [local] `npm test`
- [not-run] `mvn -pl ruoyi-admin -am -DskipTests compile`
- [local] `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests compile`
- [local] `npm run check`
- [local] `git diff --check`

## Verification

- [local] `npm run resume` passed.
- [local] Final scope audit confirmed `ai/registry/features.json` and `memory/API_CATALOG.md` belong to R-07 idempotency ownership/API catalog sync and are already listed in `changed-files.json`.
- [local] Frontend precheck confirmed the customer page lacked `idempotentKey`; R-07 now adds stable hidden dialog keys for deposit and sample rebate while keeping `customer.js` unchanged.
- [local] `npm run impact -- 客户管理` passed with no blockers.
- [local] `npm run scan:all` passed and refreshed `ai/generated/db-schema.json` plus customer ownership registry entries for `idempotent_request`.
- [local] `npm run context:build -- customer` passed.
- [local] Permission scan completed with no contract changes; R-07 does not add or change menus, auth strings, permissions, or permission ownership.
- [local] `node --test tests/customer-risk-gate.test.js` passed with 15/15 tests.
- [local] `npm --prefix ruoyi-ui run build:prod` passed with Vite production build success.
- [local] `npm run check:high-risk-governance` passed.
- [local] `node --test tests/high-risk-governance.test.js` passed with 40/40 tests.
- [local] `npm test` passed with 196/196 tests.
- [not-run] Plain `mvn -pl ruoyi-admin -am -DskipTests compile` is unavailable on PATH.
- [local] Configured Maven path `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests compile` passed with `BUILD SUCCESS`.
- [not-run] `idempotent_request` migration was statically checked by governance tests; runtime MySQL execution was not performed in this environment.
- [local] `npm run check` passed with 196/196 Node tests.
- [local] `git diff --check` passed.

## Risks

- Runtime MySQL execution of `sql/migrations/V20260625_004_idempotent_request.sql` and `sql/validation/customer_runtime_validation.sql` was not performed in this environment.
- Duplicate request behavior is verified by static gates and backend compile, not by live HTTP/DB replay in this pass.

## Next Actions

- Suggested next customer follow-up: R-08 customer runtime tests.
- Alternative next planning package: R-09 sales-order pre-implementation contract package.
