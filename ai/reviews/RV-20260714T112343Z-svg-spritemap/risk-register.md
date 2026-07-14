# Risk Register

| Risk | Impact | Mitigation | Owner |
| --- | --- | --- | --- |
| Plugin migration changes symbol ids or delivery URL | Shared icons disappear | Preserve `icon-` ids and verify the real plugin output plus browser consumers | Frontend |
| SVGO changes icon geometry or strips needed styles | Visual regression | Use narrow plugins, require source style preconditions, inspect 90 built symbols and key icons | Frontend/QA |
| ECharts major upgrade changes theme or instance behavior | Cache charts render incorrectly | Register macarons explicitly, reuse instances, run real browser and lifecycle tests | Frontend/QA |
| Async cache responses arrive out of order or after unmount | Stale data or UI errors | Version every load, invalidate on dispose, and test deferred response ordering | Frontend |
| Resize handlers or observers accumulate | Memory leak and repeated work | Stable callback plus idempotent teardown and ten-cycle executable regression | Frontend |
| Feature-local helpers are scanned as pages | Fake route/graph ownership | Use `.mjs` helpers and require scanner output to remain unchanged | Architecture |
| Root CI executes UI tests before UI dependencies exist | Clean CI failure | Root runs dependency-free controller tests; frontend production build runs the complete suite after `npm ci` | QA |
| Scope expands into governance or backend | Mixed change and unverifiable contracts | Stop and open a separate change; keep exact allowed/forbidden paths | Main agent |
