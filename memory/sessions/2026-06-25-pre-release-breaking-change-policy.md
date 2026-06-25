# Session: Pre-Release Breaking Change Policy

## Task

TASK-0002 - platform governance for `CR-20260625T143256Z-pre-release-breaking-change-policy`.

## Status

verified

## Goal

Make this unreleased project default to breaking-change development: do not preserve old-code or old-data compatibility by default, allow recorded development data reset/rebuild, and require explicit user approval before adding compatibility layers.

## Changed Files

- `ai/rules/pre-release-policy.json`
- `tools/pre-release-policy-checker.js`
- `tests/pre-release-policy.test.js`
- `AGENTS.md`
- `docs/chat-driven-codex-workflow.md`
- `package.json`
- `ai/changes/CR-20260625T143256Z-pre-release-breaking-change-policy/*`
- `ai/rule-proposals/2026-06-25-pre-release-breaking-change-policy.json`
- `ai/context/current-context.*`
- `memory/HANDOVER.md`
- `memory/PROJECT_STATE.md`
- `memory/TASKS.json`
- `memory/CHANGELOG.md`

## Commands

- [local] `npm run resume` - passed.
- [local] `npm run rule:propose -- "pre-release breaking change policy" --reason "..."` - created the rule proposal.
- [local] `npm run start:change -- --mode rule-change "pre-release breaking change policy"` - created the CR.
- [local] `npm run context:build -- customer` - regenerated focused current context.
- [local] `node --test tests/pre-release-policy.test.js` - passed with 4 tests.
- [local] `npm run check:pre-release-policy` - passed.
- [local] `node --test tests/boundary-lint.test.js` - passed with 9 tests after current-CR baseline exception notes.
- [local] `node --test tests/component-checker.test.js` - passed with 8 tests after current-CR baseline exception notes.
- [local] `npm test` - passed with 178 tests.
- [local] `npm run check` - passed with 178 tests after provenance markers were recorded.
- [local] `git diff --check` - passed during final closeout after handoff edits.
- [local] forbidden-path audit - passed with `FORBIDDEN_PATH_AUDIT_OK` during final closeout after handoff edits.

## Verification

- [local] The new policy checker enforces `defaultCompatibilityMode: breaking-change`, explicit compatibility approval, development data reset allowance, production/released data migration planning, and cross-module impact expansion.
- [local] `npm run check:pre-release-policy` is wired into the main `npm run check` script.
- [local] `AGENTS.md` and `docs/chat-driven-codex-workflow.md` now tell future Codex sessions to replace old contracts by default during pre-release work instead of adding compatibility layers.
- [local] Full `npm run check` passed with existing non-blocking warnings only: development/default config-safety warnings and the customer baseline migration markdown warning in `check:high-risk-governance`.
- [local] No customer runtime Java/Vue/mapper/API/SQL files, sales-order runtime files, delivery/finance/production runtime files, or business database table structures were modified.

## Risks

- This policy is intentionally pre-release only. Production or already-released data still needs explicit migration and rollback evidence.
- Future cross-module breaking changes must still expand the active change record and allowed edit roots before implementation.
- Feature deletion remains separate: dry-run first, then explicit user confirmation with the feature name.

## Next Entry Point

Review `CR-20260625T143256Z-pre-release-breaking-change-policy`. For future feature iterations, Codex should replace old code/data contracts by default during pre-release work and only add compatibility after explicit user approval.
