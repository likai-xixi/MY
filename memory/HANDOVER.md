# Handover

## Summary

[local] Active governance change `CR-20260714T114811Z-frontend-ci-and-esm-scanner-hardening` is in final closeout. It explicitly enforces frontend tests and a full moderate audit, resolves release Maven portably, rejects required-command, environment, dynamic-program, wrapper-chain, and wrong-reactor false-greens, and governs executable `.mjs` helpers without creating fake routes/components.

## Impact

- CI coverage is exact and failure-propagating: root install/check/test, `ruoyi-business -am` integration verification, frontend install/test, exactly one full audit, and production build.
- Local release verification resolves only the Maven executable from runtime policy with standard fallback; its six required stages remain fixed and fail fast.
- `.mjs` is covered across non-route scanners; nested dependencies are excluded and legitimate `src/**/build` source remains visible.
- The roadmap now records GitHub Actions as completed, while `beforeSalesOrder` remains blocked.
- Business runtime, UI runtime, APIs, routes, permissions, SQL, database, graph, dependencies, lockfiles, release, and deployment are unchanged.

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
- [local] focused governance/scanner regressions
- [local] portable release-verifier and anti-false-green regressions
- [local] `npm run scan:all`
- [local] `npm run scan:all:check`
- [local] `npm --prefix ruoyi-ui test`
- [local] `npm --prefix ruoyi-ui audit --audit-level=moderate --include=dev`
- [local] `npm --prefix ruoyi-ui run build:prod`
- [local] `npm test`
- [local] `npm run check`
- [local] `npm run verify:release`
- [local] `git diff --check`

## Verification

- [local] Final focused governance/scanner coverage passed 234/234; CI hardening passed 42/42 across dynamic commands, local assignments, process wrappers, Maven environments, and known-root controls.
- [local] Two independent adversarial reviews returned GO with no P0-P3; root tests and the complete repository governance gate passed 480/480.
- [local] UI tests passed 7/7; the audit reported zero vulnerabilities across 360 dependencies; the production build passed with 2601 modules transformed.
- [local] Generated scans, registry, ownership, boundaries, roadmap, phase gate, diff, false-green matrix, and CI declaration checks pass.
- [local] Portable release-verifier coverage passed 94/94 across exact stage order, Maven resolution, invalid-policy closure, no retry after reactor failure, inherited environment, and every fail-fast boundary.
- [local] The pre-fix all-up release run reached Maven after the root and production-safety gates passed, then stopped on the bare-`mvn` PATH defect.
- [local] The final all-up release run passed with 480/480 Node tests, 60/60 Java tests including two MySQL/Testcontainers integrations, 7/7 UI tests, zero vulnerabilities across 360 audited dependencies, and the 2601-module production build.
- [local] The initial release-verification run stopped only at the expected empty `changed-files.json` pre-finalization boundary.

## Risks

- Commit, push, and remote GitHub Actions confirmation are pending.
- Existing development/default production-safety warnings remain informational; production-profile validation passes.
- Sales-order implementation remains blocked.

## Next Actions

- Finalize the post-verification evidence, rerun the final repository/close gates, and complete the staged-scope audit.
- Commit and push `master`, confirm Actions, then run the post-push check.
- Preserve `stash@{0}` and `stash@{1}`; do not release or deploy.

## Recovery Pointer

Read `AGENTS.md`, `ai/context/current-context.md`, this handover, and `ai/changes/CR-20260714T114811Z-frontend-ci-and-esm-scanner-hardening/verification.md`. The two stashes are superseded historical snapshots and must not be applied, popped, or dropped during closeout.
