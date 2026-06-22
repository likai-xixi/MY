# Tool Management

RuoYi built-in tool and code generator ownership baseline.

## Scope

- Code generator, form builder, Swagger entry, and generator backend module.
- RuoYi tool APIs, frontend pages, generator controllers, services, mappers, mapper XML, and permissions.
- No custom business behavior is introduced by this baseline record.

## Acceptance Criteria

- Tool and generator ownership are registered under `tool`.
- Generator files from `ruoyi-generator` are included in scans and graphs.
- Page-local generator components are documented as baseline exceptions when required by governance checks.

## Verification

- Run `npm run scan:all`.
- Run `npm run finalize:change`.
- Run `npm run check`.
