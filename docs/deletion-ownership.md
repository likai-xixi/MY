# Deletion Ownership

Feature deletion is controlled by ownership, not by guessing filenames.

## Dry-run

```bash
npm run ai:do -- "删除功能预分析：<feature-id>"
```

The dry-run reports:

- feature-owned files and directories
- registry files to update
- generated scans to refresh
- module/API/UI graph entries
- API catalog entries
- task, project state, handover, and changelog updates
- database tables
- permissions
- SQL files
- mapper XML files
- menu SQL files
- shared or local components
- document references
- blockers
- QA commands
- rollback notes

## Apply

```bash
npm run ai:do -- "确认删除：<feature-id>"
```

Apply removes registered feature-owned paths, removes graph/API/UI ownership, updates registries and memory, runs scanner refresh, runs orphan detection, finalizes the change record, and runs `npm run check`.

The low-level entrypoint is held to the same cleanup contract:

```bash
npm run feature:remove -- <feature-id> --apply --confirm <feature-id>
```

After confirmation it must create a deletion bundle, remove feature-owned files, update registry/graph/memory files, refresh generated scans under `ai/generated/`, and resync feature ownership. Deleted backend routes, frontend routes, API clients, database ownership, permission ownership, and component usage must not remain as stale generated output.

Use these checks to verify a completed apply pass:

```bash
npm run scan:all:check
npm run build:graph:check
npm run sync:memory:check
npm run check:orphan -- <feature-id>
npm run check
```

## Production boundary

A deletion can only clean what is owned or discoverable. For RuoYi projects, database tables, `sys_menu` rows, permission codes, SQL migrations, mapper XML files, and generated API files must be listed in the feature registry before deletion can reliably handle them.
