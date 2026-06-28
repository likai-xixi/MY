# Verification

Status: [local] local verification passed

## Commands

- [local] `npm run resume` passed before business-code edits.
- [local] `git status --short --branch` returned clean `master...origin/master` before R-10D edits.
- [local] `git -c http.proxy= -c https.proxy= fetch origin master` passed after plain fetch hit the local HTTPS reset.
- [local] `git rev-parse HEAD origin/master FETCH_HEAD` confirmed all three refs at `bd8bbb92f640b1a04ac58cb5a52bab78eaef362c`.
- [local] `npm run check:phase-gate` passed and `beforeSalesOrder` remains blocked.
- [local] `npm run impact -- masterdata --mode update` passed with no blockers.
- [local] `npm run scan:all` passed.
- [local] `npm run build:graph` passed.
- [local] `npm run sync:memory` passed.
- [local] `npm run context:build -- masterdata` passed.
- [local] `npm run finalize:change -- --summary "R-10D masterdata code autogeneration"` passed.
- [local] `node --test tests/masterdata-runtime.test.js` passed 15/15.
- [inconclusive] First `npm run check` stopped at `check:doc-size` because `memory/PROJECT_STATE.md` had 221 lines against a 220-line limit; fixed by compressing one memory line without changing rules.
- [inconclusive] Second `npm run check` stopped at `check:verification-provenance` because generated template evidence lacked provenance labels; this file records the corrected evidence.
- [local] `npm run context:build -- customer` passed to restore the default generated current-context idempotence expected by the full gate.
- [local] Final `npm run check` passed with `npm test` 248/248.
- [local] `git diff --check` passed.
- [not-run] Plain global `mvn -pl ruoyi-admin -am -DskipTests compile` is unavailable on PATH in this local shell.
- [local] With the cached Maven bin temporarily on PATH, `mvn -pl ruoyi-admin -am -DskipTests compile` passed with reactor `BUILD SUCCESS`.
- [local] `npm --prefix ruoyi-ui run build:prod` passed with Vite production build success.

## Evidence

- [local] Backend code generation is implemented in `ruoyi-business/src/main/java/com/ruoyi/business/common/code/BusinessMonthlyCodeGenerator.java` and `MasterDataServiceImpl`.
- [local] Create ignores caller-supplied code and generates `prefix + yyyyMM + 6 digit monthly sequence` with bounded 8-attempt duplicate-key retry.
- [local] Edit preserves the existing code by setting payload code back to the stored value before update.
- [local] Frontend add no longer shows the code field; frontend edit shows code disabled/read-only.
- [local] `tests/masterdata-runtime.test.js` verifies resource prefixes, code format, add without code, code immutability, uniqueness, bounded retry, frontend behavior, and forbidden runtime absence.
- [local] No customer runtime, idempotency runtime, security configuration, package/tool/workflow file, or sales-order/field-scheme/formula/technical-decomposition runtime file was modified.
- [local] `beforeSalesOrder` remains blocked; R-11 was not started.
