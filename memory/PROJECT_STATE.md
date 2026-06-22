# Project State

## Current Goal

Maintain a chat-driven Codex App development template that lets the user add, update, and remove business features through conversation while repository gates enforce registry, graph, memory, component, and handoff consistency.

## Status

The scaffold is ready as a governance layer for a real backend/frontend project. Business implementation remains intentionally minimal and uses the inventory module as an example feature.

## Active Feature

`features/inventory.md`

## Active Task

`TASK-0001` in `memory/TASKS.json`

## Latest Session

`memory/sessions/2026-06-21-final-template.md`

## Next Actions

- Place this scaffold at the root of the real project that Codex App will edit.
- Tell Codex to read `AGENTS.md` and run `npm run resume` before business work.
- Use chat requests for `新增功能`, `功能迭代`, `删除功能预分析`, and `确认删除`.
- Add runtime-specific backend, frontend, database, and UI tests when the real stack is selected.

## Open Questions

- Which backend framework will the real project use?
- Which frontend framework will the real project use?
- Which database and migration tool will own table changes?
- Which UI component library will become the shared component base?

## Last Verification

Run `npm run check` after any scaffold or business change. Treat it as a governance gate; add runtime-specific verification when real backend or frontend behavior exists.
