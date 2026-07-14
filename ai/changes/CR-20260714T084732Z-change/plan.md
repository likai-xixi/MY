# Plan

Mode: `update`
Feature: `platform`
Review: `RV-20260714T012241Z-review` (`Allow Implementation`)

1. Reproduce the packaged `prod` startup failure caused by the 13 unresolved Druid property placeholders.
2. Add the exact required Druid pool keys to `application-prod.yml`, preserving environment-only secrets and disabled production consoles.
3. Re-run the same property-completeness probe and package the backend.
4. Start the packaged jar with the `prod` profile, safe test secrets, and an intentionally unreachable database; prove execution reaches the database connection boundary without an unresolved-placeholder failure.
5. Update only the platform feature brief and required change/context/memory evidence; record that API, UI, DB, permission, component, and dependency contracts are unchanged.
6. Run `npm run scan:all`, `npm run finalize:change`, and `npm run check`; obtain independent staged review before commit. Do not release or deploy.

## Allowed Edit Roots

- `features/platform.md`
- `ruoyi-admin/src/main/resources/application-prod.yml`
- `ai/changes`
- `ai/context`
- `ai/generated`
- `graph`
- `memory`
