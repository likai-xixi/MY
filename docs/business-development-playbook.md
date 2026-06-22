# Business Development Playbook

Use this playbook when a real business request arrives.

## 1. Create The Feature Brief

```bash
npm run new:feature -- "Customer Portal"
```

Then fill in the generated file under `features/`.

## 2. Ask Codex App To Route The Work

Use `prompts/start-business-feature.md`.

Codex should read:

- `AGENTS.md`
- `agents/workflow.md`
- the feature brief
- `memory/PROJECT_STATE.md`
- `memory/TASKS.json`
- the latest note under `memory/sessions/`
- `memory/MODULE_MAP.md`
- `memory/API_CATALOG.md`
- `graph/module-graph.json`
- `graph/api-graph.json`
- `graph/ui-graph.json`
- existing backend/frontend module files

## 3. Implement The Smallest Verified Slice

For backend behavior, update:

- `backend/modules/<slug>/api/`
- `backend/modules/<slug>/service/`
- `backend/modules/<slug>/domain/`
- `backend/modules/<slug>/repository/`
- `memory/API_CATALOG.md`
- `graph/api-graph.json`

For frontend behavior, update:

- `frontend/src/modules/`
- `frontend/src/components/`
- `frontend/src/router/`
- `frontend/src/store/`
- `graph/ui-graph.json`

For shared frontend components, update:

- `frontend/src/components/`
- `frontend/src/components/catalog.json`
- `frontend/src/components/index.ts`

## 4. Update Memory

Update:

- `memory/PROJECT_STATE.md`
- `memory/TASKS.json`
- `memory/sessions/<date>-<task>.md`
- `memory/HANDOVER.md`
- `memory/CHANGELOG.md` when behavior changes
- `memory/MODULE_MAP.md` when module boundaries change

## 5. Remove A Feature

Before removing a feature, run:

```bash
npm run remove:feature -- customer --dry-run
```

Record the impact list, blockers, API endpoints, UI screens, document references, QA commands, and rollback notes in `memory/HANDOVER.md`.

Only apply removal after the dry-run has no blockers and the rollback path is clear.

## 6. Verify

```bash
npm run check
```

This is the governance gate. If a runtime stack has been added, also run its backend and frontend tests, builds, API/UI smoke checks, deployment checks, and rollback checks.

## 7. Handoff

Use `prompts/finish-business-feature.md` to ask Codex for the final audit.

## Chat Command Entry

Use `npm run ai:do -- "新增功能：客户管理"`, `npm run ai:do -- "功能迭代：客户管理"`, `npm run ai:do -- "删除功能预分析：客户管理"`, or `npm run ai:do -- "确认删除：客户管理"` as the single Codex App chat-driven entry. Runtime implementation must stay inside `impact.allowedEditRoots` and finish with `npm run check`.
