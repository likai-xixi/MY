# Final Template Architecture

The scaffold uses three layers of control.

## 1. Human chat layer

The user only needs to say whether they are adding, changing, or removing a feature. Codex translates that request into the repository workflow.

## 2. Governance layer

The governance layer is stored in:

- `AGENTS.md`
- `agents/`
- `.codex/skills/`
- `ai/registry/`
- `ai/changes/`
- `memory/`
- `graph/`

This layer tells Codex what exists, what changed, what may be edited, and what evidence is required.

## 3. Validation layer

The validation layer is stored in:

- `tools/`
- `scripts/`
- `.github/workflows/ci.yml`

It checks registry consistency, module boundaries, component reuse rules, generated scan outputs, stale documentation, orphan references, handover quality, and CI integrity.
