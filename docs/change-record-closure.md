# Change Record Closure

Every Codex business change must keep a complete record under `ai/changes/<change-id>/`.

## Required files

```text
request.md
impact.json
plan.md
changed-files.json
verification.md
handover.md
```

`close:change` rejects a record when `changed-files.json` is empty, `impact.allowedEditRoots` is missing, a changed file is outside the allowed roots, or `verification.md` does not contain command evidence.

## Automatic finalization

Use:

```bash
npm run finalize:change -- --summary "Describe the completed work"
```

The finalizer populates:

- `changed-files.json`
- `plan.md`
- `verification.md`
- `handover.md`
- `memory/HANDOVER.md`
- `memory/CHANGELOG.md`
- `memory/TASKS.json`

The chat workflows call this automatically for add, update preparation, deletion dry-run, and deletion apply.

## Range gate

`npm run check:diff` compares the changed files with `impact.allowedEditRoots`. For feature work, expand the impact record before editing additional files. Do not bypass the gate by loosening rules without a rule-change record.
