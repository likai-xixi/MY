# Add Feature Skill

Use this skill when the user says `新增功能：<中文功能名>` or asks Codex to add a business module.

## Steps

1. Run `npm run resume`.
2. Prefer `npm run ai:do -- "新增功能：<中文功能名>"` for scaffold creation and automatic closure. Use `--id demo-feature --name 显示名称` only when the dictionary has no mapping.
3. For real implementation beyond scaffold files, read the active adapter profile and keep paths inside the adapter roots.
4. Update `ai/registry/features.json` with backend, frontend, API, UI, database, permission, menu, SQL, mapper XML, component, test, and documentation ownership.
5. Update module/API/UI graphs, generated scans, memory, changelog, tests, and handover.
6. Run `npm run finalize:change` if the workflow did not already call it.
7. Run `npm run check`.

## User-facing summary

Report changed files, commands, verification result, risks, and the next entry point.
