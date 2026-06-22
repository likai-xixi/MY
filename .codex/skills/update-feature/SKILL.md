# Update Feature Skill

Use this skill when the user says `功能迭代：<中文功能名或feature-id>` or asks Codex to change existing behavior.

## Steps

1. Run `npm run resume`.
2. Locate the feature in `ai/registry/features.json`.
3. Create a change record or use `npm run ai:do -- "功能迭代：<中文功能名或feature-id>"` for a prepared update record.
4. Run `npm run impact -- <中文功能名或feature-id>`.
5. Restrict edits to `impact.allowedEditRoots` unless the change record is expanded with evidence.
6. Before creating frontend components, read `ai/registry/components.json` and the active adapter component catalog.
7. Update registry, graph, generated scans, memory, docs, tests, changelog, and handover.
8. Run `npm run finalize:change` and `npm run check`.

## User-facing summary

Report what changed, why it changed, commands run, verification result, and residual risk.
