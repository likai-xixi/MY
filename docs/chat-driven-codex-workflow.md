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
