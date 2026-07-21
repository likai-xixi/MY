# Risk Register

| Risk | Impact | Mitigation | Owner |
| --- | --- | --- | --- |
| Broad parent/framework upgrade | Unrelated frontend regressions | Keep all parents fixed; change only the accepted transitive 2.x patch | Codex |
| Vulnerable range returns in a later lock refresh | CI/release failure and DoS exposure | Add an executable lockfile regression for all GHSA affected lines | Codex |
| Audit is softened instead of repaired | False-green CI | Do not change workflow, threshold, include-dev, or failure behavior | Codex |
| R-12A review/business evidence is altered | Invalid self-authorization or scope mixing | Diff-audit the review package and all forbidden runtime roots against base | Codex |
| Local green is overstated as remote green | Incorrect release claim | Keep push/CI/post-push evidence `[not-run]` until explicitly authorized | Codex |
