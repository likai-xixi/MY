# RuoYi Adapter Guide

The RuoYi adapter changes the scaffold from the generic `backend/modules` and `frontend/src/modules` layout to a RuoYi/RuoYi-Vue ownership layout.

## Setup

```bash
npm run profile:detect
npm run profile:adopt -- ruoyi
npm run profile:lock
```

`profile:adopt -- ruoyi` writes the active adapter to `ai/project-profile.json` and bootstraps the RuoYi shared component catalog and SQL ownership directory when they do not exist.

## Backend ownership

Each feature ID owns these RuoYi backend roots by default:

```text
ruoyi-business/src/main/java/com/ruoyi/business/<feature-id>/
ruoyi-admin/src/main/java/com/ruoyi/web/controller/business/<feature-id>/
```

Use `ruoyi-business` for domain objects, mapper contracts, services, service implementations, and business rules. Use `ruoyi-admin` for HTTP controllers, request/response mapping, permission annotations, and admin-web endpoints.

## Frontend ownership

Each feature ID owns these RuoYi frontend roots by default:

```text
ruoyi-ui/src/views/<feature-id>/
ruoyi-ui/src/api/<feature-id>.contract.md
```

When real frontend API code is created, replace or complement the contract with `ruoyi-ui/src/api/<feature-id>.js` or `.ts`, then register the endpoint in `graph/api-graph.json` and `memory/API_CATALOG.md`.

## SQL, menu, and permission ownership

The adapter creates:

```text
sql/<feature-id>.ownership.md
```

Use this file to list real SQL files, `sys_menu` rows, permission strings, mapper XML files, and database tables. Then mirror the same ownership in `ai/registry/features.json` fields such as `dbTables`, `permissions`, `sqlFiles`, `mapperXmlFiles`, `menuSqlFiles`, and `permissionFiles`.

## Component governance

RuoYi shared components are governed through:

```text
ruoyi-ui/src/components/catalog.json
```

Feature-local components can live under `ruoyi-ui/src/views/<feature-id>/components/` only when they are not reusable controls. Reusable controls must move to the shared component root and be registered in the catalog.

## Verification

After adapter setup or feature work, run:

```bash
npm run scan:all
npm run check
```

The checks validate adapter-aware scans, registry ownership, graph paths, component governance, stale docs, orphan references, and change-record evidence.
