# Post-fix audit summary

- [local] Command: `npm --prefix ruoyi-ui audit --audit-level=moderate --include=dev`
- [local] Exit code: `0`
- [local] Result: `found 0 vulnerabilities`
- [local] Command: `npm --prefix ruoyi-ui audit --json`
- [local] Exit code: `0`
- [local] Audit totals: info `0`, low `0`, moderate `0`, high `0`, critical `0`, total `0`.
- [local] Dependency totals reported by npm: prod `175`, dev `185`, optional `90`, peer `0`, peerOptional `0`, total `360`.

The raw zero-vulnerability audit JSON is byte-identical to the already persisted CI-FIX-01 brace-expansion post-fix audit, so this change records the actual command, exit code, and totals without introducing a repository-wide duplicate-content violation.
