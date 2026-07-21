# Verification

Status: verified [local]

## Commands

- [local] `git push origin master` published review-only commit `f28e3d12358bdc35ac1782fd50be7850f937bc1b` and implementation commit `9cb1f59d89949330cfe796ae2db25728d356038c` without history rewrite.
- [local] Immediate local, tracking-ref, and remote-ref checks aligned `HEAD`, `origin/master`, and `refs/heads/master` at `9cb1f59d89949330cfe796ae2db25728d356038c` with ahead/behind `0/0`.
- [ci] `gh run view 29792754518` returned completed `failure` for workflow `scaffold-ci`, branch `master`, head SHA `9cb1f59d89949330cfe796ae2db25728d356038c`, started `2026-07-21T01:18:09Z`.
- [ci] `governance` job `88517815533` concluded `success`; repository backend Maven job `backend-tests` `88517815541` concluded `success`; `frontend-build` `88517815557` concluded `failure`.
- [ci] Failed-job log shows `npm --prefix ruoyi-ui audit --audit-level=moderate --include=dev` rejected transitive `brace-expansion@2.1.1` for high-severity `GHSA-3jxr-9vmj-r5cp`; the production frontend build step was skipped.
- [local] The same audit command reproduced the one-high-severity failure. `npm --prefix ruoyi-ui ls brace-expansion --all` resolved `unplugin-auto-import@0.18.6 -> minimatch@9.0.9 -> brace-expansion@2.1.1`.
- [local] `npm run check:after-push` returned `check:after-push: pass` on the clean, aligned implementation worktree.
- [local] Post-sync `npm run context:build -- platform`, `npm run scan:all`, `npm run finalize:change`, handover/current-doc/memory/provenance checks, and `git diff --check` passed.
- [local] Post-sync full `npm run check` passed with 491/491 Node tests and `close:change` passed.
- [not-run] Evidence-only handover commit, second push, and that commit's distinct CI run are pending.

## Evidence

- [local] R-12A review-only commit: `f28e3d12358bdc35ac1782fd50be7850f937bc1b`.
- [local] R-12A implementation commit: `9cb1f59d89949330cfe796ae2db25728d356038c`.
- [ci] Implementation workflow run: `29792754518`, `scaffold-ci`, overall `failure`.
- [ci] The failure is a dependency-security gate, not a Java test, Vue test, or backend integration failure. R-12A did not change package or lock files.
- [local] Advisory `GHSA-3jxr-9vmj-r5cp` was published `2026-07-20T20:51:09Z`; affected 2.x versions are `>=2.0.0 <2.1.2`, so the independent repair target is `brace-expansion@2.1.2` or later within a dedicated dependency batch.
- [local] `engineeringCoreReady=blocked` and `beforeSalesOrder=blocked`.

## Runtime Boundary

- [not-run] No dependency repair, review change, R-12B, field-definition, process-scheme, sales-order, formula, BOM, production, DXF, Java, Vue, API, SQL, route, permission, database, or other runtime work is part of this sync.

## Later Recovery Verification

- [ci] The original run `29792754518` and this handover's run `29794081328` remain recorded as `failure`.
- [ci] Independent recovery run `29876893425` for `010688b5928d2bc4385bb8037940f5573587c5ae` concluded `success`: governance `88789283965`, backend `88789283926`, frontend `88789283934` all succeeded.
- [ci] Frontend logs show clean install 0 vulnerabilities, UI 7/7, exact include-dev audit 0 vulnerabilities, and production build 2602 modules / 18.93 seconds.
- [local] After the green run, clean-worktree `npm run check:after-push` passed; review decisions and both blocked phase gates are unchanged, and no R-12B work exists.
