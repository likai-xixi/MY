# Finish Business Feature Prompt

Audit the current work against the feature brief and `AGENTS.md`.

Mode:

- Review-only: report gaps without editing.
- Fix-approved: fix missing evidence or contract drift, then rerun checks.
- Release-gate: do not ship unless governance and runtime evidence both match the changed surface.

Report:

- Changed files
- Product outcome
- Backend impact
- Frontend impact
- Memory and graph updates
- Active task and latest session note
- Commands run
- Passing and failing verification
- Traceability matrix: feature -> backend module -> API catalog/API graph -> frontend module/UI graph
- Feature removal impact, blockers, QA commands, and rollback notes when behavior was removed
- Release risk
- Next actions

If anything is missing, fix it or clearly mark it as not verified.
