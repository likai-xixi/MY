# Platform Base

RuoYi + Vue3 platform shell ownership baseline.

## Scope

- Login, register, redirect, lock, and error pages.
- Frontend router shell and base UI entry points.
- Shared SVG spritemap delivery and frontend dependency safety for the platform shell.
- Redis cache monitoring chart lifecycle; monitor data/API ownership remains unchanged.
- No custom business behavior is introduced by this baseline record.

## Acceptance Criteria

- Platform shell files are registered under `platform`.
- System, monitor, and tool pages remain owned by their own feature records.
- Source merge does not overwrite governance roots.
- The production profile defines every Druid pool property required by `DruidProperties`; database, Redis, token, and Druid console secrets remain environment-only.
- A packaged `prod` startup with safe probe secrets and an intentionally unreachable database must reach the database connection boundary without any unresolved Spring placeholder.
- Frontend dependencies have zero moderate-or-higher audit findings, the production spritemap contains every repository icon with a valid `viewBox`, and no generated icon references an external origin.
- The UI test suite runs the real spritemap plugin through an in-memory Vite build and rejects missing, duplicate, unsafe, or unresolved production symbols.
- Cache charts use one registered theme, update existing instances, resize with both viewport and container changes, ignore stale async responses, and release observers/listeners/instances on unmount; executable controller tests verify ten mount/dispose cycles, stale-response ordering, unmount invalidation, and separate transport/render error handling.

## Verification

- Run `npm run scan:all`.
- Dynamically extract Druid `@Value` keys and verify the production YAML supplies all of them.
- Package `ruoyi-admin` and run the packaged `prod` startup probe.
- Run `npm run check:prod-safety`.
- Run `node --test tests/frontend-dependency-hardening.test.js`.
- Run `npm --prefix ruoyi-ui test`.
- Run `npm --prefix ruoyi-ui audit --audit-level=moderate` and `npm --prefix ruoyi-ui run build:prod`.
- Inspect the generated spritemap and exercise shared icons plus cache charts in a real browser.
- Run `npm run finalize:change`.
- Run `npm run check`.
