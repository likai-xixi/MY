# Monitor Management

RuoYi built-in monitoring and scheduler ownership baseline.

## Scope

- Cache, server, online user, login log, operation log, job, and job log modules.
- RuoYi monitor APIs, frontend pages, Quartz controllers, services, mappers, and permissions.
- No custom business behavior is introduced by this baseline record.

## Acceptance Criteria

- Monitor and Quartz ownership are registered under `monitor`.
- Scheduler files from `ruoyi-quartz` are included in scans and graphs.
- Generated scans and graphs include monitor routes, APIs, permissions, and components.

## Verification

- Run `npm run scan:all`.
- Run `npm run finalize:change`.
- Run `npm run check`.
