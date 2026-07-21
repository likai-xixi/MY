# Architecture Review

The advisory is in one deduplicated `brace-expansion@2.1.1` node reached through three logical paths: two production-root paths under `js-beautify` (`editorconfig` and `glob`) and one development-root path under `unplugin-auto-import`.

## Decision

- Keep `js-beautify@1.15.4`, `glob@10.5.0`, `minimatch@9.0.9`, and `unplugin-auto-import@0.18.6` unchanged.
- Resolve `brace-expansion@2.1.2` through the existing `minimatch:^2.0.2` transitive range using normal npm resolution.
- Do not add an override: every parent already accepts the patched version.
- Do not change `.github/workflows/ci.yml`: the workflow is already correctly fail-closed and the root cause is the lockfile.

Both 2.1.1 and 2.1.2 retain `main:index.js` and `balanced-match:^1.0.0`; parent engines remain compatible with CI Node 20. No API, database, route, permission, graph, registry, or business contract changes are required.
