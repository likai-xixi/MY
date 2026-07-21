# Verification

Status: verified [local]

## Commands

- [local] `npm run resume`; intake HEAD/tracking/remote were clean and aligned at `58478e509d69eb212d5808463b7efeea47bee64e`.
- [local] `npm run impact -- platform --mode update --json`, `npm run rule:preflight -- before-sales-order-phase-gate`, `npm run context:build -- platform`, and the independent five-role pre-review passed.
- [local] Review-only commit/base `6a9bfd57548160d85e28776f415b5883b6d92836` contains the approved review and no lockfile/test implementation diff.
- [local] Pre-fix `npm ci` reported one high finding; `npm audit --audit-level=moderate --include=dev` and `npm audit --json` exited 1. Required `npm ls` / `npm explain` and source-usage searches were run and persisted under `dependency-evidence`.
- [local] `gh api /advisories/GHSA-3jxr-9vmj-r5cp`, npm package metadata, and `npm diff --diff=brace-expansion@2.1.1 --diff=brace-expansion@2.1.2` supplied advisory and compatibility evidence.
- [local] Normal `npm install` / `npm uninstall --package-lock-only` resolution left no direct dependency and moved the existing transitive node to `brace-expansion@2.1.2`.
- [local] Direct recursive deletion of the verified `D:\Project\MY\ruoyi-ui\node_modules` target was denied by execution policy; no bypass was used. The next `npm ci` used npm clean-install removal/rebuild semantics and passed with 0 vulnerabilities.
- [local] Post-fix tree/explain commands and both audit commands passed; `post-fix-audit.json` records 0 vulnerabilities and exit code 0.
- [local] `node --test tests/frontend-dependency-hardening.test.js` 5/5; UI `npm test` 7/7; `build:prod` 2602 modules after a second 7/7 prebuild run.
- [local] `node --test tests/masterdata-runtime.test.js` 39/39.
- [inconclusive] Direct `mvn -pl ruoyi-business -am verify` did not start because `mvn` is absent from shell PATH.
- [local] Configured Maven 3.9.9 `-pl ruoyi-business -am verify` passed 65/65 including masterdata 28/28; `-Pintegration-test verify` passed the same unit set plus MySQL/Testcontainers 2/2.
- [local] `npm run scan:all`, `npm run check:review`, `npm run check:phase-gate`, `npm run check:ci-coverage-declaration`, `npm run finalize:change`, and `git diff --check` passed.
- [local] Two intermediate `npm run check` attempts exposed only handover/memory evidence-format defects; those provenance and heading defects were corrected without code, dependency, or gate changes.
- [local] Final complete `npm run check` passed every gate and 491/491 root Node tests; its embedded `npm run close:change` passed, and a separate `npm run close:change` plus `git diff --check` also passed.
- [local] Scope audit reports CI-FIX review diff=0, R-12A review diff=0, forbidden runtime diff=0, no R-12B path, and both phase gates blocked.
- [not-run] Push, GitHub Actions, `check:after-push`, and post-push handover are not authorized.

## Evidence

- Advisory: npm `1123896`; `GHSA-3jxr-9vmj-r5cp`; `CVE-2026-13149`; high; CWE-400/CWE-407; affected 2.x `>=2.0.0 <2.1.2`; first patched `2.1.2`; `fixAvailable=true`; no major required.
- Pre-fix tree: one deduplicated `brace-expansion@2.1.1` through `js-beautify -> editorconfig -> minimatch`, `js-beautify -> glob -> minimatch`, and `unplugin-auto-import -> minimatch`.
- [local] The form builder genuinely calls `beautifier.html` and enters the production bundle, but project/user text is not passed to brace/glob pattern APIs. Practical request exploitability was not established; the blocking patch was available and applied.
- `ruoyi-ui/package.json` has no diff. No parent version, override, workflow, threshold, package manager, or business source changed. The lockfile's only dependency version delta is `brace-expansion 2.1.1 -> 2.1.2` plus registry/integrity metadata.
- The platform-owned regression rejects every advisory-affected release line and asserts current `2.1.2`.
- R-12A review package diff=0; R-12A decision diff=0; forbidden runtime diff=0; no R-12B-named changed path.
- `engineeringCoreReady=blocked`; `beforeSalesOrder=blocked`.
- Remote CI and R-12A release closure remain `[not-run]`.

## Published Recovery Verification

- [local] The original `[not-run]` line above records the pre-push boundary at implementation commit time; it is not deleted or rewritten.
- [ci] Later workflow `29876893425` ran against `010688b5928d2bc4385bb8037940f5573587c5ae` and concluded `success`: `governance=success`, `backend-tests=success`, `frontend-build=success`.
- [ci] The real frontend job logged 0 vulnerabilities for the exact include-dev audit and completed the 2602-module production build.
