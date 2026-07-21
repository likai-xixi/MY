# Plan

1. Confirm the clean `58478e509...` base, create this independent rule-change record, run platform impact analysis, snapshot the blocked phase-gate rule object, and complete the independent pre-review required for a `ruoyi-ui` lockfile change.
2. Run the exact clean install, audit JSON, dependency-tree, explain, and source-usage commands before changing any dependency version; persist raw evidence in this change record.
3. Determine whether `js-beautify` is used in the production bundle or generator flow and whether it accepts untrusted input; test upstream-compatible upgrade/removal options in priority order.
4. Apply the smallest defensible manifest/lockfile repair using normal npm resolution and add a focused regression assertion that rejects the vulnerable dependency state.
5. Reinstall from a safely removed `ruoyi-ui/node_modules`, then run dependency-tree, audit, UI tests, production build, backend integration verification, focused R-12A tests, scans, and the complete governance gates.
6. Prove the R-12A review package and decision are unchanged, both phase gates remain blocked, no forbidden runtime path changed, and R-12B was not started.
7. Finalize context/memory/handover evidence, review the exact diff and lockfile delta, stage intentionally, rerun staged checks, and create one local commit.
8. Stop before push. Remote CI and post-push handover remain `[not-run]` pending explicit push authorization.
