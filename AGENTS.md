# Codex Multi-Agent System

This file is the top-level instruction contract for Codex App.
Use it before editing business code.

## Mission

Help the user develop business software through chat while the repository enforces persistent project memory, feature registries, module boundaries, API/UI graphs, component reuse, change records, impact analysis, validation tools, and release evidence.

The user should describe the business intent. Codex must operate the workflow.

## Chat-Driven Operating Contract

The user is not expected to manually run long command sequences. Codex must classify each business request into one of these modes:

| User intent | Codex mode | First action |
| --- | --- | --- |
| `新增功能：...` | add-feature | run `npm run resume`, then create a change record |
| `功能迭代：...` | update-feature | run `npm run resume`, then run impact analysis |
| `删除功能预分析：...` | remove-feature-dry-run | run dry-run only; do not delete files |
| `确认删除：...` | remove-feature-apply | apply only after the feature name is explicit |

Codex must run the internal workflow. The user should only review the final result and approve destructive deletion.

## Work Loop

1. Run `npm run resume` before editing business code.
2. Read the required context set:
   - `docs/chat-driven-codex-workflow.md`
   - `ai/registry/features.json`
   - `ai/registry/components.json`
   - `memory/PROJECT_STATE.md`
   - `memory/TASKS.json`
   - the latest note under `memory/sessions/`
   - `memory/MODULE_MAP.md`
   - `memory/API_CATALOG.md`
   - `graph/module-graph.json`
   - `graph/api-graph.json`
   - `graph/ui-graph.json`
   - the selected feature brief
   - relevant backend/frontend files
3. Create or update a change record under `ai/changes/` before implementation.
4. Run impact analysis with `npm run impact -- <feature-id>` for update work.
5. Plan the smallest safe slice and restrict edits to `impact.allowedEditRoots` unless the change record is expanded.
6. Implement code, docs, tests, registry updates, graph updates, task updates, session notes, and memory updates together.
7. Run `npm run scan:all` after code changes that affect routes, API clients, permissions, database objects, or components.
8. Run `npm run scan:all` when code, route, API, SQL, permission, or component ownership changes.
9. Run `npm run finalize:change` so `changed-files.json`, `verification.md`, `handover.md`, `memory/HANDOVER.md`, `memory/CHANGELOG.md`, and `memory/TASKS.json` are complete.
10. Run `npm run check` as the scaffold governance gate.

## Chat Workflows

### Add feature

When the user says `新增功能：<name>`, Codex must:

1. Run `npm run resume`.
2. Run `npm run ai:do -- "新增功能：<name>"` when scaffolding only is enough.
3. Create or update the feature entry in `ai/registry/features.json`.
4. Add files under the active adapter paths. Generic uses `backend/modules/<feature>/` and `frontend/src/modules/<feature>/`; RuoYi uses `ruoyi-business`, `ruoyi-admin`, `ruoyi-ui`, and `sql/<feature>.ownership.md`.
5. Update API graph, UI graph, module graph, memory files, feature brief, tests, and docs as needed.
6. Run `npm run scan:all`, `npm run finalize:change`, and `npm run check`.
7. Report changed files, checks, residual risk, and next action.

### Update feature

When the user says `功能迭代：<中文功能名或feature-id>`, Codex must:

1. Run `npm run resume`.
2. Find the feature in `ai/registry/features.json`.
3. Run `npm run impact -- <中文功能名或feature-id>`.
4. Edit only affected files unless the change record is expanded.
5. Check `ai/registry/components.json` and `frontend/src/components/catalog.json` before creating components.
6. Update registry, graph, generated scan files, memory, docs, tests, and handover.
7. Run `npm run finalize:change` and `npm run check`.
8. Report exact evidence.

### Remove feature

When the user says `删除功能预分析：<中文功能名或feature-id>`, Codex must only run dry-run analysis:

```bash
npm run ai:do -- "删除功能预分析：<中文功能名或feature-id>"
```

Codex must not delete files during pre-analysis.

When the user says `确认删除：<中文功能名或feature-id>`, Codex may apply deletion only when the feature name matches the dry-run target:

```bash
npm run ai:do -- "确认删除：<中文功能名或feature-id>"
```

## Execution Modes

Default mode is single-agent orchestration: one Codex session reads `agents/workflow.md`, then moves through the needed roles in order. Use this order unless the user asks for a different split:

1. Product scope: `agents/product-founder.md`
2. Architecture and contracts: `agents/architect.md`
3. Backend and/or frontend implementation: `agents/backend-agent.md`, `agents/frontend-agent.md`
4. Memory updates: `agents/memory-agent.md`
5. QA/release review: `agents/qa-release.md`

Multi-agent mode is explicit: only create parallel agents or threads when the user asks for multi-agent work or when the current Codex environment provides subagents and the task benefits from independent review. The main agent remains responsible for merging findings, running verification, and updating `memory/HANDOVER.md`.

## Role Routing

| Situation | Primary role |
| --- | --- |
| New product idea or unclear MVP | `agents/product-founder.md` |
| Default workflow or unclear routing | `agents/workflow.md` |
| Architecture, module boundaries, data contracts | `agents/architect.md` |
| Backend API, service, domain, repository | `agents/backend-agent.md` |
| Frontend screens, routing, state, components | `agents/frontend-agent.md` |
| Cross-cutting cleanup or structure changes | `agents/refactor-agent.md` |
| Memory, changelog, handoff, module map | `agents/memory-agent.md` |
| Release gate, QA plan, regression risk | `agents/qa-release.md` |


## Feature Identity Contract

- `id` is the machine key and must use lowercase ASCII kebab-case, such as `demo-feature` or `sales-order`.
- `name` is the display name and may use Chinese, such as `客户管理`.
- The active adapter decides physical code roots. Generic paths are `backend/modules/<id>/` and `frontend/src/modules/<id>/`; RuoYi paths are `ruoyi-business/src/main/java/com/ruoyi/business/<id>/`, `ruoyi-admin/src/main/java/com/ruoyi/web/controller/business/<id>/`, `ruoyi-ui/src/views/<id>/`, `ruoyi-ui/src/api/<id>.contract.md`, and `sql/<id>.ownership.md`.
- File paths, module paths, routes owned by the scaffold, and registry ownership must use `id`, never the Chinese display name.
- Preferred chat form may be Chinese-only when the name exists in `ai/registry/feature-id-dictionary.json`: `新增功能：客户管理`.
- Explicit command form remains available for names outside the dictionary: `npm run new:feature -- --id demo-feature --name 显示名称`.

## Project Profile And Rule Lock

- Scanner and module conventions may be generated during project profile setup with `npm run profile:setup`, or manually with `npm run profile:detect`, `npm run profile:adopt -- <adapter>`, and `npm run profile:lock`.
- Use `docs/ruoyi-adapter-guide.md` before attaching original RuoYi/RuoYi-Vue projects.
- Business work must not edit scanner, rule, script, workflow, package, skill, or project profile files.
- If the real project base needs a new scanner rule, create a rule proposal with `npm run rule:propose -- <title>` and use a change record whose impact mode is `rule-change`.
- Do not loosen a gate only to make the current task pass. Move code into the expected boundary or expand the change record with evidence.

## Hard Rules

- Do not edit business code before running `npm run resume`.
- Do not create, update, or delete a feature without a change record under `ai/changes/`.
- Do not leave a change record without running `npm run finalize:change` or a chat workflow that calls it.
- Do not close a task unless `npm run close:change` passes.
- Do not edit files outside `impact.allowedEditRoots` for the active change.
- Do not claim a check exists unless a command verifies it.
- Do not leave business changes without an updated handoff.
- Do not add new feature/backend/frontend modules without updating `ai/registry/features.json`, `ai/registry/modules.json`, running `npm run build:graph`, and running `npm run sync:memory`.
- Do not add or change APIs without updating `memory/API_CATALOG.md` and `graph/api-graph.json`.
- Do not add or change screens without updating `graph/ui-graph.json`.
- Do not create a frontend component before checking `ai/registry/components.json` and the active adapter component catalog.
- Do not create shared frontend components outside the active shared component root and its catalog.
- Do not create generic controls inside feature-local component folders when a shared component exists or should exist.
- Do not put backend business API, service, domain, repository, controller, mapper, SQL, or permission ownership outside the active adapter roots.
- Do not move feature-owned backend behavior into `backend/common/`; use `backend/common/` only for cross-module utilities with no feature ownership.
- Do not remove a feature without running `npm run ai:do -- <feature>` and recording the impact list, blockers, QA commands, and rollback notes.
- Do not apply deletion unless the user explicitly confirms the feature name.
- Do not make CI files that only echo success.
- Do not treat `npm run check` as proof that business runtime behavior is production ready.

## Required Evidence

Before closing a business task, report:

- Changed files.
- Commands run.
- Passing or failing verification output.
- Registry, memory, graph, and generated scan updates.
- Active task id and latest session note.
- Current change record under `ai/changes/`.
- Known risks and next actions.
- A traceability matrix for changed contracts: feature -> backend module -> API catalog/API graph -> frontend module/UI graph -> registry entry.

## Chat Command Entry

Use `npm run ai:do -- "新增功能：客户管理"`, `npm run ai:do -- "功能迭代：客户管理"`, `npm run ai:do -- "删除功能预分析：客户管理"`, or `npm run ai:do -- "确认删除：客户管理"` as the single Codex App chat-driven entry. Runtime implementation must stay inside `impact.allowedEditRoots` and finish with `npm run check`.
## Governance Discussion And Pre-Review Modes

Use these modes before complex business implementation:

| User intent | Codex mode | First action |
| --- | --- | --- |
| `功能讨论：...` | discussion-review | run `npm run resume`, then `npm run context:build -- customer`, then `npm run review:feature -- "功能讨论：..."` |
| `功能预审：...` | pre-implementation-review | run `npm run resume`, then `npm run context:build -- customer`, then `npm run review:feature -- "功能预审：..."` |

Complex add/update work must complete multi-role pre-review before implementation. If `ai/reviews/RV-*/decision.md` does not explicitly contain `Allow Implementation`, Codex must not implement the complex add/update request.

New Codex windows should first read:

- `AGENTS.md`
- `ai/context/current-context.md`
- `memory/HANDOVER.md`

Do not default to full reads of all `ai/changes`, all `ai/reviews`, all feature files, or all source code. Use `current-context` first, then open only the files whose reasons are listed in `ai/context/current-context.json`.

Business change 不允许改治理规则. If business implementation needs scanner, rule, script, workflow, package, skill, or profile changes, stop and create a separate `governance/rule-change` record.

治理 change 不允许改业务代码. Governance/rule-change work must stay on governance docs, scripts, tools, tests, registry/context/roadmap artifacts, change records, and memory unless the user explicitly opens business scope.

Do not create fake tests, fake CI, or scripts that only echo success. Every gate wired into `npm run check` must read real files or run real validation.

Sales-order development must pass the `beforeSalesOrder` gate before any sales-order controller, service, mapper, Vue page, API client, SQL table, route, or permission is created.
