# Product Review

## Decision

Approve the smallest local dependency-security repair needed to restore the fail-closed frontend audit after two immutable High advisories were published after the brace-expansion fix was committed.

## User And Operator Value

- Keeps the required audit meaningful instead of shipping a predictably red CI commit.
- Preserves the already reviewed brace-expansion repair and all R-12A behavior.
- Produces a separately auditable commit that can be authorized for push later.

## MVP Scope

- Resolve the one transitive immutable node from 5.1.6 to the smallest compatible safe 5.x release through existing semver ranges.
- Add or extend the platform dependency regression so the affected immutable ranges cannot return.
- Record exact advisory, tree, audit, build, backend regression, governance, and scope evidence.

## Non-Goals

- No package.json, Sass/Vite/Vue stack, workflow, audit threshold, override, or package-manager change.
- No business runtime, R-12A review/behavior, phase-gate, R-12B, or post-push handover work.
- No rewrite of the two existing CI-FIX commits.

## Success Criteria

- Clean install resolves immutable to at least 5.1.8 with no vulnerable copy.
- Exact include-dev audit exits 0 with zero vulnerabilities.
- Frontend tests/build, R-12A Node/Java/MySQL regressions, full governance check, and exact scope audit pass.
- Work stops at a local implementation commit.
