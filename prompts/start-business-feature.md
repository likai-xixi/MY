# Start Business Feature Prompt

Read `AGENTS.md`, `agents/workflow.md`, `memory/PROJECT_STATE.md`, `memory/TASKS.json`, the latest note under `memory/sessions/`, `memory/MODULE_MAP.md`, `memory/API_CATALOG.md`, `graph/module-graph.json`, `graph/api-graph.json`, `graph/ui-graph.json`, and the selected feature brief.

Then:

1. Identify the primary role contract in `agents/`.
2. State the smallest useful implementation slice.
3. List files that must change.
4. Implement the slice.
5. Update memory and graph files.
6. Run `npm run check`.
7. Run runtime-specific tests or smoke checks when backend/frontend behavior exists.
8. Update `memory/TASKS.json`, a session note, and `memory/HANDOVER.md`.

Do not mark the task complete unless the verification evidence matches the changed surface.
