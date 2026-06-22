# Chat Business Workflow Skill

Use this skill whenever the user drives Codex App through Chinese business chat commands such as `新增功能`, `功能迭代`, `修改功能`, `删除功能预分析`, or `确认删除`.

## Non-negotiable flow

1. Read `AGENTS.md`, `START_HERE_CN.md`, and `docs/chat-driven-codex-workflow.md`.
2. Run `npm run resume` before touching business code.
3. Route the user request through the single command entry: `npm run ai:do -- "<完整中文需求>"`.
4. For add/update/delete work, read the generated `ai/changes/<CR>/impact.json`.
5. Only edit files inside `impact.allowedEditRoots`. Do not create side modules, duplicate shared components, or unregistered helper layers.
6. Before creating any component, search `ai/registry/components.json`, `frontend/src/components/catalog.json`, and `ruoyi-ui/src/components/catalog.json` when present. Reuse or extend existing shared components first.
7. After implementation, run `npm run scan:all`, `npm run sync:ownership`, `npm run finalize:change`, and `npm run check`.
8. Do not say the task is finished while `npm run check` fails.
9. Final response must include changed files, commands run, current change record path, verification result, and remaining risks.

## Add feature

When the user says `新增功能：客户管理`, do not ask the user to manually run commands. Run `npm run ai:do -- "新增功能：客户管理"`, then implement runtime backend/frontend/SQL/menu/permission/tests under the registered ownership paths.

## Update feature

When the user says `功能迭代：客户管理`, `修改功能：客户管理`, or equivalent, `npm run ai:do` prepares an open change record and impact gate. Keep that change open while implementing code. Only close it after implementation, ownership sync, memory sync, and verification.

## Remove feature

Deletion is two-step only.

1. `删除功能预分析：<功能>`: dry-run only; list files, registry entries, SQL/menu/permission/API/UI impact, blockers, and rollback bundle path.
2. `确认删除：<功能>`: apply only after dry-run review. The removal workflow must write `ai/deletions/<feature>/<timestamp>/` with impact, file list, registry snapshot, copied deleted files, and rollback instructions.

## RuoYi-specific ownership

For RuoYi projects, ownership must include Controller, Service, Mapper, Domain, Mapper XML, Vue views, frontend API modules, SQL/menu files, permissions, database tables, and dictionary/menu references when present.
