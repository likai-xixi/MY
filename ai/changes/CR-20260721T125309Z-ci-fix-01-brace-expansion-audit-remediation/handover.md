# Handover

## Summary

[local] CI-FIX-01 resolves `GHSA-3jxr-9vmj-r5cp` / `CVE-2026-13149` by moving the existing deduplicated transitive `brace-expansion` node from `2.1.1` to compatible patched `2.1.2`. No parent dependency, direct manifest, override, workflow, or business runtime behavior changed.

## Impact

- Current change: `CR-20260721T125309Z-ci-fix-01-brace-expansion-audit-remediation`.
- Independent approved review: `RV-20260721T130701Z-ci-fix-01-brace-expansion-audit-remediat`.
- Review-only implementation base: `6a9bfd57548160d85e28776f415b5883b6d92836`.
- Production use remains the RuoYi form builder's `beautifier.html` call; the vulnerable brace algorithm is not passed form-builder business text.
- The exact baseline/post-fix audit JSON, dependency trees, root cause, and lockfile delta are under `dependency-evidence`.
- R-12A business/review files and every forbidden runtime root remain unchanged; R-12B has not started.

## Changed Files

- `ai/changes/CR-20260721T125309Z-ci-fix-01-brace-expansion-audit-remediation/changed-files.json`
- `ai/changes/CR-20260721T125309Z-ci-fix-01-brace-expansion-audit-remediation/dependency-evidence/lockfile-diff.md`
- `ai/changes/CR-20260721T125309Z-ci-fix-01-brace-expansion-audit-remediation/dependency-evidence/post-fix-audit.json`
- `ai/changes/CR-20260721T125309Z-ci-fix-01-brace-expansion-audit-remediation/dependency-evidence/post-fix-dependency-tree.txt`
- `ai/changes/CR-20260721T125309Z-ci-fix-01-brace-expansion-audit-remediation/handover.md`
- `ai/changes/CR-20260721T125309Z-ci-fix-01-brace-expansion-audit-remediation/impact.json`
- `ai/changes/CR-20260721T125309Z-ci-fix-01-brace-expansion-audit-remediation/plan.md`
- `ai/changes/CR-20260721T125309Z-ci-fix-01-brace-expansion-audit-remediation/verification.md`
- `memory/CHANGELOG.md`
- `memory/HANDOVER.md`
- `memory/PROJECT_STATE.md`
- `memory/TASKS.json`
- `memory/sessions/2026-07-21-ci-fix-01.md`
- `ruoyi-ui/package-lock.json`
- `tests/frontend-dependency-hardening.test.js`

## Commands

- [local] Baseline/post-fix clean install, audit JSON, dependency tree/explain, source usage, advisory/compatibility inspection, focused dependency test, UI tests/build, R-12A Node regression, Maven unit/integration regression, scans, review/phase/CI-declaration gates, and diff audits passed as detailed in `verification.md`.
- [local] Complete `npm run check` passed every gate and 491/491 root tests; embedded and explicit `npm run close:change` plus `git diff --check` passed.
- [not-run] Push, GitHub Actions, after-push verification, and post-push handover require explicit push authorization.

## Verification

- [local] Post-fix `npm ci` and audit report 0 vulnerabilities; installed `brace-expansion@2.1.2` serves all three logical paths.
- [local] Platform dependency test 5/5, UI 7/7, production build 2602 modules, R-12A Node 39/39, Java 65/65 including masterdata 28/28, and MySQL integration 2/2 pass.
- [local] R-12A review/decision diff=0; forbidden runtime diff=0; phase gates remain blocked.
- [not-run] Remote workflow execution for this fix; R-12A remains open.

## Risks

- The remaining risk is remote-only: until the two local commits are pushed and the distinct GitHub Actions run succeeds in `governance`, `backend-tests`, and `frontend-build`, R-12A cannot be closed.
- The direct recursive-delete command was policy-blocked; clean-install evidence relies on npm's documented `npm ci` removal/rebuild behavior rather than a separately executed `Remove-Item`.

## Next Actions

- Create `fix(ci): remediate frontend dependency audit failure` from this verified local tree.
- Stop before push and wait for explicit authorization.
- After authorization, push both review-only and implementation commits, inspect real CI logs, then make a separate post-push handover update only if all three jobs succeed.
- Do not begin R-12B.

## Published Recovery

- [local] Review commit `6a9bfd57548160d85e28776f415b5883b6d92836` and fix commit `84963a0c04ca5482ff10c23efc4689c60febb060` were published without rewrite as part of the four-commit CI-FIX-01 stack.
- [ci] Recovery workflow `29876893425` for final head `010688b5928d2bc4385bb8037940f5573587c5ae` concluded `success`; all three jobs succeeded and the frontend audit reported 0 vulnerabilities.
- [local] Clean-worktree `npm run check:after-push` passed. Historical failed runs remain preserved; the evidence-only handover commit and its own workflow are tracked separately.
