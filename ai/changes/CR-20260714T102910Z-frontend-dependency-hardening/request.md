# Request

The unreleased project still has four moderate frontend dependency findings: ECharts below 6.1.0 and the abandoned `vite-plugin-svg-icons -> svg-baker -> postcss@5` chain. Repair the entire UI dependency slice, preserve all 90 repository SVG icons, harden chart teardown/stale-response behavior, add executable spritemap, chart-lifecycle, and request-order regressions instead of relying on source-string checks, verify real build and browser behavior, and keep release/deployment out of scope.
