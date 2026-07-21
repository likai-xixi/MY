# Architecture Review

## Boundary

The vulnerable node is a frontend build dependency reached through `sass-embedded@1.97.2 -> immutable@5.1.6`. `sass-embedded` declares `immutable:^5.0.2`, so the first patched 5.x release 5.1.8 is compatible without a parent or manifest change.

## Approved Strategy

- Use npm's normal lockfile resolver; accept the smallest stable compatible safe result it deterministically selects.
- Keep `sass-embedded@1.97.2`, package.json, workflow, graph, API, UI, SQL, Java, and Vue business source unchanged.
- Reject broad lockfile drift, parent upgrades, overrides, force fixes, or hand-authored integrity metadata.

## Contract And Rollback

- No product/API/data contract changes exist.
- Rollback is the immutable fix commit only, but doing so reopens both High advisories and the blocking audit.
- Review base is `84963a0c04ca5482ff10c23efc4689c60febb060`; earlier commits must not be rewritten.

## Required Proof

Exact pre/post dependency tree, advisory JSON, package-lock delta, clean install, audit, frontend test/build, focused R-12A regressions, full governance checks, and zero forbidden-path changes.
