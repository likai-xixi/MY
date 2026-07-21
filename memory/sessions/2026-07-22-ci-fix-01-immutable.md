# Session: CI-FIX-01 Immutable Dependency Security Extension

## Task

`TASK-0002` - repair the newly published Immutable frontend dependency audit findings independently from R-12A business implementation.

## Goal

Resolve the two exact Immutable advisories through the smallest compatible lockfile change, prove local regression safety, create an independently reviewed local implementation commit, and stop before push.

## Status

`in_progress`

## Changed Files

- Exact list: `ai/changes/CR-20260721T221950Z-ci-fix-01-immutable-dependency-advisories-remedi/changed-files.json` after finalization.
- Implementation surface: `ruoyi-ui/package-lock.json` and `tests/frontend-dependency-hardening.test.js` only.
- Independent review/change, dependency evidence, platform context, and resumable memory accompany the implementation.

## Verification

- [local] npm `1124007` / `CVE-2026-59879` / `GHSA-v56q-mh7h-f735` and npm `1124017` / `CVE-2026-59880` / `GHSA-xvcm-6775-5m9r` affect `immutable@5.1.6`; first safe 5.x is `5.1.8`.
- [local] Original path is `sass-embedded@1.97.2 -> immutable@5.1.6`; the parent range `^5.0.2` accepts the patch without parent upgrade or override.
- [local] Independent review-only commit `4ac76926239e3300196c6a548024686ee8440e3d` precedes implementation.
- [local] Focused regression failed 4/5 before the lock fix and passed 5/5 after normal npm resolution reached `immutable@5.1.8`.
- [local] Post-fix clean install/audit reports zero vulnerabilities; UI 7/7, production build, R-12A Node 39/39, Java 65/65, and MySQL integration 2/2 pass.
- [local] Both phase gates remain blocked; R-12B has not started.
- [local] Complete `npm run check` passed every gate with 491/491 root Node tests; exact finalization/scope/staging/close checks bind the enclosing local implementation commit.
- [not-run] Push, GitHub Actions, after-push checks, and post-push handover.

## Commands

- [local] `npm --prefix ruoyi-ui ci`
- [local] `npm --prefix ruoyi-ui audit --audit-level=moderate --include=dev`
- [local] `npm --prefix ruoyi-ui audit --json`
- [local] `npm --prefix ruoyi-ui ls immutable --all`
- [local] `npm --prefix ruoyi-ui explain immutable`
- [local] `node --test tests/frontend-dependency-hardening.test.js`
- [local] `npm --prefix ruoyi-ui test`
- [local] `npm --prefix ruoyi-ui run build:prod`
- [local] `node --test tests/masterdata-runtime.test.js`
- [local] configured Maven `-pl ruoyi-business -am verify`
- [local] configured Maven `-pl ruoyi-business -am -Pintegration-test verify`
- [local] `npm run scan:all`
- [local] `npm run check`, `npm run close:change`, and exact staged audit

## Risks

- Remote CI remains unverified until a later explicit push authorization and distinct successful workflow.

## Next Entry Point

Wait for explicit push authorization. Do not push, perform post-push handover, or begin R-12B in this batch.
