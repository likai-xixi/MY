# QA Review

## Blocking Verification

- `npm --prefix ruoyi-ui ci` from the lockfile.
- `npm --prefix ruoyi-ui test` with the real Vite spritemap build and controller behavior tests.
- `npm --prefix ruoyi-ui audit --audit-level=moderate` with zero findings.
- Dependency-tree proof that ECharts/SVGO/PostCSS are patched and the old plugin chain is absent.
- `npm --prefix ruoyi-ui run build:prod`, proving its prebuild test lifecycle and hashed spritemap asset.
- Generated spritemap proof: source/symbol/unique counts 90/90/90, no missing or duplicate ids/viewBoxes, scripts, event handlers, external origins, style/use/view remnants, legacy virtual module, or development route in the bundle.
- Browser acceptance for login icons, application shell, menu icon picker, cache data, two nonzero charts, sidebar resize, and an empty warning/error console.
- `npm run scan:all`, feature-test ownership, full root tests, `npm run finalize:change`, `npm run check`, and `npm run close:change`.
- Independent staged-scope review with no P0-P3 finding.

## Release Boundary

This review authorizes implementation and verification only. It does not authorize release or deployment. The existing CI audit threshold may be tightened only in a later isolated governance/rule-change.
