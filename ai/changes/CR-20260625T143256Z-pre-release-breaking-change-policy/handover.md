# Handover

## Summary

未发布阶段默认破坏式迭代，不做旧代码旧数据兼容

## Impact

This governance/rule-change adds a machine-readable pre-release policy and wires it into `npm run check`. Future Codex feature iterations should replace old API/UI/enum/permission/SQL/development-data contracts by default while the project is unreleased, and add compatibility only after explicit user approval.

## Changed Files

- `AGENTS.md`
- `docs/chat-driven-codex-workflow.md`
- `ai/rules/pre-release-policy.json`
- `tools/pre-release-policy-checker.js`
- `tests/pre-release-policy.test.js`
- `package.json`
- `ai/rule-proposals/2026-06-25-pre-release-breaking-change-policy.json`
- `ai/changes/CR-20260625T143256Z-pre-release-breaking-change-policy/*`
- `ai/context/current-context.*`
- `memory/HANDOVER.md`
- `memory/PROJECT_STATE.md`
- `memory/TASKS.json`
- `memory/CHANGELOG.md`
- `memory/sessions/2026-06-25-pre-release-breaking-change-policy.md`

## Commands

- [local] `npm run resume`
- [local] `npm run rule:propose -- "pre-release breaking change policy" --reason "..."`
- [local] `npm run start:change -- --mode rule-change "pre-release breaking change policy"`
- [local] `npm run context:build -- customer`
- [local] `node --test tests/pre-release-policy.test.js`
- [local] `npm run check:pre-release-policy`
- [local] `node --test tests/boundary-lint.test.js`
- [local] `node --test tests/component-checker.test.js`
- [local] `npm test`
- [local] `npm run check`
- [local] `git diff --check`
- [local] forbidden-path audit

## Verification

[local] Dedicated policy tests passed, full `npm test` passed with 178 tests, and `npm run check` passed after provenance markers were recorded. The final gate retained existing non-blocking warnings only: development/default config-safety warnings and the customer baseline migration markdown warning in `check:high-risk-governance`.

## Risks

- This CR changes governance behavior only; no customer runtime behavior was modified or runtime-tested.
- Future production/released data still needs explicit migration and rollback planning even though development data can be reset during pre-release work.
- Feature deletion remains separate: dry-run first, then explicit user confirmation with the feature name.

## Next Actions

- Review this governance CR, then use the policy for future feature iterations: replace old contracts by default during pre-release work, and add compatibility only after explicit user approval.
- Commit or push only after explicit user confirmation.
