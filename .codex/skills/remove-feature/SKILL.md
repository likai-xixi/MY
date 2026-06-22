# Remove Feature Skill

Use this skill when the user asks to remove a feature.

## Dry-run mode

When the user says `删除功能预分析：<中文功能名或feature-id>`:

1. Run `npm run resume`.
2. Run `npm run ai:do -- "删除功能预分析：<中文功能名或feature-id>"`.
3. Record the impact list under `ai/changes/`.
4. Report files, API endpoints, UI screens, database objects, permissions, SQL files, mapper XML files, menu rows, components, docs, blockers, QA commands, and rollback notes.
5. Do not delete files.

## Apply mode

When the user says `确认删除：<中文功能名或feature-id>`:

1. Confirm the dry-run target.
2. Run `npm run ai:do -- "确认删除：<中文功能名或feature-id>"`; the chat workflow resolves the feature ID from registry/dictionary and passes the internal confirmation.
3. Verify that orphan detection and the full `npm run check` gate pass.
4. Report deleted paths, updated ownership files, verification evidence, residual risks, and rollback source.

## User-facing summary

Report what was deleted, what was updated, orphan scan result, verification result, and rollback path.
