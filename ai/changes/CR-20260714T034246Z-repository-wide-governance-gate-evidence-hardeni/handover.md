# Handover

## Summary

This rule-change hardens the repository governance baseline, immutable Git evidence, pre-implementation review binding, deterministic context, Java test ownership, verification provenance, runtime detection, and reproducible CI. It does not modify business runtime code or the production application profile.

## Impact

The active change is `CR-20260714T034246Z-repository-wide-governance-gate-evidence-hardeni`. It replaces copied legacy exceptions with exact canonical hashes; records actual Git changes from a fixed base commit; rejects self-approved review packages, moving revisions, dangerous edit roots, missing context files, mutable Actions, and business-authored test exceptions; and wires locked Node/UI installs, real Maven integration tests, audit, and production build into CI.

## Changed Files

- `.github/workflows/ci.yml`
- `ai/changes/CR-20260714T034246Z-repository-wide-governance-gate-evidence-hardeni/changed-files.json`
- `ai/changes/CR-20260714T034246Z-repository-wide-governance-gate-evidence-hardeni/handover.md`
- `ai/changes/CR-20260714T034246Z-repository-wide-governance-gate-evidence-hardeni/impact.json`
- `ai/changes/CR-20260714T034246Z-repository-wide-governance-gate-evidence-hardeni/plan.md`
- `ai/changes/CR-20260714T034246Z-repository-wide-governance-gate-evidence-hardeni/request.md`
- `ai/changes/CR-20260714T034246Z-repository-wide-governance-gate-evidence-hardeni/rule-preflight.md`
- `ai/changes/CR-20260714T034246Z-repository-wide-governance-gate-evidence-hardeni/verification.md`
- `ai/changes/CURRENT_CHANGE.json`
- `ai/context/current-context.json`
- `ai/context/current-context.md`
- `ai/governance/false-green-regression-matrix.json`
- `ai/registry/features.json`
- `ai/registry/test-ownership-exceptions.json`
- `ai/rule-proposals/2026-07-14-repository-wide-governance-gate-and-evidence-hardening.json`
- `ai/rules/component-policy.json`
- `ai/rules/module-boundary.json`
- `ai/rules/ruoyi-legacy-baseline.json`
- `memory/CHANGELOG.md`
- `memory/HANDOVER.md`
- `memory/PROJECT_STATE.md`
- `memory/TASKS.json`
- `memory/sessions/2026-07-14-governance-gate-evidence-hardening.md`
- `package-lock.json`
- `package.json`
- `ruoyi-ui/.gitignore`
- `ruoyi-ui/package-lock.json`
- `ruoyi-ui/package.json`
- `scripts/chat-feature.js`
- `scripts/context-build.js`
- `scripts/finalize-change.js`
- `scripts/review-feature.js`
- `scripts/start-change.js`
- `tests/boundary-lint.test.js`
- `tests/change-handoff-integrity-checker.test.js`
- `tests/ci-coverage-hardening.test.js`
- `tests/component-checker.test.js`
- `tests/component-similarity-checker.test.js`
- `tests/diff-checker.test.js`
- `tests/false-green-matrix-checker.test.js`
- `tests/governance-gates.test.js`
- `tests/governance-sales-order-handoff-gate.test.js`
- `tests/legacy-baseline.test.js`
- `tests/package-scripts.test.js`
- `tests/production-safety.test.js`
- `tests/rule-change-guard.test.js`
- `tests/runtime-checker.test.js`
- `tools/boundary-lint.js`
- `tools/change-handoff-integrity-checker.js`
- `tools/ci-coverage-declaration-checker.js`
- `tools/component-checker.js`
- `tools/component-similarity-checker.js`
- `tools/context-pack-checker.js`
- `tools/diff-checker.js`
- `tools/false-green-matrix-checker.js`
- `tools/feature-test-ownership-checker.js`
- `tools/governance-checker-utils.js`
- `tools/legacy-baseline.js`
- `tools/phase-gate-checker.js`
- `tools/review-checker.js`
- `tools/rule-change-guard.js`
- `tools/runtime-checker.js`
- `tools/verification-provenance-checker.js`

## Commands

- `[local] npm run resume`
- `[local] npm run rule:preflight -- before-sales-order-phase-gate`
- `[local] npm run scan:all:check`
- `[local] npm test`
- `[local] npm ci`
- `[local] npm --prefix ruoyi-ui ci`
- `[local] npm --prefix ruoyi-ui audit --audit-level=high`
- `[local] npm --prefix ruoyi-ui run build:prod`
- `[local] mvn -pl ruoyi-business -am -Pintegration-test verify`
- `[local] npm run finalize:change`
- `[local] npm run check`
- `[local] npm run close:change`
- `[local] git diff --check`

## Verification

- [local] The refreshed all-up `npm run check` passed end to end with 377/377 Node tests; focused legacy/index evidence and consumers passed 97/97, evidence/handoff/finalizer passed 69/69, ownership/matrix/review passed 78/78, standalone matrix tests passed 13/13, and CI/governance hardening passed 49/49 after all independently reproduced bypasses were repaired.
- [local] Locked installs, high-severity audit, frontend production build, Maven unit tests, and the MySQL/Testcontainers integration test passed.
- [local] The refreshed all-up `npm run check`, `git diff --check`, root dependency audit, and focused change, close, diff, legacy, ownership, matrix, CI, and provenance gates passed at their recorded checkpoints.
- [local] Expanded finalization matches 63 recorded and actual paths, and the forbidden business-path audit reports zero hits.
- [not-run] Final staged review and post-commit check remain required before this record is complete.

## Risks

- Four moderate frontend dependency findings remain and must be removed in a separate breaking dependency-migration change; the current CI blocks high/critical findings.
- The production Druid property coverage false-green is intentionally split: first add the real properties and packaged startup evidence in the platform business/config change, then harden the checker in a second rule-change.
- GitHub Actions results are not available until the final authorized push.

## Next Actions

- Stage the exact 63-file set, complete the independent staged review, then commit this governance-only record.
- Restore and rebase the verified masterdata stash onto that commit and run its full business gate before committing.
- Complete the separate system notice, platform production-profile, production-checker, and dependency-migration records.
- Push all reviewed commits to `origin/master`, then confirm GitHub Actions; do not release or deploy.
