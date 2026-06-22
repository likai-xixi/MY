# Architecture

The scaffold separates business implementation from governance artifacts.

## Governance Layer

- `AGENTS.md` gives Codex App the top-level working rules.
- `agents/` defines role contracts.
- `memory/` stores current project state and handoff evidence.
- `graph/` stores structured module, API, and UI relationships.
- `tools/` and `scripts/` make those contracts verifiable.

## Business Layer

- `backend/modules/<slug>/{api,service,domain,repository}/` contains server-side business boundaries.
- `frontend/src/modules/<slug>/` contains client-side business boundaries.
- `features/` contains feature briefs that drive changes.

## First Real Runtime Decision

This scaffold intentionally does not select Spring Boot, Express, Vue, React, or another runtime.
Pick those when the first real business module is ready.

Until a runtime is selected, `npm run check` is a governance gate. It proves scaffold consistency, not application runtime readiness.
