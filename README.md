# Codex Auto Dev OS

This package is a chat-driven Codex App governance layer for long-running business software projects. It is not an ERP runtime and it does not contain production business code. Place it at the root of a real project so Codex sessions can resume context, keep feature ownership explicit, restrict edit scope, update memory, and run deterministic gates.

## What is included

- Session resume: `npm run resume` prints active feature, latest session, current change, required context, and next rule.
- Feature ledger: `ai/registry/features.json` separates machine `id` from display `name`, and records backend, frontend, API, UI, database, permission, menu, SQL, component, test, and document ownership. `ai/registry/feature-id-dictionary.json` maps Chinese business names to stable ASCII IDs.
- Module ledger: `ai/registry/modules.json` connects feature IDs to backend and frontend paths.
- Change records: every business change keeps `request.md`, `impact.json`, `plan.md`, `changed-files.json`, `verification.md`, and `handover.md` under `ai/changes/`.
- Automatic change finalization: `npm run finalize:change` writes changed files, verification evidence, handoff notes, changelog entries, and task memory.
- Adapter-aware scanners: generic projects and RuoYi projects use different backend, frontend, component, SQL, permission, and API scan roots.
- Git diff range gate: `npm run check:diff` rejects changed files outside `impact.allowedEditRoots`.
- Component governance: shared components must be registered in the component catalog; generic reusable controls are blocked inside feature-local component folders.
- Deletion ownership: delete dry-run lists feature files, registries, graph entries, API/UI ownership, database objects, permissions, SQL, mapper XML, menus, components, docs, orphan checks, and rollback notes.
- Full gate: `npm run check` runs scans, registries, graphs, memory, handoff, components, boundaries, stale-doc checks, orphan checks, rule lock, diff scope, duplicate scan, and tests.

## Normal Codex App workflow

The user should chat in business language. Codex should run the workflow.

### Add a feature

```text
新增功能：客户管理
业务要求：
1. 客户列表支持搜索。
2. 新增和编辑客户。
3. 保留操作记录。
```

Convenience command:

```bash
npm run ai:do -- "新增功能：客户管理"
```

This command creates the feature brief, module boundary files, registry entries, graph/memory updates, generated scans, change record evidence, and then runs `npm run check`.

Chinese-only chat commands are resolved through `ai/registry/feature-id-dictionary.json`. For example, `客户管理` maps to `customer`, `供应商管理` maps to `supplier`, and `库存管理` maps to `inventory`. If the same active feature already exists, an add request automatically switches to the update workflow instead of creating a duplicate module.

For names outside the dictionary, add an alias entry or use the explicit form:

```bash
npm run ai:do -- --id demo-feature --name 显示名称
```


### Update a feature

```text
功能迭代：客户管理
我要加客户等级筛选，并且弹窗里可以编辑客户等级。
```

Convenience command:

```bash
npm run ai:do -- "功能迭代：客户管理"
```

For real implementation work, Codex must run impact analysis and keep edits inside `impact.allowedEditRoots`:

```bash
npm run impact -- 客户管理
npm run finalize:change -- --summary "客户管理功能已更新"
npm run check
```

### Remove a feature

Dry-run first:

```bash
npm run ai:do -- "删除功能预分析：客户管理"
```

Apply only after explicit confirmation:

```bash
npm run ai:do -- "确认删除：客户管理"
```

The apply command deletes registered feature-owned paths, updates registries/graphs/memory, runs `npm run check:orphan -- customer`, finalizes the change record, and runs the full gate.

## Project base setup

The default adapter is `generic`. Use it for projects that follow these boundaries:

```text
backend/modules/<feature-id>/
frontend/src/modules/<feature-id>/
frontend/src/components/
```

For an original RuoYi/RuoYi-Vue style base, adopt the RuoYi adapter before business development:

```bash
npm run profile:setup
```

The RuoYi adapter uses these ownership roots:

```text
ruoyi-business/src/main/java/com/ruoyi/business/<feature>/
ruoyi-admin/src/main/java/com/ruoyi/web/controller/business/<feature>/
ruoyi-ui/src/views/<feature>/
ruoyi-ui/src/api/<feature>.contract.md
sql/<feature>.ownership.md
ruoyi-ui/src/components/
```

After `profile:lock`, business changes cannot edit scanners, rules, workflow scripts, package scripts, skills, or project profile files. Scanner upgrades must go through a rule-change record.

## Required commands

```bash
npm run resume
npm run scan:all
npm run finalize:change
npm run close:change
npm run check
```

`npm run check` is the repository governance gate. It does not replace runtime business tests. Once a real backend/frontend stack exists, add stack-specific build, unit, integration, browser, migration, and permission checks.

## Directory map

```text
AGENTS.md                          Top-level Codex contract
.codex/skills/                     Codex workflow skills
agents/                            Role contracts
ai/adapters/                       Generic and RuoYi adapter definitions
ai/registry/                       Feature, module, component, database, permission ledgers
ai/changes/                        Change records
ai/generated/                      Scanner outputs
ai/rules/                          Machine-readable policies
features/                          Human feature briefs
backend/modules/<feature-id>/      Generic backend feature boundary
frontend/src/modules/<feature-id>/ Generic frontend feature boundary
frontend/src/components/           Generic shared components
ruoyi-*                            RuoYi roots created when the RuoYi adapter is adopted
graph/                             Module/API/UI graph files
memory/                            Project state, tasks, changelog, handover, sessions
tools/                             Scanners and validators
scripts/                           Workflow automation
```

## Guarantee boundary

This scaffold can force Codex to keep ownership, scope, memory, graph, component, and handoff evidence aligned. It can make disorder visible and block many unsafe edits. It cannot prove business semantics, UI acceptance, database migration safety, or production behavior without real tests and review.

## Chat Command Entry

Use `npm run ai:do -- "新增功能：客户管理"`, `npm run ai:do -- "功能迭代：客户管理"`, `npm run ai:do -- "删除功能预分析：客户管理"`, or `npm run ai:do -- "确认删除：客户管理"` as the single Codex App chat-driven entry. Runtime implementation must stay inside `impact.allowedEditRoots` and finish with `npm run check`.
