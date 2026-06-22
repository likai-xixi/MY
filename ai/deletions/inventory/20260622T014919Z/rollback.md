# Feature Deletion Rollback

Feature: `inventory` (Inventory)
Bundle: `ai/deletions/inventory/20260622T014919Z`

## Restore Steps

1. Restore copied files from `files/` to the same relative paths in the project root.
2. Restore registry snapshots from `registry-before.json` if registry entries were removed incorrectly.
3. Restore graph/API/UI/catalog entries from version control or from the change record impact file.
4. Run `npm run build:graph`, `npm run sync:memory`, `npm run scan:all`, and `npm run check`.

## Removed Files Snapshot

- `features/inventory.md`
- `backend/modules/inventory`
- `frontend/src/modules/inventory`
- `frontend/src/modules/inventory/module.ts`
- `ai/contracts/inventory.api.md`
- `ai/contracts/inventory.ui.md`
- `ai/contracts/inventory.db.md`
- `ai/contracts/inventory.permission.md`
- `ai/contracts/inventory.delete-ownership.md`
