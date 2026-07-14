# Product Review

## User Value

The platform shell must render its shared icons and cache-monitor charts reliably while removing known dependency findings. Operators should see the same 90-icon vocabulary and the same Redis information without duplicate errors, stale updates, or accumulating chart listeners.

## Approved Slice

- Upgrade ECharts to the patched line.
- Replace the abandoned SVG plugin chain with one maintained spritemap pipeline.
- Preserve the current `icon-*` identity contract for all 90 source icons.
- Make cache request ordering, loading closure, chart reuse, resize, and teardown deterministic and executable-testable.
- Prove the real production build and browser-visible behavior.

## Non-Goals

- No new product feature, screen, route, permission, backend endpoint, SQL, or data migration.
- No compatibility bridge for the removed virtual SVG module.
- No governance-rule, CI-policy, release, or deployment change in this implementation record.

## Success Criteria

- Zero moderate-or-higher UI audit findings.
- Production build emits exactly 90 safe, uniquely named symbols with valid viewBoxes.
- Existing login, shell, icon picker, and cache-monitor experiences remain usable.
- Stale or unmounted requests cannot update state; transport and render failures are not double-reported.
- Repeated chart mount/dispose cycles leave no listener, observer, or ECharts instance behind.
