# Platform Base

RuoYi + Vue3 platform shell ownership baseline.

## Scope

- Login, register, redirect, lock, and error pages.
- Frontend router shell and base UI entry points.
- No custom business behavior is introduced by this baseline record.

## Acceptance Criteria

- Platform shell files are registered under `platform`.
- System, monitor, and tool pages remain owned by their own feature records.
- Source merge does not overwrite governance roots.
- The production profile defines every Druid pool property required by `DruidProperties`; database, Redis, token, and Druid console secrets remain environment-only.
- A packaged `prod` startup with safe probe secrets and an intentionally unreachable database must reach the database connection boundary without any unresolved Spring placeholder.

## Verification

- Run `npm run scan:all`.
- Dynamically extract Druid `@Value` keys and verify the production YAML supplies all of them.
- Package `ruoyi-admin` and run the packaged `prod` startup probe.
- Run `npm run check:prod-safety`.
- Run `npm run finalize:change`.
- Run `npm run check`.
