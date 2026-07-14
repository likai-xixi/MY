# Handover

## Summary

[local] Governance change `CR-20260714T114811Z-frontend-ci-and-esm-scanner-hardening` makes frontend tests and a full moderate dependency audit explicit, resolves release Maven portably without weakening the fixed reactor, closes required-command, environment, dynamic-program, wrapper-chain, and duplicate-audit false-greens, and makes executable `.mjs` helpers visible to every non-route governance scanner.

## Impact

- CI accepts only exact root/frontend verification commands, one canonical frontend audit, and the exact `ruoyi-business -am -Pintegration-test verify` reactor shape; help/version/dry-run/if-present/test-selection/wrong-module variants do not count.
- Local `verify:release` resolves only the Maven executable from runtime policy with standard `mvn` fallback, then runs the fixed six-stage sequence and stops on the first failure.
- `.mjs` helpers are scanned for API, permission, ownership, boundaries, phase gates, references, deletion residue, duplicates, method weight, and text hygiene without becoming route pages or component candidates.
- Nested dependency directories remain excluded while the real `ruoyi-ui/src/views/tool/build/**` source tree remains governed.
- GitHub Actions roadmap state is now `completed`; `beforeSalesOrder` remains blocked.
- No business runtime, frontend runtime, API, route, permission, SQL, database, graph, lockfile, release, or deployment change is included.

## Changed Files

- `.github/workflows/ci.yml`
- `ai/changes/CR-20260714T114811Z-frontend-ci-and-esm-scanner-hardening/changed-files.json`
- `ai/changes/CR-20260714T114811Z-frontend-ci-and-esm-scanner-hardening/handover.md`
- `ai/changes/CR-20260714T114811Z-frontend-ci-and-esm-scanner-hardening/impact.json`
- `ai/changes/CR-20260714T114811Z-frontend-ci-and-esm-scanner-hardening/plan.md`
- `ai/changes/CR-20260714T114811Z-frontend-ci-and-esm-scanner-hardening/request.md`
- `ai/changes/CR-20260714T114811Z-frontend-ci-and-esm-scanner-hardening/verification.md`
- `ai/changes/CURRENT_CHANGE.json`
- `ai/context/current-context.json`
- `ai/context/current-context.md`
- `ai/governance/false-green-regression-matrix.json`
- `ai/registry/test-ownership-exceptions.json`
- `ai/roadmap/enhancement-backlog.json`
- `ai/roadmap/phase-gates.json`
- `ai/rule-proposals/2026-07-14-frontend-ci-and-esm-scanner-hardening.json`
- `docs/production-readiness.md`
- `docs/runtime-verification-boundary.md`
- `memory/CHANGELOG.md`
- `memory/HANDOVER.md`
- `memory/PROJECT_STATE.md`
- `memory/TASKS.json`
- `memory/sessions/2026-07-15-frontend-ci-and-esm-scanner-hardening.md`
- `package.json`
- `scripts/finalize-change.js`
- `scripts/remove-feature.js`
- `tests/ci-coverage-hardening.test.js`
- `tests/diff-checker.test.js`
- `tests/frontend-esm-scanner-governance.test.js`
- `tests/governance-gates.test.js`
- `tests/governance-sales-order-handoff-gate.test.js`
- `tests/ownership-syncer.test.js`
- `tests/package-scripts.test.js`
- `tests/production-safety.test.js`
- `tests/release-verifier-governance.test.js`
- `tests/remove-feature.test.js`
- `tools/boundary-lint.js`
- `tools/ci-coverage-declaration-checker.js`
- `tools/diff-checker.js`
- `tools/duplicate-scan.js`
- `tools/false-green-matrix-checker.js`
- `tools/file-weight-checker.js`
- `tools/governance-checker-utils.js`
- `tools/impact-analyzer.js`
- `tools/orphan-code-checker.js`
- `tools/ownership-syncer.js`
- `tools/phase-gate-checker.js`
- `tools/release-verifier.js`
- `tools/scan-api-clients.js`
- `tools/scan-components.js`
- `tools/scan-permissions.js`
- `tools/scan-utils.js`

## Commands

- [local] `npm run resume`
- [local] `npm run context:build -- platform`
- [local] focused eleven-file Node regression suite
- [local] portable release-verifier and anti-false-green regression suite
- [local] `npm run scan:all`
- [local] `npm run scan:all:check`
- [local] `npm run check:ci-coverage-declaration`
- [local] `npm run check:false-green-matrix`
- [local] `npm --prefix ruoyi-ui test`
- [local] `npm --prefix ruoyi-ui audit --audit-level=moderate --include=dev`
- [local] `npm --prefix ruoyi-ui run build:prod`
- [local] `npm test`
- [local] `npm run check`
- [local] `npm run verify:release`
- [local] `git diff --check`

## Verification

- [local] Final focused governance/scanner coverage passed 234/234; CI hardening passed 42/42, including dynamic executable/subcommand/argument, local assignment, process-wrapper, Maven environment, and known-root controls.
- [local] Two independent adversarial reviews returned GO with no P0-P3; root tests and the complete repository governance gate passed 480/480.
- [local] UI tests passed 7/7; the audit reported zero vulnerabilities across 360 dependencies; the production build succeeded with 2601 transformed modules.
- [local] Scan, ownership, registry, roadmap, phase, boundary, diff, false-green, and CI declaration gates pass.
- [local] Portable release-verifier coverage passed 94/94 across exact ordering, invalid-policy closure, configured/fallback Maven selection, no retry after a real reactor failure, and every fail-fast boundary.
- [local] The pre-fix all-up release run reached Maven after the 448/448 root gate and production safety, then stopped on the bare-`mvn` PATH defect.
- [local] The final all-up release run passed with 480/480 Node tests, 60/60 Java tests including two MySQL/Testcontainers integrations, 7/7 UI tests, zero vulnerabilities across 360 audited dependencies, and the 2601-module production build.
- [local] The first `verify:release` attempt reached `check:change` and stopped only because finalization had not yet populated `changed-files.json`; no code, test, Maven, audit, or build failure occurred before that expected boundary.

## Risks

- Remote GitHub Actions evidence remains pending until this batch is committed and pushed.
- Development/default configuration still emits the existing production-safety warnings; the production profile gate remains green.
- `beforeSalesOrder` remains blocked and no sales-order implementation is authorized.

## Next Actions

- Finalize the post-verification evidence, rerun the final repository/close gates, then perform the staged-scope audit.
- Commit and push `master`, confirm the remote commit and GitHub Actions, and run the post-push gate.
- Preserve both existing stashes; do not release or deploy.
