# System Management

RuoYi built-in system management ownership baseline.

## Scope

- User, role, menu, department, post, config, dictionary, notice, profile, and common auth/system controllers.
- RuoYi system APIs, frontend pages, mapper XML, and SQL ownership references.
- No custom business behavior is introduced by this baseline record.

## Acceptance Criteria

- System backend, frontend, API, permission, mapper, SQL, and component ownership are registered under `system`.
- Cross-feature imports are limited to RuoYi shared infrastructure or explicit baseline exceptions.
- Generated scans and graphs include the system module without stale platform ownership.

## Verification

- Run `npm run scan:all`.
- Run `npm run finalize:change`.
- Run `npm run check`.
