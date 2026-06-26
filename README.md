# MY Door ERP - RuoYi + Vue3 + Codex Auto Dev OS

This repository is the MY door-industry ERP workspace. It combines a RuoYi Spring Boot backend, a RuoYi Vue3 frontend, the Codex Auto Dev OS governance layer, and the currently implemented `customer` customer-management business module.

Codex Auto Dev OS is kept in the repository as the workflow and evidence layer: it resumes context, keeps feature ownership explicit, restricts edit scope, updates project memory, and runs deterministic governance gates around the real ERP codebase.

## Current project status

- Runtime stack: RuoYi + Vue3.
- Governance layer: Codex Auto Dev OS with locked RuoYi adapter rules.
- Business domain: MY 门业 ERP.
- Implemented business module: `customer` / 客户管理.
- Current closeout focus: R-03 customer fund vocabulary source cleanup keeps current customer context, contracts, README, and memory aligned to two account types: `CUSTOMER_DEPOSIT` (客户级定金) and `SAMPLE_REBATE` (样品返现).
- CI baseline: [ci-planned] GitHub Actions workflow includes Node governance, Maven compile, and ruoyi-ui build; actual CI result is determined after push.
- Production safety baseline: default/dev configuration is not production-ready; production must use `ruoyi-admin/src/main/resources/application-prod.yml`.
- Production gate: use `npm run check:prod-safety` to block unsafe production defaults, and use `npm run verify:release` as the release verification entry.
- Customer fund boundary: current customer management implements `CUSTOMER_DEPOSIT` incoming deposit only; sales-order may show deposit status but must not deduct customer funds directly; later delivery / finance contracts define `CUSTOMER_DEPOSIT` deduction/refund/adjustment/reversal and `SAMPLE_REBATE` deduction.

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
- High-risk semantic governance: CR-3 adds `check:high-risk-governance`, high-risk domain registries, evidence/contract/idempotency/state-machine/migration/permission schemas, and framework checks. It is framework-only; `beforeSalesOrder` remains blocked and sales-order contracts remain CR-4 scope.

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
npm run check:prod-safety
npm run verify:release
```

`npm run check` is the repository governance gate. It does not prove production safety and does not replace runtime business tests. `npm run check:prod-safety` is the production safety baseline gate, and `npm run verify:release` explicitly runs governance, production safety, backend compile, and frontend production build before a release candidate is considered.

## GitHub Actions CI Baseline

`.github/workflows/ci.yml` contains three real baseline jobs:

- `governance`: Java 17 with Maven cache and Node 20 setup, root `npm install --package-lock=false`, then `npm run check`.
- `backend-compile`: Java 17 with Maven cache, then `mvn -pl ruoyi-admin -am -DskipTests compile`.
- `frontend-build`: `npm --prefix ruoyi-ui install --package-lock=false`, then `npm --prefix ruoyi-ui run build:prod`.

The repository root and `ruoyi-ui` currently have no `package-lock.json`, so the CI workflow uses `npm install --package-lock=false` instead of `npm ci` and does not generate or commit lockfile changes.

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
## Governance Pre-Review And Current Context

For complex feature discussion or pre-implementation review, use:

```bash
npm run context:build -- customer
npm run review:feature -- "功能预审：..."
```

`context:build` writes a compact `ai/context/current-context.md` and `ai/context/current-context.json` so new Codex windows can start from the current handoff instead of bulk-reading all historical changes, reviews, features, or source code.

`review:feature` writes a structured `ai/reviews/RV-*` package. Complex implementation stays blocked until the review decision intentionally contains `Allow Implementation`.

Sales-order implementation must pass the `beforeSalesOrder` gate first. Governance/rule-change work may improve the gate itself, but it must not create sales-order code, change customer business code, or alter business database table structure.

CR-3 high-risk semantic governance is documented in `docs/high-risk-semantic-governance.md`. Evidence freshness is framework-only until machine evidence manifests exist; existing customer migration DDL is a baseline warning, while future required migrations must be executable.
