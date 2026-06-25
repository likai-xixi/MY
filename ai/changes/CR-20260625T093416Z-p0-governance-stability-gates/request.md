# Request

Governance/rule-change task: add P0 stability gates before the next business implementation work.

## Goal

Add deterministic Node governance gates that prevent:

- current-facing documentation from recording volatile Git/push state;
- feature-owned tests from missing `ai/registry/features.json` ownership;
- production configuration from keeping unsafe development defaults;
- verification and handover text from claiming results without provenance;
- current docs from claiming CI Maven/frontend/runtime coverage that GitHub Actions does not run.

Also add an after-push handover checker for publish workflows, but do not wire it into `npm run check`.

## Scope

This is a `governance/rule-change` batch. It may change tools, tests, governance registries, current context, memory, change records, package scripts, and governance documentation only.

## Non-Goals

- No customer runtime Java/Vue/Mapper/API-client/SQL behavior change.
- No sales-order code.
- No business database table structure change.
- No gate relaxation.
- No fake tests, fake CI, or echo-success scripts.
- No P1/P2 semantic gate expansion.
