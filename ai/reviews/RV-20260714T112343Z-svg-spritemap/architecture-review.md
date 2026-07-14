# Architecture Review

## Boundary

The change belongs to the `platform` frontend/build slice. Backend, API, route, permission, database, customer, masterdata, system, tool, and sales-order contracts remain unchanged.

## Approved Design

- Use exact dependency versions for ECharts, the maintained Vite spritemap plugin, and SVGO; remove the legacy plugin and transitive `svg-baker`/PostCSS 5 chain.
- Keep the runtime symbol contract at `/__spritemap#icon-<basename>` and keep development/production delivery owned by the Vite plugin.
- Limit SVG normalization to dimensions and dead style removal; do not apply broad preset transforms that could alter icon geometry.
- Isolate chart ownership in one lifecycle controller with stable resize callbacks, `ResizeObserver`, instance reuse, and idempotent disposal.
- Isolate request sequencing in one controller with monotonic versions, unmount invalidation, single loading ownership, shared-interceptor transport errors, and local render-error reporting.
- Keep helper modules as `.mjs` under the feature view directory so they remain feature-local modules without being misclassified as route files by the current scanner.
- Bind the complete UI suite to `prebuild:prod`, after the existing frontend CI job installs UI dependencies; keep dependency-free controller regressions reachable from the clean root gate.

## Constraints

- No compatibility shim or duplicate sprite delivery path.
- No scanner/rule/workflow edit inside the business change.
- No fake generated routes for helper modules.
- No broad shared utility extraction for monitor-owned behavior.
