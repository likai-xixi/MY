# Codex App Chat Usage

This template is designed to be controlled from the Codex App chat window with business-language commands. The user should not have to manually run the full governance sequence. Codex must run it.

## First message in a new Codex session

```text
先接管项目。先读 AGENTS.md 和 START_HERE_CN.md，运行 npm run resume。之后所有新增、修改、删除功能都必须走 npm run ai:do，不允许绕过 registry、graph、memory、handover、changelog。完成前必须运行 npm run finalize:change 和 npm run check。
```

## Add

```text
新增功能：客户管理
业务要求：...
```

Codex runs:

```bash
npm run resume
npm run ai:do -- "新增功能：客户管理"
npm run scan:all
npm run finalize:change
npm run check
```

## Update

```text
功能迭代：客户管理
我要改：...
```

Codex runs `npm run ai:do` first. That command opens a change record and writes impact analysis. Codex must then implement inside `impact.allowedEditRoots`; the change must remain open until code, registry, graph, generated scans, memory, handover, changelog, and verification are complete.

## Remove

Deletion is never one-step.

```text
删除功能预分析：客户管理
```

Review the impact list. Then send:

```text
确认删除：客户管理
```

The apply step writes a rollback bundle under `ai/deletions/<feature>/<timestamp>/` before files are removed.

## Completion checklist

Codex may only claim completion after reporting:

- current change record path
- changed files
- commands run
- ownership sync result
- `npm run check` result
- runtime risks that still need manual or stack-specific testing
