# Plan

1. Preserve the two existing CI-FIX commits, revalidate the new immutable findings, and create an independent immutable dependency-security review because the earlier review authorizes only brace-expansion.
2. Commit the approved immutable review as an immutable review-only implementation base before changing the lockfile or regression test.
3. Record the exact advisory, dependency tree, semver compatibility, and current audit failure.
4. Use normal npm resolution to update only the transitive immutable node to the smallest compatible safe version; do not change package.json, parent versions, overrides, workflow, or unrelated dependencies.
5. Add focused advisory-range regression coverage and run clean install, tree/explain, audit, frontend tests/build, R-12A Node/Java/MySQL regressions, and complete governance gates.
6. Prove review immutability, zero business/runtime/R-12B changes, blocked phase gates, exact changed-file scope, and create one local implementation commit.
7. Stop before push and post-push handover.
