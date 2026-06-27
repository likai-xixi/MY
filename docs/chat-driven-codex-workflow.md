# Chat-Driven Codex Workflow

This template is designed so the user can work through Codex App chat instead of manually running long command sequences.

## User-facing commands

### Add a feature

Say:

```text
新增功能：<功能名>
业务要求：
1. ...
2. ...
```

Codex must automatically run the add-feature workflow, create a change record, create or update the feature registry, add module boundaries, update graph and memory files, then run checks.

### Update a feature

Say:

```text
功能迭代：<功能名>
我要改：
1. ...
2. ...
```

Codex must run resume, locate the feature in `ai/registry/features.json`, run impact analysis, change only the affected files unless the change record is expanded, update registry and documentation, then run checks.

### Remove a feature

First say:

```text
删除功能预分析：<功能名>
```

Codex must only run dry-run impact analysis and must not delete files.

After reviewing the impact list, say:

```text
确认删除：<功能名>
```

Codex may then apply deletion, run orphan checks, update registry, graph, memory, changelog, handover, and verification evidence.

## Why this exists

The user should describe business intent. Codex should operate the engineering workflow. The repository enforces the workflow with machine-readable registries, scan outputs, impact analysis, and CI gates.

## Chinese display-name resolver

Chinese-only feature names are resolved through `ai/registry/feature-id-dictionary.json`. If an active mapped feature already exists, `新增功能` is treated as an update request to avoid duplicate modules.

## Chat Command Entry

Use `npm run ai:do -- "新增功能：客户管理"`, `npm run ai:do -- "功能迭代：客户管理"`, `npm run ai:do -- "删除功能预分析：客户管理"`, or `npm run ai:do -- "确认删除：客户管理"` as the single Codex App chat-driven entry. Runtime implementation must stay inside `impact.allowedEditRoots` and finish with `npm run check`.

## Pre-release breaking-change mode

This project has not been released yet. The default is breaking: Codex should replace old contracts instead of adding compatibility layers for old code, old APIs, old enum values, old UI state, old permissions, or old development data.

When a feature iteration changes a contract, Codex should:

1. Run impact analysis and expand the change record when downstream modules are affected.
2. Update every affected backend, frontend, API, SQL, permission, registry, graph, memory, and test artifact to the new contract.
3. Rebuild or reset development data when needed, and record that requirement in the change record and handover.
4. Avoid old-data migrations for local development data unless the user explicitly asks for one.
5. Add compatibility only after explicit user approval, and document the sunset or removal path.

This does not bypass deletion safety. Removing a full feature still starts with `删除功能预分析：<功能名>` and requires `确认删除：<功能名>` before applying deletion.

## Four-light verification evidence

Every change record verification and handover must state these four lights explicitly:

1. `npm run check`: `passed`, `failed`, or `not-run`.
2. `GitHub Actions`: `passed`, `failed`, or `not-run`.
3. `verify:release`: `passed`, `failed`, or `not-run`.
4. `runtime acceptance`: `passed`, `failed`, or `not-run`.

If a light was not run, write `not-run`; do not infer it from another light. `npm run check passed` does not mean release ready. `CI passed` does not mean release ready. `verify:release` does not mean browser or runtime acceptance passed. Runtime acceptance evidence must name the API, browser, DB, or manual evidence used.
