# Session: Final Chat-Driven Template

## Task

`TASK-0001` prepares the scaffold to be used as the Codex App governance root for the first real business feature.

## Status

`todo` remains open because the next step is to install this scaffold into a real project and request the first production feature.

## Goal

Convert the scaffold from a document-guided template into a chat-driven governance package with machine-readable registries, change records, impact analysis, generated scans, deletion checks, and Codex Skills.

## Changed Files

- `AGENTS.md`
- `README.md`
- `.codex/skills/`
- `ai/registry/`
- `ai/changes/`
- `ai/generated/`
- `ai/rules/`
- `docs/chat-driven-codex-workflow.md`
- `docs/final-template-architecture.md`
- `scripts/`
- `tools/`
- `package.json`
- `memory/`

## Commands

- `npm run build:graph`
- `npm run sync:memory`
- `npm run scan:all`
- `npm run check`

## Verification

`npm run check` is the final governance gate for this template. It should pass before the package is handed to Codex App for real project work.

## Risks

- Real runtime correctness depends on stack-specific tests that are not part of this generic scaffold.
- Semantic duplicate detection for components is heuristic.
- Deletion apply mode must remain gated by explicit user confirmation.

## Next Entry Point

Open the real project in Codex App, ask Codex to read `AGENTS.md`, run `npm run resume`, then issue a chat request such as `新增功能：客户管理`.
