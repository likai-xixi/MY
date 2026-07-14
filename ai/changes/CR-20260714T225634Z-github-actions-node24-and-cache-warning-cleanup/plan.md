# Plan

1. Record the run annotations and resolve official immutable release SHAs for Node 24-compatible actions.
2. Add a focused regression assertion for the repository workflow.
3. Update only the workflow action pins and remove the unused governance Maven cache; keep both JDK 17 setups and the backend Maven cache.
4. Run focused CI-governance tests, the CI coverage declaration, the full governance gate, finalization, closeout, and exact scope checks.
5. Commit and push the follow-up to `master`, then require the new `scaffold-ci` run to complete successfully without the repaired annotations.
