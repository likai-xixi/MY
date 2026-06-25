# Verification

Status: [local] verified. CR-3 high-risk semantic governance framework passed Node tests, the standalone high-risk checker, the full governance gate, backend compile through the project configured Maven, frontend production build, whitespace diff check, and forbidden-path audit.

## Commands

- [local] `npm run resume` - passed during startup and again during final verification; current change is `CR-20260625T130657Z-high-risk-semantic-governance-framework`.
- [local] `npm run rule:propose -- "high-risk semantic governance framework" --reason "..."` - created `ai/rule-proposals/2026-06-25-high-risk-semantic-governance-framework.json`.
- [local] `npm run start:change -- --mode rule-change "high-risk semantic governance framework"` - created `CR-20260625T130657Z-high-risk-semantic-governance-framework`.
- [local] `node --test tests/high-risk-governance.test.js` - passed with 36 tests.
- [local] `npm test` - passed with 174 tests.
- [local] `npm run check:high-risk-governance` - passed with one expected non-blocking customer baseline migration warning.
- [local] `npm run check` - passed; it includes `check:high-risk-governance`, the existing governance gates, `check:change`, `check:runtime`, and `npm test` with 174 tests. Existing `check:config-safety` development/default warnings remain warning-only.
- [not-run] `mvn -pl ruoyi-admin -am -DskipTests compile` - plain `mvn` is not runnable on the local PATH; use the project configured Maven command below for local compile evidence.
- [local] `C:\Users\11131\.cache\codex-tools\apache-maven-3.9.9\bin\mvn.cmd -pl ruoyi-admin -am -DskipTests compile` - passed with reactor `BUILD SUCCESS`; this is the Maven path configured for this project in `ai/rules/runtime-policy.json`.
- [local] `npm --prefix ruoyi-ui run build:prod` - passed with Vite production build success.
- [local] `git diff --check` - passed.
- [local] forbidden-path audit - passed with `FORBIDDEN_PATH_AUDIT_OK`.

## Evidence

- [local] `tests/high-risk-governance.test.js` uses temporary fixture roots and real file reads for high-risk domains, evidence freshness, contract-to-test matrices, idempotency, state machines, migration gates, permission coverage, and repo-level safety.
- [local] `npm test` passed after adding scoped boundary/component exceptions for pre-existing RuoYi system/tool findings and regenerating current context with `npm run context:build -- customer`.
- [local] `npm run check:high-risk-governance` validates schemas, registries, evidence directory behavior, matrix discovery, empty registries, and the customer baseline migration warning without treating missing future sales-order/delivery/finance/production runtime evidence as blocking.
- [local] The only current high-risk checker warning is `baseline-migration-document` for `customer-current-ddl-baseline`, which is intentional because existing customer DDL lives in `sql/customer.ownership.md` and CR-3 must not rewrite it as an executable migration.
- [local] Forbidden-path audit checked current changed and untracked paths against the customer runtime roots, `sql/customer.ownership.md`, sales-order runtime roots, and delivery/finance/production runtime roots; no forbidden path was present.
- [local] No CI result is claimed for CR-3 because this change has not been committed or pushed.
